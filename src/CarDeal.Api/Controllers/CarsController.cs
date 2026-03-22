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
[Authorize]
public class CarsController : ControllerBase
{
    private readonly ICarService _carService;
    private readonly UserManager<User> _userManager;

    public CarsController(ICarService carService, UserManager<User> userManager)
    {
        _carService = carService;
        _userManager = userManager;
    }

    private string UserId => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

    private async Task<int?> GetUserTenantId()
    {
        var user = await _userManager.FindByIdAsync(UserId);
        return user?.TenantId;
    }

    [HttpGet]
    public async Task<ActionResult<List<CarResponse>>> GetMyCars()
    {
        var tenantId = await GetUserTenantId();
        return Ok(await _carService.GetByUserAsync(UserId, tenantId));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<CarResponse>> GetById(int id)
    {
        var tenantId = await GetUserTenantId();
        var car = await _carService.GetByIdAsync(id, UserId, tenantId);
        return car == null ? NotFound() : Ok(car);
    }

    [HttpPost]
    public async Task<ActionResult<CarResponse>> Create(CreateCarRequest request)
    {
        var car = await _carService.CreateAsync(UserId, request);
        return CreatedAtAction(nameof(GetById), new { id = car.Id }, car);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<CarResponse>> Update(int id, UpdateCarRequest request)
    {
        var tenantId = await GetUserTenantId();
        var car = await _carService.UpdateAsync(id, UserId, request, tenantId);
        return car == null ? NotFound() : Ok(car);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var tenantId = await GetUserTenantId();
        var deleted = await _carService.DeleteAsync(id, UserId, tenantId);
        return deleted ? NoContent() : NotFound();
    }

    [HttpPost("{id}/images")]
    public async Task<ActionResult<CarImageResponse>> UploadImage(int id, IFormFile file)
    {
        if (file.Length == 0) return BadRequest(new { error = "No file provided" });
        if (file.Length > 5 * 1024 * 1024) return BadRequest(new { error = "File size must be under 5MB" });

        var tenantId = await GetUserTenantId();
        using var stream = file.OpenReadStream();
        var image = await _carService.AddImageAsync(id, UserId, stream, file.FileName, file.ContentType, tenantId);
        return Ok(image);
    }

    [HttpDelete("{id}/images/{imageId}")]
    public async Task<IActionResult> DeleteImage(int id, int imageId)
    {
        var tenantId = await GetUserTenantId();
        var deleted = await _carService.RemoveImageAsync(id, imageId, UserId, tenantId);
        return deleted ? NoContent() : NotFound();
    }

    [HttpPut("{id}/sharing")]
    public async Task<IActionResult> ToggleSharing(int id, [FromBody] ToggleSharingRequest request)
    {
        var tenantId = await GetUserTenantId();
        var car = await _carService.GetByIdAsync(id, UserId, tenantId);
        if (car == null) return NotFound();

        var updated = await _carService.SetSharingAsync(id, UserId, request.IsShared, tenantId);
        return updated ? Ok(new { isShared = request.IsShared }) : NotFound();
    }
}
