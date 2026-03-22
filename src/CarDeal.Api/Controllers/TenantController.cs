using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CarDeal.Api.Data;
using CarDeal.Api.DTOs;
using CarDeal.Api.Models;
using CarDeal.Api.Services;

namespace CarDeal.Api.Controllers;

[ApiController]
[Authorize(Roles = "SuperAdmin")]
[Route("api/[controller]")]
public class TenantController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly UserManager<User> _userManager;
    private readonly IBlobStorageService _blobService;

    public TenantController(AppDbContext db, UserManager<User> userManager, IBlobStorageService blobService)
    {
        _db = db;
        _userManager = userManager;
        _blobService = blobService;
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

        // Auto-create admin account from contactEmail
        var adminEmail = request.ContactEmail;
        if (!string.IsNullOrEmpty(adminEmail))
        {
            var existingUser = await _userManager.FindByEmailAsync(adminEmail);
            if (existingUser == null)
            {
                var adminUser = new User
                {
                    UserName = adminEmail,
                    Email = adminEmail,
                    FullName = tenant.Name + " Admin",
                    EmailConfirmed = true,
                    TenantId = tenant.Id
                };
                var password = GenerateRandomPassword();
                var result = await _userManager.CreateAsync(adminUser, password);
                if (result.Succeeded)
                {
                    await _userManager.AddToRoleAsync(adminUser, "Admin");
                }
            }
            else
            {
                existingUser.TenantId = tenant.Id;
                await _userManager.UpdateAsync(existingUser);
                if (!await _userManager.IsInRoleAsync(existingUser, "Admin"))
                    await _userManager.AddToRoleAsync(existingUser, "Admin");
            }
        }

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

    [HttpPut("{id}/deactivate")]
    public async Task<IActionResult> Deactivate(int id)
    {
        var tenant = await _db.Tenants
            .Include(t => t.Users)
            .Include(t => t.Cars)
            .FirstOrDefaultAsync(t => t.Id == id);

        if (tenant == null) return NotFound();

        tenant.IsActive = false;
        await _db.SaveChangesAsync();
        return Ok(MapToResponse(tenant));
    }

    [HttpPut("{id}/activate")]
    public async Task<IActionResult> Activate(int id)
    {
        var tenant = await _db.Tenants
            .Include(t => t.Users)
            .Include(t => t.Cars)
            .FirstOrDefaultAsync(t => t.Id == id);

        if (tenant == null) return NotFound();

        tenant.IsActive = true;
        await _db.SaveChangesAsync();
        return Ok(MapToResponse(tenant));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id, [FromQuery] bool confirm = false)
    {
        if (!confirm)
            return BadRequest(new { message = "Hard delete requires confirm=true query parameter." });

        var tenant = await _db.Tenants
            .Include(t => t.Cars).ThenInclude(c => c.Images)
            .Include(t => t.Users)
            .FirstOrDefaultAsync(t => t.Id == id);

        if (tenant == null) return NotFound();

        // Delete all car images from blob storage
        foreach (var car in tenant.Cars)
        {
            foreach (var image in car.Images)
            {
                await _blobService.DeleteAsync(image.BlobUrl);
            }
        }

        // Remove all cars (images cascade-deleted by EF)
        _db.Cars.RemoveRange(tenant.Cars);

        // Unassign all users from the tenant
        foreach (var user in tenant.Users)
        {
            user.TenantId = null;
        }

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

    [HttpPost("{id}/reset-password")]
    public async Task<IActionResult> ResetAdminPassword(int id)
    {
        var tenant = await _db.Tenants.FindAsync(id);
        if (tenant == null) return NotFound();

        var admin = await _userManager.FindByEmailAsync(tenant.ContactEmail ?? "");
        if (admin == null) return NotFound(new { error = "No admin account found for this tenant" });

        var newPassword = GenerateRandomPassword();
        var token = await _userManager.GeneratePasswordResetTokenAsync(admin);
        var result = await _userManager.ResetPasswordAsync(admin, token, newPassword);
        if (!result.Succeeded)
            return BadRequest(new { errors = result.Errors.Select(e => e.Description) });

        return Ok(new { email = admin.Email, newPassword = newPassword, message = "Password has been reset" });
    }

    [HttpPost("{id}/send-credentials")]
    public async Task<IActionResult> SendCredentials(int id)
    {
        var tenant = await _db.Tenants.FindAsync(id);
        if (tenant == null) return NotFound();

        // In production: send email via SMTP/SendGrid
        return Ok(new { email = tenant.ContactEmail, message = "Credentials email sent (mock)" });
    }

    private static string GenerateRandomPassword()
    {
        var random = new Random();
        const string chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
        var password = new string(Enumerable.Range(0, 10).Select(_ => chars[random.Next(chars.Length)]).ToArray());
        return password + "A1!";
    }

    private static TenantResponse MapToResponse(Tenant t) => new(
        t.Id, t.Name, t.Slug, t.LogoUrl, t.ContactEmail,
        t.Tier.ToString(), t.CreatedAt, t.Users.Count, t.Cars.Count, t.IsActive
    );
}
