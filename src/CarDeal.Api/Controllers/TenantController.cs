using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CarDeal.Api.Data;
using CarDeal.Api.DTOs;
using CarDeal.Api.Models;

namespace CarDeal.Api.Controllers;

[ApiController]
[Authorize(Roles = "SuperAdmin")]
[Route("api/[controller]")]
public class TenantController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly UserManager<User> _userManager;

    public TenantController(AppDbContext db, UserManager<User> userManager)
    {
        _db = db;
        _userManager = userManager;
    }

    [HttpGet]
    public async Task<ActionResult<List<TenantResponse>>> GetAll()
    {
        var tenants = await _db.Tenants
            .Include(t => t.Users)
            .Include(t => t.Cars)
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync();

        return Ok(tenants.Select(MapToResponse).ToList());
    }

    [HttpPost]
    public async Task<ActionResult<TenantResponse>> Create(CreateTenantRequest request)
    {
        if (await _db.Tenants.AnyAsync(t => t.Slug == request.Slug))
            return Conflict(new { message = "A tenant with this slug already exists." });

        var tenant = new Tenant
        {
            Name = request.Name,
            Slug = request.Slug,
            ContactEmail = request.ContactEmail
        };

        _db.Tenants.Add(tenant);
        await _db.SaveChangesAsync();

        // Auto-create default branding
        var branding = new TenantBranding
        {
            TenantId = tenant.Id,
            DealerName = tenant.Name,
            LandingLayoutJson = "[\"hero\",\"featured\",\"inventory\",\"about\",\"contact\"]"
        };
        _db.TenantBrandings.Add(branding);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(Get), new { id = tenant.Id }, MapToResponse(tenant));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<TenantResponse>> Get(int id)
    {
        var tenant = await _db.Tenants
            .Include(t => t.Users)
            .Include(t => t.Cars)
            .FirstOrDefaultAsync(t => t.Id == id);

        return tenant == null ? NotFound() : Ok(MapToResponse(tenant));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<TenantResponse>> Update(int id, UpdateTenantRequest request)
    {
        var tenant = await _db.Tenants
            .Include(t => t.Users)
            .Include(t => t.Cars)
            .FirstOrDefaultAsync(t => t.Id == id);

        if (tenant == null) return NotFound();

        if (request.Name != null) tenant.Name = request.Name;
        if (request.Slug != null)
        {
            if (await _db.Tenants.AnyAsync(t => t.Slug == request.Slug && t.Id != id))
                return Conflict(new { message = "A tenant with this slug already exists." });
            tenant.Slug = request.Slug;
        }
        if (request.ContactEmail != null) tenant.ContactEmail = request.ContactEmail;

        await _db.SaveChangesAsync();
        return Ok(MapToResponse(tenant));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var tenant = await _db.Tenants
            .Include(t => t.Cars)
            .FirstOrDefaultAsync(t => t.Id == id);

        if (tenant == null) return NotFound();

        if (tenant.Cars.Any())
            return BadRequest(new { message = "Cannot delete a tenant that has cars. Remove all cars first." });

        _db.Tenants.Remove(tenant);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("{id}/users")]
    public async Task<IActionResult> AssignUser(int id, AssignUserRequest request)
    {
        var tenant = await _db.Tenants.FindAsync(id);
        if (tenant == null) return NotFound(new { message = "Tenant not found." });

        var user = await _userManager.FindByIdAsync(request.UserId);
        if (user == null) return NotFound(new { message = "User not found." });

        user.TenantId = id;
        await _userManager.UpdateAsync(user);
        return Ok(new { message = $"User {user.Email} assigned to tenant {tenant.Name}." });
    }

    [HttpDelete("{id}/users/{userId}")]
    public async Task<IActionResult> RemoveUser(int id, string userId)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return NotFound(new { message = "User not found." });

        if (user.TenantId != id)
            return BadRequest(new { message = "User does not belong to this tenant." });

        user.TenantId = null;
        await _userManager.UpdateAsync(user);
        return Ok(new { message = $"User {user.Email} removed from tenant." });
    }

    [HttpGet("{id}/users")]
    public async Task<IActionResult> GetUsers(int id)
    {
        var tenant = await _db.Tenants.FindAsync(id);
        if (tenant == null) return NotFound();

        var users = await _db.Users
            .Where(u => u.TenantId == id)
            .Select(u => new { u.Id, u.Email, u.FullName })
            .ToListAsync();

        return Ok(users);
    }

    [HttpPut("{id}/tier")]
    public async Task<ActionResult<TenantResponse>> UpdateTier(int id, UpdateTenantTierRequest request)
    {
        if (!Enum.TryParse<TenantTier>(request.Tier, true, out var tier))
            return BadRequest(new { message = "Invalid tier. Must be Basic, Pro, or Enterprise." });

        var tenant = await _db.Tenants
            .Include(t => t.Users)
            .Include(t => t.Cars)
            .FirstOrDefaultAsync(t => t.Id == id);

        if (tenant == null) return NotFound();

        tenant.Tier = tier;
        await _db.SaveChangesAsync();
        return Ok(MapToResponse(tenant));
    }

    private static TenantResponse MapToResponse(Tenant t) => new(
        t.Id, t.Name, t.Slug, t.LogoUrl, t.ContactEmail,
        t.Tier.ToString(), t.CreatedAt, t.Users.Count, t.Cars.Count
    );
}
