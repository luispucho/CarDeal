using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using CarDeal.Api.DTOs;
using CarDeal.Api.Models;
using CarDeal.Api.Services;

namespace CarDeal.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin,SuperAdmin")]
public class AdminController : ControllerBase
{
    private readonly ICarService _carService;
    private readonly IOfferService _offerService;
    private readonly UserManager<User> _userManager;

    public AdminController(ICarService carService, IOfferService offerService, UserManager<User> userManager)
    {
        _carService = carService;
        _offerService = offerService;
        _userManager = userManager;
    }

    private string UserId => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

    private async Task<int?> GetCurrentUserTenantIdAsync()
    {
        if (User.IsInRole("SuperAdmin")) return null;
        var user = await _userManager.FindByIdAsync(UserId);
        return user?.TenantId;
    }

    [HttpGet("dashboard")]
    public async Task<ActionResult<DashboardStatsResponse>> GetDashboard()
    {
        var allCars = await _carService.GetAllAsync();
        var tenantId = await GetCurrentUserTenantIdAsync();
        if (tenantId.HasValue)
            allCars = allCars.Where(c => c.TenantId == tenantId.Value).ToList();
        var consignments = await _offerService.GetConsignmentsAsync();

        return Ok(new DashboardStatsResponse(
            TotalCars: allCars.Count,
            PendingCars: allCars.Count(c => c.Status == "Pending"),
            ActiveOffers: allCars.SelectMany(c => c.Offers ?? Enumerable.Empty<OfferResponse>()).Count(o => o.Status == "Pending"),
            ActiveConsignments: consignments.Count(c => c.Status == "Active"),
            TotalUsers: 0, // Would need UserManager injection for accurate count
            RecentSubmissions: allCars.Take(10).ToList()
        ));
    }

    [HttpGet("cars")]
    public async Task<ActionResult<List<CarResponse>>> GetAllCars([FromQuery] string? status)
    {
        var allCars = await _carService.GetAllAsync(status);
        var tenantId = await GetCurrentUserTenantIdAsync();
        if (tenantId.HasValue)
            allCars = allCars.Where(c => c.TenantId == tenantId.Value).ToList();
        return Ok(allCars);
    }

    [HttpGet("cars/{id}")]
    public async Task<ActionResult<CarResponse>> GetCar(int id)
    {
        var car = await _carService.GetByIdAsync(id);
        return car == null ? NotFound() : Ok(car);
    }

    [HttpPost("cars/{carId}/offer")]
    public async Task<ActionResult<OfferResponse>> MakeOffer(int carId, CreateOfferRequest request)
        => Ok(await _offerService.CreateAsync(carId, UserId, request));

    [HttpPut("offers/{id}")]
    public async Task<ActionResult<OfferResponse>> UpdateOffer(int id, UpdateOfferRequest request)
    {
        var offer = await _offerService.UpdateAsync(id, request);
        return offer == null ? NotFound() : Ok(offer);
    }

    [HttpPost("cars/{carId}/consign")]
    public async Task<ActionResult<ConsignmentResponse>> CreateConsignment(int carId, CreateConsignmentRequest request)
        => Ok(await _offerService.CreateConsignmentAsync(carId, request));

    [HttpPut("consignments/{id}")]
    public async Task<ActionResult<ConsignmentResponse>> UpdateConsignment(int id, UpdateConsignmentRequest request)
    {
        var consignment = await _offerService.UpdateConsignmentAsync(id, request);
        return consignment == null ? NotFound() : Ok(consignment);
    }

    [HttpGet("consignments")]
    public async Task<ActionResult<List<ConsignmentResponse>>> GetConsignments([FromQuery] string? status)
        => Ok(await _offerService.GetConsignmentsAsync(status));

    [HttpPut("cars/{carId}/featured")]
    public async Task<IActionResult> ToggleFeatured(int carId, [FromBody] ToggleFeaturedRequest request)
    {
        var car = await _carService.GetByIdAsync(carId);
        if (car == null) return NotFound();
        await _carService.SetFeaturedAsync(carId, request.IsFeatured);
        return Ok(new { carId, request.IsFeatured });
    }
}
