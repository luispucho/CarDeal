using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CarDeal.Api.Data;
using CarDeal.Api.DTOs;
using CarDeal.Api.Models;
using System.Net.Http.Headers;
using System.Security.Claims;
using System.Text.Json;

namespace CarDeal.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AnalyticsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IHttpClientFactory _httpClientFactory;

    public AnalyticsController(AppDbContext db, IHttpClientFactory httpClientFactory)
    {
        _db = db;
        _httpClientFactory = httpClientFactory;
    }

    /// <summary>
    /// Ingest a page view event (public, no auth required).
    /// If no location provided, attempts IP-based geolocation.
    /// </summary>
    [HttpPost("pageview")]
    [AllowAnonymous]
    public async Task<IActionResult> TrackPageView(TrackPageViewRequest request)
    {
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();

        var city = request.City;
        var country = request.Country;
        double? lat = request.Latitude;
        double? lon = request.Longitude;

        // IP-based geolocation fallback
        if (string.IsNullOrEmpty(city) && string.IsNullOrEmpty(country) && !string.IsNullOrEmpty(ip))
        {
            var geo = await ResolveLocationFromIpAsync(ip);
            if (geo != null)
            {
                city = geo.City;
                country = geo.Country;
                lat = geo.Lat;
                lon = geo.Lon;
            }
        }

        var pageView = new PageView
        {
            Page = request.Page,
            CarId = request.CarId,
            TenantId = request.TenantId,
            City = city,
            Country = country,
            Latitude = lat,
            Longitude = lon,
            IpAddress = ip,
            SessionId = request.SessionId,
            DurationSeconds = request.DurationSeconds
        };

        _db.PageViews.Add(pageView);
        await _db.SaveChangesAsync();

        return Ok();
    }

    /// <summary>
    /// Update duration for an existing page view (e.g., when user leaves the page).
    /// </summary>
    [HttpPatch("pageview/duration")]
    [AllowAnonymous]
    public async Task<IActionResult> UpdateDuration([FromBody] UpdateDurationRequest request)
    {
        var pageView = await _db.PageViews
            .Where(pv => pv.SessionId == request.SessionId && pv.Page == request.Page)
            .OrderByDescending(pv => pv.CreatedAt)
            .FirstOrDefaultAsync();

        if (pageView != null)
        {
            pageView.DurationSeconds = request.DurationSeconds;
            await _db.SaveChangesAsync();
        }

        return Ok();
    }

    /// <summary>
    /// Get visitor insights for a tenant (last 30 days).
    /// </summary>
    [HttpGet("stats")]
    [Authorize(Roles = "Admin,TenantAdmin,SuperAdmin")]
    public async Task<ActionResult<VisitorInsightsResponse>> GetStats([FromQuery] int? tenantId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var user = await _db.Users.FindAsync(userId);
        var isSuperAdmin = User.IsInRole("SuperAdmin");

        // Determine tenant scope
        int? scopeTenantId = tenantId;
        if (!isSuperAdmin)
            scopeTenantId = user?.TenantId;

        var since = DateTime.UtcNow.AddDays(-30);
        var query = _db.PageViews.Where(pv => pv.CreatedAt >= since);

        if (scopeTenantId.HasValue)
            query = query.Where(pv => pv.TenantId == scopeTenantId.Value);

        var views = await query.ToListAsync();

        var totalVisits = views.Count;
        var uniqueVisitors = views.Select(v => v.SessionId).Distinct().Count();
        var avgDuration = views.Where(v => v.DurationSeconds.HasValue && v.DurationSeconds > 0)
            .Select(v => (double)v.DurationSeconds!.Value)
            .DefaultIfEmpty(0)
            .Average();

        var topLocations = views
            .Where(v => !string.IsNullOrEmpty(v.Country))
            .GroupBy(v => new { v.Country, v.City })
            .Select(g => new LocationStat(g.Key.Country!, g.Key.City, g.Count()))
            .OrderByDescending(l => l.Visits)
            .Take(10)
            .ToList();

        var pageViews = views
            .GroupBy(v => v.Page)
            .Select(g => new PageStat(
                g.Key,
                g.Count(),
                g.Where(v => v.DurationSeconds.HasValue && v.DurationSeconds > 0)
                    .Select(v => (double)v.DurationSeconds!.Value)
                    .DefaultIfEmpty(0)
                    .Average()))
            .OrderByDescending(p => p.Visits)
            .Take(10)
            .ToList();

        var topViewedCars = await query
            .Where(pv => pv.CarId.HasValue)
            .GroupBy(pv => pv.CarId!.Value)
            .Select(g => new { CarId = g.Key, Views = g.Count() })
            .OrderByDescending(x => x.Views)
            .Take(10)
            .ToListAsync();

        var carIds = topViewedCars.Select(c => c.CarId).ToList();
        var cars = await _db.Cars
            .Where(c => carIds.Contains(c.Id))
            .ToDictionaryAsync(c => c.Id);

        var topCarsResult = topViewedCars
            .Where(tc => cars.ContainsKey(tc.CarId))
            .Select(tc => new CarViewStat(
                tc.CarId,
                cars[tc.CarId].Make,
                cars[tc.CarId].Model,
                cars[tc.CarId].Year,
                tc.Views))
            .ToList();

        var dailyVisits = views
            .GroupBy(v => v.CreatedAt.Date)
            .Select(g => new DailyVisitStat(g.Key.ToString("yyyy-MM-dd"), g.Count()))
            .OrderBy(d => d.Date)
            .ToList();

        return Ok(new VisitorInsightsResponse(
            totalVisits, uniqueVisitors, Math.Round(avgDuration, 1),
            topLocations, pageViews, topCarsResult, dailyVisits));
    }

    private async Task<GeoResult?> ResolveLocationFromIpAsync(string ip)
    {
        // Skip private/localhost IPs
        if (ip == "::1" || ip == "127.0.0.1" || ip.StartsWith("10.") || ip.StartsWith("192.168."))
            return null;

        try
        {
            var client = _httpClientFactory.CreateClient();
            client.Timeout = TimeSpan.FromSeconds(3);
            var response = await client.GetAsync($"http://ip-api.com/json/{ip}?fields=status,country,city,lat,lon");
            if (!response.IsSuccessStatusCode) return null;

            var json = await response.Content.ReadFromJsonAsync<JsonElement>();
            if (json.GetProperty("status").GetString() != "success") return null;

            return new GeoResult
            {
                City = json.TryGetProperty("city", out var c) ? c.GetString() : null,
                Country = json.TryGetProperty("country", out var co) ? co.GetString() : null,
                Lat = json.TryGetProperty("lat", out var la) ? la.GetDouble() : null,
                Lon = json.TryGetProperty("lon", out var lo) ? lo.GetDouble() : null,
            };
        }
        catch
        {
            return null;
        }
    }

    private class GeoResult
    {
        public string? City { get; set; }
        public string? Country { get; set; }
        public double? Lat { get; set; }
        public double? Lon { get; set; }
    }
}

public record UpdateDurationRequest(string SessionId, string Page, int DurationSeconds);
