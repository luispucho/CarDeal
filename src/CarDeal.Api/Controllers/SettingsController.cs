using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CarDeal.Api.Data;
using CarDeal.Api.Models;

namespace CarDeal.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SettingsController : ControllerBase
{
    private readonly AppDbContext _db;

    public SettingsController(AppDbContext db) => _db = db;

    [HttpGet("language")]
    [AllowAnonymous]
    public async Task<ActionResult<object>> GetLanguage()
    {
        var setting = await _db.SiteSettings.FindAsync("Language");
        return Ok(new { language = setting?.Value ?? "en" });
    }

    [HttpPut("language")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> SetLanguage([FromBody] LanguageRequest request)
    {
        if (request.Language != "en" && request.Language != "es")
            return BadRequest(new { error = "Supported languages: en, es" });

        var setting = await _db.SiteSettings.FindAsync("Language");
        if (setting == null)
        {
            setting = new SiteSetting { Key = "Language", Value = request.Language };
            _db.SiteSettings.Add(setting);
        }
        else
        {
            setting.Value = request.Language;
        }
        await _db.SaveChangesAsync();
        return Ok(new { language = setting.Value });
    }
}

public record LanguageRequest(string Language);
