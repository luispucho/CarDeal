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
public class ProfileController : ControllerBase
{
    private readonly UserManager<User> _userManager;
    private readonly IBlobStorageService _blobService;

    public ProfileController(UserManager<User> userManager, IBlobStorageService blobService)
    {
        _userManager = userManager;
        _blobService = blobService;
    }

    private string UserId => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

    [HttpGet]
    public async Task<ActionResult<ProfileResponse>> GetProfile()
    {
        var user = await _userManager.FindByIdAsync(UserId);
        if (user == null) return NotFound();

        return Ok(new ProfileResponse(
            user.Id, user.Email!, user.FullName, user.Phone,
            user.ProfilePictureUrl, user.CreatedAt));
    }

    [HttpPut]
    public async Task<ActionResult<ProfileResponse>> UpdateProfile(UpdateProfileRequest request)
    {
        var user = await _userManager.FindByIdAsync(UserId);
        if (user == null) return NotFound();

        user.FullName = request.FullName;
        user.Phone = request.Phone;

        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded)
            return BadRequest(new { errors = result.Errors.Select(e => e.Description) });

        return Ok(new ProfileResponse(
            user.Id, user.Email!, user.FullName, user.Phone,
            user.ProfilePictureUrl, user.CreatedAt));
    }

    [HttpPost("picture")]
    public async Task<ActionResult<ProfileResponse>> UploadPicture(IFormFile file)
    {
        if (file.Length == 0) return BadRequest(new { error = "No file provided" });
        if (file.Length > 2 * 1024 * 1024) return BadRequest(new { error = "File size must be under 2MB" });

        var user = await _userManager.FindByIdAsync(UserId);
        if (user == null) return NotFound();

        // Delete old picture if exists
        if (!string.IsNullOrEmpty(user.ProfilePictureUrl))
            await _blobService.DeleteAsync(user.ProfilePictureUrl);

        using var stream = file.OpenReadStream();
        user.ProfilePictureUrl = await _blobService.UploadAsync(stream, $"profile-{UserId}{Path.GetExtension(file.FileName)}", file.ContentType);

        await _userManager.UpdateAsync(user);

        return Ok(new ProfileResponse(
            user.Id, user.Email!, user.FullName, user.Phone,
            user.ProfilePictureUrl, user.CreatedAt));
    }

    [HttpDelete("picture")]
    public async Task<ActionResult<ProfileResponse>> DeletePicture()
    {
        var user = await _userManager.FindByIdAsync(UserId);
        if (user == null) return NotFound();

        if (!string.IsNullOrEmpty(user.ProfilePictureUrl))
        {
            await _blobService.DeleteAsync(user.ProfilePictureUrl);
            user.ProfilePictureUrl = null;
            await _userManager.UpdateAsync(user);
        }

        return Ok(new ProfileResponse(
            user.Id, user.Email!, user.FullName, user.Phone,
            user.ProfilePictureUrl, user.CreatedAt));
    }
}
