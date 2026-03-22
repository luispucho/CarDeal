using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CarDeal.Api.Data;
using CarDeal.Api.DTOs;
using CarDeal.Api.Models;

namespace CarDeal.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PublicController : ControllerBase
{
    private readonly AppDbContext _db;

    public PublicController(AppDbContext db) => _db = db;

    [HttpGet("cars")]
    public async Task<ActionResult<List<PublicCarResponse>>> GetCars(
        [FromQuery] string? make, [FromQuery] int? yearMin, [FromQuery] int? yearMax,
        [FromQuery] decimal? priceMin, [FromQuery] decimal? priceMax,
        [FromQuery] string? listingType, [FromQuery] int? tenantId, [FromQuery] string? sort)
    {
        var query = _db.Cars
            .Include(c => c.Images)
            .Include(c => c.Tenant)
            .Where(c => c.Status != CarStatus.Sold &&
                        c.Status != CarStatus.Rejected &&
                        c.Status != CarStatus.Withdrawn &&
                        c.Status != CarStatus.Pending)
            .Where(c => c.ListingType == Models.ListingType.Inventory ||
                        c.ListingType == Models.ListingType.CertifiedInventory ||
                        c.ListingType == Models.ListingType.TrustedPartner ||
                        (c.ListingType == Models.ListingType.Consigned && c.TenantId != null))
            .AsQueryable();

        if (!string.IsNullOrEmpty(make))
            query = query.Where(c => c.Make.ToLower().Contains(make.ToLower()));
        if (yearMin.HasValue) query = query.Where(c => c.Year >= yearMin.Value);
        if (yearMax.HasValue) query = query.Where(c => c.Year <= yearMax.Value);
        if (priceMin.HasValue) query = query.Where(c => c.AskingPrice >= priceMin.Value);
        if (priceMax.HasValue) query = query.Where(c => c.AskingPrice <= priceMax.Value);
        if (tenantId.HasValue) query = query.Where(c => c.TenantId == tenantId.Value);
        if (!string.IsNullOrEmpty(listingType) && Enum.TryParse<ListingType>(listingType, true, out var lt))
            query = query.Where(c => c.ListingType == lt);

        query = query.Where(c => c.Tenant == null || c.Tenant.IsActive);

        query = sort switch
        {
            "price_asc" => query.OrderBy(c => c.AskingPrice),
            "price_desc" => query.OrderByDescending(c => c.AskingPrice),
            "year_desc" => query.OrderByDescending(c => c.Year),
            "mileage_asc" => query.OrderBy(c => c.Mileage),
            _ => query.OrderByDescending(c => c.CreatedAt),
        };

        var cars = await query.ToListAsync();
        return Ok(cars.Select(MapToPublic).ToList());
    }

    [HttpGet("cars/featured")]
    public async Task<ActionResult<List<PublicCarResponse>>> GetFeatured()
    {
        var cars = await _db.Cars
            .Include(c => c.Images)
            .Include(c => c.Tenant)
            .Where(c => c.IsFeatured &&
                c.Status != CarStatus.Sold &&
                c.Status != CarStatus.Pending &&
                c.Status != CarStatus.Rejected &&
                c.Status != CarStatus.Withdrawn)
            .Where(c => c.ListingType == Models.ListingType.Inventory ||
                c.ListingType == Models.ListingType.CertifiedInventory ||
                c.ListingType == Models.ListingType.TrustedPartner ||
                (c.Status == CarStatus.Consigned && c.ListingType == Models.ListingType.Consigned && c.TenantId != null))
            .Where(c => c.Tenant == null || c.Tenant.IsActive)
            .OrderByDescending(c => c.UpdatedAt)
            .Take(6)
            .ToListAsync();

        return Ok(cars.Select(MapToPublic).ToList());
    }

    [HttpGet("cars/{id}")]
    public async Task<ActionResult<PublicCarResponse>> GetCar(int id)
    {
        var car = await _db.Cars
            .Include(c => c.Images)
            .Include(c => c.Tenant)
            .FirstOrDefaultAsync(c => c.Id == id &&
                c.Status != CarStatus.Sold &&
                c.Status != CarStatus.Pending &&
                c.Status != CarStatus.Rejected &&
                c.Status != CarStatus.Withdrawn &&
                (c.ListingType == Models.ListingType.Inventory ||
                 c.ListingType == Models.ListingType.CertifiedInventory ||
                 c.ListingType == Models.ListingType.TrustedPartner ||
                 (c.ListingType == Models.ListingType.Consigned && c.TenantId != null)) &&
                (c.Tenant == null || c.Tenant.IsActive));

        return car == null ? NotFound() : Ok(MapToPublic(car));
    }

    [HttpGet("branding/{tenantSlug}")]
    public async Task<ActionResult<TenantBrandingResponse>> GetTenantBranding(string tenantSlug)
    {
        var tenant = await _db.Tenants
            .Include(t => t.Branding)
            .FirstOrDefaultAsync(t => t.Slug == tenantSlug);

        if (tenant == null) return NotFound();

        var branding = tenant.Branding;
        if (branding == null)
            return Ok(new TenantBrandingResponse(
                0, tenant.Id, tenant.Name, tenant.Tier.ToString(),
                "#2563eb", "#1e40af", "#3b82f6", "#1f2937", "#ffffff",
                null, null, tenant.Name, null,
                "en",
                null, null));

        return Ok(new TenantBrandingResponse(
            branding.Id, branding.TenantId, tenant.Name, tenant.Tier.ToString(),
            branding.PrimaryColor, branding.SecondaryColor, branding.AccentColor,
            branding.TextColor, branding.BackgroundColor,
            branding.LogoUrl, branding.FaviconUrl, branding.DealerName, branding.Tagline,
            branding.Language,
            branding.LandingLayoutJson, branding.CustomDomain));
    }

    [HttpGet("tenants")]
    public async Task<IActionResult> GetTenants()
    {
        var tenants = await _db.Tenants
            .Include(t => t.Branding)
            .Where(t => t.IsActive)
            .OrderBy(t => t.Name)
            .Select(t => new
            {
                t.Id,
                t.Name,
                t.Slug,
                LogoUrl = t.Branding != null ? t.Branding.LogoUrl : t.LogoUrl,
                Tier = t.Tier.ToString()
            })
            .ToListAsync();

        return Ok(tenants);
    }

    private static PublicCarResponse MapToPublic(Car car) => new(
        car.Id, car.Make, car.Model, car.Year, car.Mileage,
        car.Color, car.Condition, car.Description, car.AskingPrice,
        car.ListingType.ToString(),
        car.Tenant?.Name, car.TenantId,
        car.Images.Select(i => new CarImageResponse(i.Id, i.BlobUrl, i.FileName, i.IsPrimary, i.UploadedAt)).ToList()
    );
}
