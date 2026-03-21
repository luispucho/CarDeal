using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using CarDeal.Api.DTOs;
using CarDeal.Api.Services;

namespace CarDeal.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class AdminController : ControllerBase
{
    private readonly ICarService _carService;
    private readonly IOfferService _offerService;

    public AdminController(ICarService carService, IOfferService offerService)
    {
        _carService = carService;
        _offerService = offerService;
    }

    private string UserId => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

    [HttpGet("dashboard")]
    public async Task<ActionResult<DashboardStatsResponse>> GetDashboard()
    {
        var allCars = await _carService.GetAllAsync();
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
        => Ok(await _carService.GetAllAsync(status));

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
