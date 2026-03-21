using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using CarDeal.Api.DTOs;
using CarDeal.Api.Services;

namespace CarDeal.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CarsController : ControllerBase
{
    private readonly ICarService _carService;

    public CarsController(ICarService carService) => _carService = carService;

    private string UserId => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

    [HttpGet]
    public async Task<ActionResult<List<CarResponse>>> GetMyCars()
        => Ok(await _carService.GetByUserAsync(UserId));

    [HttpGet("{id}")]
    public async Task<ActionResult<CarResponse>> GetById(int id)
    {
        var car = await _carService.GetByIdAsync(id, UserId);
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
        var car = await _carService.UpdateAsync(id, UserId, request);
        return car == null ? NotFound() : Ok(car);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await _carService.DeleteAsync(id, UserId);
        return deleted ? NoContent() : NotFound();
    }

    [HttpPost("{id}/images")]
    public async Task<ActionResult<CarImageResponse>> UploadImage(int id, IFormFile file)
    {
        if (file.Length == 0) return BadRequest(new { error = "No file provided" });
        if (file.Length > 5 * 1024 * 1024) return BadRequest(new { error = "File size must be under 5MB" });

        using var stream = file.OpenReadStream();
        var image = await _carService.AddImageAsync(id, UserId, stream, file.FileName, file.ContentType);
        return Ok(image);
    }

    [HttpDelete("{id}/images/{imageId}")]
    public async Task<IActionResult> DeleteImage(int id, int imageId)
    {
        var deleted = await _carService.RemoveImageAsync(id, imageId, UserId);
        return deleted ? NoContent() : NotFound();
    }
}
