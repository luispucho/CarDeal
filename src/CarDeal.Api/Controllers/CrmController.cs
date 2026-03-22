using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CarDeal.Api.Data;
using CarDeal.Api.DTOs;
using CarDeal.Api.Models;
using CarDeal.Api.Middleware;
using CarDeal.Api.Services;

namespace CarDeal.Api.Controllers;

[ApiController]
[Route("api/crm")]
[Authorize]
public class CrmController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly UserManager<User> _userManager;
    private readonly IPublishingService _publishingService;
    private readonly IBlobStorageService _blobService;

    public CrmController(AppDbContext db, UserManager<User> userManager, IPublishingService publishingService, IBlobStorageService blobService)
    {
        _db = db;
        _userManager = userManager;
        _publishingService = publishingService;
        _blobService = blobService;
    }

    private string UserId => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

    private async Task<(int? TenantId, bool IsSuperAdmin)> GetTenantContextAsync()
    {
        if (User.IsInRole("SuperAdmin"))
            return (null, true);

        var user = await _userManager.FindByIdAsync(UserId);
        return (user?.TenantId, false);
    }

    private async Task<ActionResult?> RequireTenantAsync()
    {
        var (tenantId, isSuperAdmin) = await GetTenantContextAsync();
        if (!isSuperAdmin && !tenantId.HasValue)
            return Forbid();
        return null;
    }

    private async Task<int?> GetRequiredTenantIdAsync()
    {
        var user = await _userManager.FindByIdAsync(UserId);
        return user?.TenantId;
    }

    private bool IsTenantAdmin => User.IsInRole("TenantAdmin") || User.IsInRole("Admin");

    // ─── Inventory ───────────────────────────────────────────────

    [HttpGet("inventory")]
    public async Task<ActionResult<List<CrmCarResponse>>> GetInventory()
    {
        var (tenantId, isSuperAdmin) = await GetTenantContextAsync();
        if (!isSuperAdmin && !tenantId.HasValue)
            return Forbid();

        var query = _db.Cars
            .Include(c => c.User)
            .Include(c => c.Tenant)
            .Include(c => c.Images)
            .Include(c => c.Financials)
            .Include(c => c.Expenses)
            .AsQueryable();

        if (!isSuperAdmin)
            query = query.Where(c => c.TenantId == tenantId);

        var cars = await query.OrderByDescending(c => c.CreatedAt).ToListAsync();
        return Ok(cars.Select(MapToCrmCarResponse).ToList());
    }

    [HttpGet("inventory/{id}")]
    public async Task<ActionResult<CrmCarResponse>> GetInventoryItem(int id)
    {
        var (tenantId, isSuperAdmin) = await GetTenantContextAsync();
        if (!isSuperAdmin && !tenantId.HasValue)
            return Forbid();

        var car = await _db.Cars
            .Include(c => c.User)
            .Include(c => c.Tenant)
            .Include(c => c.Images)
            .Include(c => c.Financials)
            .Include(c => c.Expenses)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (car == null) return NotFound();
        if (!isSuperAdmin && car.TenantId != tenantId) return Forbid();

        return Ok(MapToCrmCarResponse(car));
    }

    // ─── Financials ──────────────────────────────────────────────

    [HttpPut("inventory/{id}/financials")]
    public async Task<ActionResult<CarFinancialsResponse>> UpdateFinancials(int id, UpdateFinancialsRequest request)
    {
        var (tenantId, isSuperAdmin) = await GetTenantContextAsync();
        if (!isSuperAdmin && !tenantId.HasValue)
            return Forbid();

        var car = await _db.Cars
            .Include(c => c.Financials)
            .Include(c => c.Expenses)
            .Include(c => c.Tenant)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (car == null) return NotFound();
        if (!isSuperAdmin && car.TenantId != tenantId) return Forbid();

        if (car.Financials == null)
        {
            car.Financials = new CarFinancials
            {
                CarId = id,
                PurchasePrice = request.PurchasePrice,
                SalePrice = request.SalePrice,
                Notes = request.Notes
            };
            _db.CarFinancials.Add(car.Financials);
        }
        else
        {
            car.Financials.PurchasePrice = request.PurchasePrice;
            car.Financials.SalePrice = request.SalePrice;
            car.Financials.Notes = request.Notes;
            car.Financials.UpdatedAt = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync();

        var totalExpenses = car.Expenses.Sum(e => e.Amount);
        return Ok(MapToFinancialsResponse(car.Financials, totalExpenses));
    }

    // ─── Expenses ────────────────────────────────────────────────

    [HttpGet("inventory/{id}/expenses")]
    public async Task<ActionResult<List<ExpenseResponse>>> GetExpenses(int id)
    {
        var (tenantId, isSuperAdmin) = await GetTenantContextAsync();
        if (!isSuperAdmin && !tenantId.HasValue)
            return Forbid();

        var car = await _db.Cars.Include(c => c.Tenant).FirstOrDefaultAsync(c => c.Id == id);
        if (car == null) return NotFound();
        if (!isSuperAdmin && car.TenantId != tenantId) return Forbid();

        var expenses = await _db.Expenses
            .Where(e => e.CarId == id)
            .OrderByDescending(e => e.Date)
            .ToListAsync();

        return Ok(expenses.Select(e => new ExpenseResponse(
            e.Id, e.CarId, e.Type.ToString(), e.Amount, e.Description, e.Date
        )).ToList());
    }

    [HttpPost("inventory/{id}/expenses")]
    public async Task<ActionResult<ExpenseResponse>> AddExpense(int id, CreateExpenseRequest request)
    {
        var (tenantId, isSuperAdmin) = await GetTenantContextAsync();
        if (!isSuperAdmin && !tenantId.HasValue)
            return Forbid();

        var car = await _db.Cars.Include(c => c.Tenant).FirstOrDefaultAsync(c => c.Id == id);
        if (car == null) return NotFound();
        if (!isSuperAdmin && car.TenantId != tenantId) return Forbid();

        if (!Enum.TryParse<ExpenseType>(request.Type, true, out var expenseType))
            return BadRequest(new { message = $"Invalid expense type. Valid types: {string.Join(", ", Enum.GetNames<ExpenseType>())}" });

        var expense = new Expense
        {
            CarId = id,
            Type = expenseType,
            Amount = request.Amount,
            Description = request.Description,
            Date = request.Date ?? DateTime.UtcNow
        };

        _db.Expenses.Add(expense);
        await _db.SaveChangesAsync();

        return Created($"/api/crm/inventory/{id}/expenses", new ExpenseResponse(
            expense.Id, expense.CarId, expense.Type.ToString(), expense.Amount, expense.Description, expense.Date
        ));
    }

    [HttpDelete("inventory/{id}/expenses/{expenseId}")]
    public async Task<IActionResult> DeleteExpense(int id, int expenseId)
    {
        var (tenantId, isSuperAdmin) = await GetTenantContextAsync();
        if (!isSuperAdmin && !tenantId.HasValue)
            return Forbid();

        var car = await _db.Cars.Include(c => c.Tenant).FirstOrDefaultAsync(c => c.Id == id);
        if (car == null) return NotFound();
        if (!isSuperAdmin && car.TenantId != tenantId) return Forbid();

        var expense = await _db.Expenses.FirstOrDefaultAsync(e => e.Id == expenseId && e.CarId == id);
        if (expense == null) return NotFound();

        _db.Expenses.Remove(expense);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // ─── Notes ───────────────────────────────────────────────────

    [HttpGet("inventory/{id}/notes")]
    public async Task<ActionResult<List<CrmNoteResponse>>> GetNotes(int id)
    {
        var (tenantId, isSuperAdmin) = await GetTenantContextAsync();
        if (!isSuperAdmin && !tenantId.HasValue)
            return Forbid();

        var car = await _db.Cars.Include(c => c.Tenant).FirstOrDefaultAsync(c => c.Id == id);
        if (car == null) return NotFound();
        if (!isSuperAdmin && car.TenantId != tenantId) return Forbid();

        var notes = await _db.CrmNotes
            .Include(n => n.Author)
            .Where(n => n.CarId == id)
            .OrderByDescending(n => n.CreatedAt)
            .ToListAsync();

        return Ok(notes.Select(n => new CrmNoteResponse(
            n.Id, n.CarId, n.AuthorUserId, n.Author.FullName, n.Content, n.CreatedAt
        )).ToList());
    }

    [HttpPost("inventory/{id}/notes")]
    public async Task<ActionResult<CrmNoteResponse>> AddNote(int id, CreateNoteRequest request)
    {
        var (tenantId, isSuperAdmin) = await GetTenantContextAsync();
        if (!isSuperAdmin && !tenantId.HasValue)
            return Forbid();

        var car = await _db.Cars.Include(c => c.Tenant).FirstOrDefaultAsync(c => c.Id == id);
        if (car == null) return NotFound();
        if (!isSuperAdmin && car.TenantId != tenantId) return Forbid();

        var user = await _userManager.FindByIdAsync(UserId);

        var note = new CrmNote
        {
            CarId = id,
            AuthorUserId = UserId,
            Content = request.Content
        };

        _db.CrmNotes.Add(note);
        await _db.SaveChangesAsync();

        return Created($"/api/crm/inventory/{id}/notes", new CrmNoteResponse(
            note.Id, note.CarId, note.AuthorUserId, user!.FullName, note.Content, note.CreatedAt
        ));
    }

    // ─── Employees (TenantAdmin only) ───────────────────────────

    [HttpGet("employees")]
    [Authorize(Roles = "TenantAdmin,Admin,SuperAdmin")]
    public async Task<ActionResult<List<EmployeeResponse>>> GetEmployees()
    {
        var tenantId = await GetRequiredTenantIdAsync();
        if (!tenantId.HasValue && !User.IsInRole("SuperAdmin"))
            return Forbid();

        var users = await _db.Users
            .Where(u => u.TenantId == tenantId)
            .ToListAsync();

        var result = new List<EmployeeResponse>();
        foreach (var u in users)
        {
            var roles = await _userManager.GetRolesAsync(u);
            var primaryRole = roles.Contains("TenantAdmin") ? "TenantAdmin"
                : roles.Contains("Admin") ? "Admin"
                : "Employee";
            result.Add(new EmployeeResponse(u.Id, u.Email!, u.FullName, primaryRole));
        }

        return Ok(result);
    }

    [HttpPost("employees")]
    [Authorize(Roles = "TenantAdmin,Admin,SuperAdmin")]
    public async Task<ActionResult<EmployeeResponse>> AddEmployee(AddEmployeeRequest request)
    {
        var tenantId = await GetRequiredTenantIdAsync();
        if (!tenantId.HasValue && !User.IsInRole("SuperAdmin"))
            return Forbid();

        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user == null)
            return NotFound(new { message = "User not found with that email." });

        if (user.TenantId.HasValue)
            return Conflict(new { message = "User already belongs to a tenant." });

        user.TenantId = tenantId;
        await _userManager.UpdateAsync(user);

        var roles = await _userManager.GetRolesAsync(user);
        var primaryRole = roles.Contains("TenantAdmin") ? "TenantAdmin" : "Employee";

        return Ok(new EmployeeResponse(user.Id, user.Email!, user.FullName, primaryRole));
    }

    [HttpDelete("employees/{userId}")]
    [Authorize(Roles = "TenantAdmin,Admin,SuperAdmin")]
    public async Task<IActionResult> RemoveEmployee(string userId)
    {
        var tenantId = await GetRequiredTenantIdAsync();
        if (!tenantId.HasValue && !User.IsInRole("SuperAdmin"))
            return Forbid();

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return NotFound();
        if (user.TenantId != tenantId) return Forbid();

        user.TenantId = null;
        await _userManager.UpdateAsync(user);
        return NoContent();
    }

    // ─── Tenant Stats ────────────────────────────────────────────

    [HttpGet("stats")]
    public async Task<ActionResult<TenantStatsResponse>> GetTenantStats()
    {
        var (tenantId, isSuperAdmin) = await GetTenantContextAsync();
        if (!isSuperAdmin && !tenantId.HasValue)
            return Forbid();

        var cars = await _db.Cars
            .Include(c => c.Financials)
            .Include(c => c.Expenses)
            .Include(c => c.Tenant)
            .Where(c => c.TenantId == tenantId)
            .ToListAsync();

        var totalCars = cars.Count;
        var soldCars = cars.Count(c => c.Status == CarStatus.Sold);
        var consignedCars = cars.Count(c => c.Status == CarStatus.Consigned);
        var pendingCars = cars.Count(c => c.Status == CarStatus.Pending);
        var activeInventory = cars.Count(c => c.Status != CarStatus.Sold && c.Status != CarStatus.Rejected && c.Status != CarStatus.Withdrawn);

        var totalRevenue = cars
            .Where(c => c.Financials?.SalePrice != null)
            .Sum(c => c.Financials!.SalePrice!.Value);

        var totalExpenses = cars.Sum(c => c.Expenses.Sum(e => e.Amount));

        var totalPurchaseCost = cars
            .Where(c => c.Financials?.PurchasePrice != null)
            .Sum(c => c.Financials!.PurchasePrice!.Value);

        var totalProfit = totalRevenue - totalPurchaseCost - totalExpenses;

        var topProfitableCars = cars
            .Where(c => c.Financials != null)
            .Select(c =>
            {
                var carExpenses = c.Expenses.Sum(e => e.Amount);
                decimal? profit = c.Financials!.SalePrice.HasValue && c.Financials.PurchasePrice.HasValue
                    ? c.Financials.SalePrice.Value - c.Financials.PurchasePrice.Value - carExpenses
                    : null;
                return new CarProfitStats(c.Id, $"{c.Year} {c.Make} {c.Model}", profit);
            })
            .Where(c => c.Profit.HasValue)
            .OrderByDescending(c => c.Profit)
            .Take(10)
            .ToList();

        var expensesByType = cars
            .SelectMany(c => c.Expenses)
            .GroupBy(e => e.Type.ToString())
            .Select(g => new ExpenseBreakdown(g.Key, g.Sum(e => e.Amount)))
            .OrderByDescending(e => e.Total)
            .ToList();

        var monthlySales = cars
            .Where(c => c.Status == CarStatus.Sold && c.Financials?.SalePrice != null)
            .GroupBy(c => c.UpdatedAt.ToString("yyyy-MM"))
            .Select(g => new MonthlySales(g.Key, g.Count(), g.Sum(c => c.Financials!.SalePrice!.Value)))
            .OrderByDescending(m => m.Month)
            .Take(12)
            .ToList();

        return Ok(new TenantStatsResponse(
            totalCars, soldCars, consignedCars, pendingCars, activeInventory,
            totalRevenue, totalExpenses, totalProfit,
            topProfitableCars, expensesByType, monthlySales));
    }

    // ─── SuperAdmin Platform Stats ──────────────────────────────

    [HttpGet("admin/stats")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<ActionResult<PlatformStatsResponse>> GetPlatformStats()
    {
        var tenants = await _db.Tenants.Include(t => t.Cars).ThenInclude(c => c.Financials).ToListAsync();

        var allCars = await _db.Cars
            .Include(c => c.Financials)
            .Include(c => c.Tenant)
            .ToListAsync();

        var totalTenants = tenants.Count;
        var totalCars = allCars.Count;
        var totalSold = allCars.Count(c => c.Status == CarStatus.Sold);
        var totalActive = allCars.Count(c => c.Status != CarStatus.Sold && c.Status != CarStatus.Rejected && c.Status != CarStatus.Withdrawn);

        var totalRevenue = allCars
            .Where(c => c.Financials?.SalePrice != null)
            .Sum(c => c.Financials!.SalePrice!.Value);

        var salesByTenant = tenants.Select(t =>
        {
            var tenantCars = allCars.Where(c => c.TenantId == t.Id).ToList();
            var revenue = tenantCars
                .Where(c => c.Financials?.SalePrice != null)
                .Sum(c => c.Financials!.SalePrice!.Value);
            return new TenantSalesStats(t.Id, t.Name, tenantCars.Count,
                tenantCars.Count(c => c.Status == CarStatus.Sold), revenue);
        }).OrderByDescending(s => s.Revenue).ToList();

        var topBrands = allCars
            .GroupBy(c => c.Make)
            .Select(g => new BrandStats(g.Key, g.Count(), g.Count(c => c.Status == CarStatus.Sold)))
            .OrderByDescending(b => b.Count)
            .Take(10)
            .ToList();

        return Ok(new PlatformStatsResponse(
            totalTenants, totalCars, totalSold, totalActive,
            salesByTenant, topBrands, totalRevenue));
    }

    [HttpPost("admin/tenants/{id}/reset-admin")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<IActionResult> ResetTenantAdmin(int id)
    {
        var tenant = await _db.Tenants.FindAsync(id);
        if (tenant == null) return NotFound();

        var tenantAdmins = await _db.Users
            .Where(u => u.TenantId == id)
            .ToListAsync();

        var admin = tenantAdmins.FirstOrDefault();
        if (admin == null)
            return NotFound(new { message = "No users found in this tenant." });

        // Check if user is a TenantAdmin
        var roles = await _userManager.GetRolesAsync(admin);
        if (!roles.Contains("TenantAdmin") && !roles.Contains("Admin"))
        {
            // Find a TenantAdmin specifically
            foreach (var u in tenantAdmins)
            {
                var uRoles = await _userManager.GetRolesAsync(u);
                if (uRoles.Contains("TenantAdmin") || uRoles.Contains("Admin"))
                {
                    admin = u;
                    break;
                }
            }
        }

        var token = await _userManager.GeneratePasswordResetTokenAsync(admin);
        var result = await _userManager.ResetPasswordAsync(admin, token, "TenantAdmin123!");

        if (!result.Succeeded)
            return BadRequest(new { errors = result.Errors.Select(e => e.Description) });

        return Ok(new { message = $"Password reset for {admin.Email} to default.", email = admin.Email });
    }

    // ─── Platforms & Connections ────────────────────────────────

    [HttpGet("platforms")]
    public async Task<ActionResult<List<ExternalPlatformResponse>>> GetPlatforms()
    {
        var platforms = await _db.ExternalPlatforms
            .Where(p => p.IsActive)
            .OrderBy(p => p.Name)
            .ToListAsync();

        return Ok(platforms.Select(p => new ExternalPlatformResponse(
            p.Id, p.Name, p.Slug, p.IconUrl, p.Description, p.IsActive
        )).ToList());
    }

    [HttpGet("connections")]
    [Authorize(Roles = "TenantAdmin,Admin,SuperAdmin")]
    [RequireTier(TenantTier.Pro)]
    public async Task<ActionResult<List<PlatformConnectionResponse>>> GetConnections()
    {
        var tenantId = await GetRequiredTenantIdAsync();
        if (!tenantId.HasValue && !User.IsInRole("SuperAdmin"))
            return Forbid();

        var connections = await _db.PlatformConnections
            .Include(c => c.Platform)
            .Where(c => c.TenantId == tenantId)
            .OrderBy(c => c.Platform.Name)
            .ToListAsync();

        return Ok(connections.Select(c => new PlatformConnectionResponse(
            c.Id, c.TenantId, c.PlatformId, c.Platform.Name, c.Platform.Slug,
            c.AccountId, c.IsEnabled, c.CreatedAt
        )).ToList());
    }

    [HttpPost("connections")]
    [Authorize(Roles = "TenantAdmin,Admin,SuperAdmin")]
    [RequireTier(TenantTier.Pro)]
    public async Task<ActionResult<PlatformConnectionResponse>> CreateConnection(CreateConnectionRequest request)
    {
        var tenantId = await GetRequiredTenantIdAsync();
        if (!tenantId.HasValue && !User.IsInRole("SuperAdmin"))
            return Forbid();

        var platform = await _db.ExternalPlatforms.FindAsync(request.PlatformId);
        if (platform == null)
            return NotFound(new { message = "Platform not found." });

        var existing = await _db.PlatformConnections
            .AnyAsync(c => c.TenantId == tenantId && c.PlatformId == request.PlatformId);
        if (existing)
            return Conflict(new { message = "A connection to this platform already exists for your tenant." });

        var connection = new PlatformConnection
        {
            TenantId = tenantId.Value,
            PlatformId = request.PlatformId,
            ApiKey = request.ApiKey,
            ApiSecret = request.ApiSecret,
            AccessToken = request.AccessToken,
            AccountId = request.AccountId,
            ConfigJson = request.ConfigJson
        };

        _db.PlatformConnections.Add(connection);
        await _db.SaveChangesAsync();

        return Created($"/api/crm/connections", new PlatformConnectionResponse(
            connection.Id, connection.TenantId, connection.PlatformId,
            platform.Name, platform.Slug, connection.AccountId,
            connection.IsEnabled, connection.CreatedAt
        ));
    }

    [HttpPut("connections/{id}")]
    [Authorize(Roles = "TenantAdmin,Admin,SuperAdmin")]
    [RequireTier(TenantTier.Pro)]
    public async Task<ActionResult<PlatformConnectionResponse>> UpdateConnection(int id, UpdateConnectionRequest request)
    {
        var tenantId = await GetRequiredTenantIdAsync();
        if (!tenantId.HasValue && !User.IsInRole("SuperAdmin"))
            return Forbid();

        var connection = await _db.PlatformConnections
            .Include(c => c.Platform)
            .FirstOrDefaultAsync(c => c.Id == id && c.TenantId == tenantId);

        if (connection == null) return NotFound();

        if (request.ApiKey != null) connection.ApiKey = request.ApiKey;
        if (request.ApiSecret != null) connection.ApiSecret = request.ApiSecret;
        if (request.AccessToken != null) connection.AccessToken = request.AccessToken;
        if (request.AccountId != null) connection.AccountId = request.AccountId;
        if (request.ConfigJson != null) connection.ConfigJson = request.ConfigJson;
        if (request.IsEnabled.HasValue) connection.IsEnabled = request.IsEnabled.Value;
        connection.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return Ok(new PlatformConnectionResponse(
            connection.Id, connection.TenantId, connection.PlatformId,
            connection.Platform.Name, connection.Platform.Slug,
            connection.AccountId, connection.IsEnabled, connection.CreatedAt
        ));
    }

    [HttpDelete("connections/{id}")]
    [Authorize(Roles = "TenantAdmin,Admin,SuperAdmin")]
    [RequireTier(TenantTier.Pro)]
    public async Task<IActionResult> DeleteConnection(int id)
    {
        var tenantId = await GetRequiredTenantIdAsync();
        if (!tenantId.HasValue && !User.IsInRole("SuperAdmin"))
            return Forbid();

        var connection = await _db.PlatformConnections
            .FirstOrDefaultAsync(c => c.Id == id && c.TenantId == tenantId);

        if (connection == null) return NotFound();

        _db.PlatformConnections.Remove(connection);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // ─── Publishing ──────────────────────────────────────────────

    [HttpGet("inventory/{carId}/publications")]
    [RequireTier(TenantTier.Pro)]
    public async Task<ActionResult<List<CarPublicationResponse>>> GetPublications(int carId)
    {
        var (tenantId, isSuperAdmin) = await GetTenantContextAsync();
        if (!isSuperAdmin && !tenantId.HasValue)
            return Forbid();

        var car = await _db.Cars.FirstOrDefaultAsync(c => c.Id == carId);
        if (car == null) return NotFound();
        if (!isSuperAdmin && car.TenantId != tenantId) return Forbid();

        var publications = await _db.CarPublications
            .Include(p => p.Connection).ThenInclude(c => c.Platform)
            .Where(p => p.CarId == carId)
            .OrderByDescending(p => p.UpdatedAt)
            .ToListAsync();

        return Ok(publications.Select(MapToPublicationResponse).ToList());
    }

    [HttpPost("inventory/{carId}/publish")]
    [RequireTier(TenantTier.Pro)]
    public async Task<ActionResult<CarPublicationResponse>> PublishCar(int carId, PublishRequest request)
    {
        var (tenantId, isSuperAdmin) = await GetTenantContextAsync();
        if (!isSuperAdmin && !tenantId.HasValue)
            return Forbid();

        var car = await _db.Cars.FirstOrDefaultAsync(c => c.Id == carId);
        if (car == null) return NotFound();
        if (!isSuperAdmin && car.TenantId != tenantId) return Forbid();

        var connection = await _db.PlatformConnections
            .FirstOrDefaultAsync(c => c.Id == request.ConnectionId && c.TenantId == tenantId);
        if (connection == null)
            return NotFound(new { message = "Platform connection not found for your tenant." });

        try
        {
            var publication = await _publishingService.PublishCarAsync(carId, request.ConnectionId);
            await _db.Entry(publication).Reference(p => p.Connection).LoadAsync();
            await _db.Entry(publication.Connection).Reference(c => c.Platform).LoadAsync();
            return Ok(MapToPublicationResponse(publication));
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("publications/{id}/update")]
    [RequireTier(TenantTier.Pro)]
    public async Task<ActionResult<CarPublicationResponse>> UpdatePublication(int id)
    {
        var (tenantId, isSuperAdmin) = await GetTenantContextAsync();
        if (!isSuperAdmin && !tenantId.HasValue)
            return Forbid();

        var publication = await _db.CarPublications
            .Include(p => p.Connection)
            .Include(p => p.Car)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (publication == null) return NotFound();
        if (!isSuperAdmin && publication.Connection.TenantId != tenantId) return Forbid();

        try
        {
            var updated = await _publishingService.UpdatePublicationAsync(id);
            await _db.Entry(updated).Reference(p => p.Connection).LoadAsync();
            await _db.Entry(updated.Connection).Reference(c => c.Platform).LoadAsync();
            return Ok(MapToPublicationResponse(updated));
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("publications/{id}/unpublish")]
    [RequireTier(TenantTier.Pro)]
    public async Task<ActionResult<CarPublicationResponse>> UnpublishCar(int id)
    {
        var (tenantId, isSuperAdmin) = await GetTenantContextAsync();
        if (!isSuperAdmin && !tenantId.HasValue)
            return Forbid();

        var publication = await _db.CarPublications
            .Include(p => p.Connection)
            .Include(p => p.Car)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (publication == null) return NotFound();
        if (!isSuperAdmin && publication.Connection.TenantId != tenantId) return Forbid();

        try
        {
            var updated = await _publishingService.UnpublishCarAsync(id);
            await _db.Entry(updated).Reference(p => p.Connection).LoadAsync();
            await _db.Entry(updated.Connection).Reference(c => c.Platform).LoadAsync();
            return Ok(MapToPublicationResponse(updated));
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // ─── Investors ─────────────────────────────────────────────

    [HttpGet("investors")]
    [RequireTier(TenantTier.Pro)]
    public async Task<ActionResult<List<InvestorResponse>>> GetInvestors()
    {
        var (tenantId, isSuperAdmin) = await GetTenantContextAsync();
        if (!isSuperAdmin && !tenantId.HasValue)
            return Forbid();

        var query = _db.Investors
            .Include(i => i.Contributions)
            .AsQueryable();

        if (!isSuperAdmin)
            query = query.Where(i => i.TenantId == tenantId);

        var investors = await query.OrderBy(i => i.Name).ToListAsync();

        return Ok(investors.Select(MapToInvestorResponse).ToList());
    }

    [HttpPost("investors")]
    [RequireTier(TenantTier.Pro)]
    public async Task<ActionResult<InvestorResponse>> CreateInvestor(CreateInvestorRequest request)
    {
        var tenantId = await GetRequiredTenantIdAsync();
        if (!tenantId.HasValue && !User.IsInRole("SuperAdmin"))
            return Forbid();

        var investor = new Investor
        {
            TenantId = tenantId!.Value,
            Name = request.Name,
            Email = request.Email,
            Phone = request.Phone,
            Notes = request.Notes
        };

        _db.Investors.Add(investor);
        await _db.SaveChangesAsync();

        return Created($"/api/crm/investors/{investor.Id}", MapToInvestorResponse(investor));
    }

    [HttpGet("investors/{id}")]
    [RequireTier(TenantTier.Pro)]
    public async Task<ActionResult<InvestorResponse>> GetInvestor(int id)
    {
        var (tenantId, isSuperAdmin) = await GetTenantContextAsync();
        if (!isSuperAdmin && !tenantId.HasValue)
            return Forbid();

        var investor = await _db.Investors
            .Include(i => i.Contributions)
            .FirstOrDefaultAsync(i => i.Id == id);

        if (investor == null) return NotFound();
        if (!isSuperAdmin && investor.TenantId != tenantId) return Forbid();

        return Ok(MapToInvestorResponse(investor));
    }

    [HttpPut("investors/{id}")]
    [RequireTier(TenantTier.Pro)]
    public async Task<ActionResult<InvestorResponse>> UpdateInvestor(int id, UpdateInvestorRequest request)
    {
        var (tenantId, isSuperAdmin) = await GetTenantContextAsync();
        if (!isSuperAdmin && !tenantId.HasValue)
            return Forbid();

        var investor = await _db.Investors
            .Include(i => i.Contributions)
            .FirstOrDefaultAsync(i => i.Id == id);

        if (investor == null) return NotFound();
        if (!isSuperAdmin && investor.TenantId != tenantId) return Forbid();

        if (request.Name != null) investor.Name = request.Name;
        if (request.Email != null) investor.Email = request.Email;
        if (request.Phone != null) investor.Phone = request.Phone;
        if (request.Notes != null) investor.Notes = request.Notes;

        await _db.SaveChangesAsync();

        return Ok(MapToInvestorResponse(investor));
    }

    [HttpDelete("investors/{id}")]
    [RequireTier(TenantTier.Pro)]
    public async Task<IActionResult> DeleteInvestor(int id)
    {
        var (tenantId, isSuperAdmin) = await GetTenantContextAsync();
        if (!isSuperAdmin && !tenantId.HasValue)
            return Forbid();

        var investor = await _db.Investors
            .Include(i => i.Contributions)
            .FirstOrDefaultAsync(i => i.Id == id);

        if (investor == null) return NotFound();
        if (!isSuperAdmin && investor.TenantId != tenantId) return Forbid();

        if (investor.Contributions.Any())
            return BadRequest(new { message = "Cannot delete an investor with existing contributions." });

        _db.Investors.Remove(investor);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // ─── Investor Contributions ─────────────────────────────────

    [HttpGet("investors/{id}/contributions")]
    [RequireTier(TenantTier.Pro)]
    public async Task<ActionResult<List<ContributionResponse>>> GetContributions(int id)
    {
        var (tenantId, isSuperAdmin) = await GetTenantContextAsync();
        if (!isSuperAdmin && !tenantId.HasValue)
            return Forbid();

        var investor = await _db.Investors.FirstOrDefaultAsync(i => i.Id == id);
        if (investor == null) return NotFound();
        if (!isSuperAdmin && investor.TenantId != tenantId) return Forbid();

        var contributions = await _db.InvestorContributions
            .Include(c => c.Investor)
            .Include(c => c.Car)
            .Where(c => c.InvestorId == id)
            .OrderByDescending(c => c.Date)
            .ToListAsync();

        return Ok(contributions.Select(MapToContributionResponse).ToList());
    }

    [HttpPost("investors/{id}/contributions")]
    [RequireTier(TenantTier.Pro)]
    public async Task<ActionResult<ContributionResponse>> CreateContribution(int id, CreateContributionRequest request)
    {
        var (tenantId, isSuperAdmin) = await GetTenantContextAsync();
        if (!isSuperAdmin && !tenantId.HasValue)
            return Forbid();

        var investor = await _db.Investors.FirstOrDefaultAsync(i => i.Id == id);
        if (investor == null) return NotFound();
        if (!isSuperAdmin && investor.TenantId != tenantId) return Forbid();

        if (request.CarId.HasValue)
        {
            var car = await _db.Cars.FirstOrDefaultAsync(c => c.Id == request.CarId.Value);
            if (car == null)
                return NotFound(new { message = "Car not found." });
            if (!isSuperAdmin && car.TenantId != tenantId) return Forbid();
        }

        var contribution = new InvestorContribution
        {
            InvestorId = id,
            Amount = request.Amount,
            Type = request.Type,
            Description = request.Description,
            CarId = request.CarId
        };

        _db.InvestorContributions.Add(contribution);
        await _db.SaveChangesAsync();

        await _db.Entry(contribution).Reference(c => c.Investor).LoadAsync();
        if (contribution.CarId.HasValue)
            await _db.Entry(contribution).Reference(c => c.Car).LoadAsync();

        return Created($"/api/crm/investors/{id}/contributions", MapToContributionResponse(contribution));
    }

    // ─── Car Funding ────────────────────────────────────────────

    [HttpGet("inventory/{carId}/funding")]
    [RequireTier(TenantTier.Pro)]
    public async Task<ActionResult<List<CarFundingResponse>>> GetCarFunding(int carId)
    {
        var (tenantId, isSuperAdmin) = await GetTenantContextAsync();
        if (!isSuperAdmin && !tenantId.HasValue)
            return Forbid();

        var car = await _db.Cars.FirstOrDefaultAsync(c => c.Id == carId);
        if (car == null) return NotFound();
        if (!isSuperAdmin && car.TenantId != tenantId) return Forbid();

        var fundings = await _db.CarFundings
            .Include(f => f.Investor)
            .Where(f => f.CarId == carId)
            .OrderByDescending(f => f.CreatedAt)
            .ToListAsync();

        return Ok(fundings.Select(MapToCarFundingResponse).ToList());
    }

    [HttpPost("inventory/{carId}/funding")]
    [RequireTier(TenantTier.Pro)]
    public async Task<ActionResult<CarFundingResponse>> CreateCarFunding(int carId, CreateCarFundingRequest request)
    {
        var (tenantId, isSuperAdmin) = await GetTenantContextAsync();
        if (!isSuperAdmin && !tenantId.HasValue)
            return Forbid();

        var car = await _db.Cars.FirstOrDefaultAsync(c => c.Id == carId);
        if (car == null) return NotFound();
        if (!isSuperAdmin && car.TenantId != tenantId) return Forbid();

        if (request.InvestorId.HasValue)
        {
            var investor = await _db.Investors.FirstOrDefaultAsync(i => i.Id == request.InvestorId.Value);
            if (investor == null)
                return NotFound(new { message = "Investor not found." });
            if (!isSuperAdmin && investor.TenantId != tenantId) return Forbid();
        }

        var funding = new CarFunding
        {
            CarId = carId,
            InvestorId = request.InvestorId,
            Amount = request.Amount,
            Notes = request.Notes
        };

        _db.CarFundings.Add(funding);
        await _db.SaveChangesAsync();

        if (funding.InvestorId.HasValue)
            await _db.Entry(funding).Reference(f => f.Investor).LoadAsync();

        return Created($"/api/crm/inventory/{carId}/funding", MapToCarFundingResponse(funding));
    }

    [HttpDelete("inventory/{carId}/funding/{fundingId}")]
    [RequireTier(TenantTier.Pro)]
    public async Task<IActionResult> DeleteCarFunding(int carId, int fundingId)
    {
        var (tenantId, isSuperAdmin) = await GetTenantContextAsync();
        if (!isSuperAdmin && !tenantId.HasValue)
            return Forbid();

        var car = await _db.Cars.FirstOrDefaultAsync(c => c.Id == carId);
        if (car == null) return NotFound();
        if (!isSuperAdmin && car.TenantId != tenantId) return Forbid();

        var funding = await _db.CarFundings
            .FirstOrDefaultAsync(f => f.Id == fundingId && f.CarId == carId);

        if (funding == null) return NotFound();

        _db.CarFundings.Remove(funding);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // ─── Consignment Inquiries ───────────────────────────────────

    [HttpGet("inquiries")]
    public async Task<ActionResult<List<InquiryResponse>>> GetInquiries()
    {
        var (tenantId, isSuperAdmin) = await GetTenantContextAsync();
        if (!isSuperAdmin && !tenantId.HasValue)
            return Forbid();

        var query = _db.ConsignmentInquiries.AsQueryable();
        if (!isSuperAdmin)
            query = query.Where(i => i.TenantId == tenantId);

        var inquiries = await query.OrderByDescending(i => i.CreatedAt).ToListAsync();
        return Ok(inquiries.Select(i => new InquiryResponse(
            i.Id, i.TenantId, i.FullName, i.Email, i.Phone,
            i.VIN, i.Make, i.Model, i.Year,
            i.Status, i.CarId, i.CreatedAt
        )).ToList());
    }

    [HttpPut("inquiries/{id}/approve")]
    public async Task<ActionResult<InquiryResponse>> ApproveInquiry(int id)
    {
        var (tenantId, isSuperAdmin) = await GetTenantContextAsync();
        if (!isSuperAdmin && !tenantId.HasValue)
            return Forbid();

        var inquiry = await _db.ConsignmentInquiries.FindAsync(id);
        if (inquiry == null) return NotFound();
        if (!isSuperAdmin && inquiry.TenantId != tenantId) return Forbid();
        if (inquiry.Status != "Pending") return BadRequest("Inquiry is not pending");

        // Find the first tenant employee to act as the car owner
        var tenantUser = await _db.Users
            .Where(u => u.TenantId == inquiry.TenantId)
            .FirstOrDefaultAsync();
        if (tenantUser == null) return BadRequest("No tenant employee found");

        var car = new Car
        {
            UserId = tenantUser.Id,
            TenantId = inquiry.TenantId,
            Make = inquiry.Make ?? "Unknown",
            Model = inquiry.Model ?? "Unknown",
            Year = inquiry.Year ?? 0,
            Mileage = 0,
            VIN = inquiry.VIN,
            Status = CarStatus.Pending,
            ListingType = ListingType.Consigned,
            Description = $"Consignment inquiry from {inquiry.FullName} ({inquiry.Email})",
        };
        _db.Cars.Add(car);
        await _db.SaveChangesAsync();

        inquiry.Status = "Approved";
        inquiry.CarId = car.Id;
        await _db.SaveChangesAsync();

        return Ok(new InquiryResponse(
            inquiry.Id, inquiry.TenantId, inquiry.FullName, inquiry.Email, inquiry.Phone,
            inquiry.VIN, inquiry.Make, inquiry.Model, inquiry.Year,
            inquiry.Status, inquiry.CarId, inquiry.CreatedAt
        ));
    }

    [HttpPut("inquiries/{id}/reject")]
    public async Task<ActionResult<InquiryResponse>> RejectInquiry(int id)
    {
        var (tenantId, isSuperAdmin) = await GetTenantContextAsync();
        if (!isSuperAdmin && !tenantId.HasValue)
            return Forbid();

        var inquiry = await _db.ConsignmentInquiries.FindAsync(id);
        if (inquiry == null) return NotFound();
        if (!isSuperAdmin && inquiry.TenantId != tenantId) return Forbid();
        if (inquiry.Status != "Pending") return BadRequest("Inquiry is not pending");

        inquiry.Status = "Rejected";
        await _db.SaveChangesAsync();

        return Ok(new InquiryResponse(
            inquiry.Id, inquiry.TenantId, inquiry.FullName, inquiry.Email, inquiry.Phone,
            inquiry.VIN, inquiry.Make, inquiry.Model, inquiry.Year,
            inquiry.Status, inquiry.CarId, inquiry.CreatedAt
        ));
    }

    // ─── Car Inquiries ──────────────────────────────────────────

    [HttpGet("car-inquiries")]
    public async Task<ActionResult<List<CarInquiryResponse>>> GetCarInquiries()
    {
        var (tenantId, isSuperAdmin) = await GetTenantContextAsync();
        if (!isSuperAdmin && !tenantId.HasValue)
            return Forbid();

        var query = _db.CarInquiries.Include(ci => ci.Car).AsQueryable();
        if (!isSuperAdmin)
            query = query.Where(ci => ci.TenantId == tenantId);

        var inquiries = await query.OrderByDescending(ci => ci.CreatedAt).ToListAsync();
        return Ok(inquiries.Select(ci => new CarInquiryResponse(
            ci.Id, ci.CarId,
            $"{ci.Car.Year} {ci.Car.Make} {ci.Car.Model}",
            ci.FullName, ci.Email, ci.Phone,
            ci.Message, ci.Status, ci.CreatedAt
        )).ToList());
    }

    [HttpPut("car-inquiries/{id}/status")]
    public async Task<ActionResult<CarInquiryResponse>> UpdateCarInquiryStatus(int id, [FromBody] UpdateCarInquiryStatusRequest request)
    {
        var (tenantId, isSuperAdmin) = await GetTenantContextAsync();
        if (!isSuperAdmin && !tenantId.HasValue)
            return Forbid();

        var inquiry = await _db.CarInquiries.Include(ci => ci.Car).FirstOrDefaultAsync(ci => ci.Id == id);
        if (inquiry == null) return NotFound();
        if (!isSuperAdmin && inquiry.TenantId != tenantId) return Forbid();

        if (request.Status != "Contacted" && request.Status != "Closed")
            return BadRequest("Status must be 'Contacted' or 'Closed'");

        inquiry.Status = request.Status;
        await _db.SaveChangesAsync();

        return Ok(new CarInquiryResponse(
            inquiry.Id, inquiry.CarId,
            $"{inquiry.Car.Year} {inquiry.Car.Make} {inquiry.Car.Model}",
            inquiry.FullName, inquiry.Email, inquiry.Phone,
            inquiry.Message, inquiry.Status, inquiry.CreatedAt
        ));
    }

    // ─── Mapping Helpers ─────────────────────────────────────────

    private static CrmCarResponse MapToCrmCarResponse(Car c)
    {
        var totalExpenses = c.Expenses.Sum(e => e.Amount);
        CarFinancialsResponse? financials = c.Financials != null
            ? MapToFinancialsResponse(c.Financials, totalExpenses)
            : null;

        return new CrmCarResponse(
            c.Id, c.Make, c.Model, c.Year, c.Mileage,
            c.Color, c.Condition, c.AskingPrice,
            c.Status.ToString(), c.ListingType.ToString(), c.IsFeatured,
            c.User?.FullName, c.CreatedAt,
            financials,
            c.Images.Select(i => new CarImageResponse(i.Id, i.BlobUrl, i.FileName, i.IsPrimary, i.UploadedAt)).ToList(),
            c.Expenses.Count, totalExpenses);
    }

    private static CarFinancialsResponse MapToFinancialsResponse(CarFinancials f, decimal totalExpenses)
    {
        decimal? profit = f.SalePrice.HasValue && f.PurchasePrice.HasValue
            ? f.SalePrice.Value - f.PurchasePrice.Value - totalExpenses
            : null;

        return new CarFinancialsResponse(
            f.Id, f.CarId, f.PurchasePrice, f.SalePrice,
            f.Notes, totalExpenses, profit);
    }

    private static CarPublicationResponse MapToPublicationResponse(CarPublication p) => new(
        p.Id, p.CarId, p.PlatformConnectionId,
        p.Connection.Platform.Name, p.Connection.Platform.Slug,
        p.Status.ToString(), p.ExternalListingId, p.ExternalUrl, p.ErrorMessage,
        p.PublishedAt, p.UnpublishedAt);

    // ─── Branding ────────────────────────────────────────────────

    [HttpGet("branding")]
    [Authorize(Roles = "TenantAdmin,Admin")]
    public async Task<ActionResult<TenantBrandingResponse>> GetBranding()
    {
        var tenantId = await GetRequiredTenantIdAsync();
        if (!tenantId.HasValue) return Forbid();

        var tenant = await _db.Tenants
            .Include(t => t.Branding)
            .FirstOrDefaultAsync(t => t.Id == tenantId.Value);

        if (tenant == null) return NotFound();

        var branding = tenant.Branding ?? await CreateDefaultBrandingAsync(tenant);

        return Ok(MapToBrandingResponse(branding, tenant));
    }

    [HttpPut("branding")]
    [Authorize(Roles = "TenantAdmin,Admin")]
    public async Task<ActionResult<TenantBrandingResponse>> UpdateBranding(UpdateBrandingRequest request)
    {
        var tenantId = await GetRequiredTenantIdAsync();
        if (!tenantId.HasValue) return Forbid();

        var tenant = await _db.Tenants
            .Include(t => t.Branding)
            .FirstOrDefaultAsync(t => t.Id == tenantId.Value);

        if (tenant == null) return NotFound();

        var branding = tenant.Branding ?? await CreateDefaultBrandingAsync(tenant);

        // Basic tier: colors, dealer name, tagline
        if (request.PrimaryColor != null) branding.PrimaryColor = request.PrimaryColor;
        if (request.SecondaryColor != null) branding.SecondaryColor = request.SecondaryColor;
        if (request.AccentColor != null) branding.AccentColor = request.AccentColor;
        if (request.TextColor != null) branding.TextColor = request.TextColor;
        if (request.BackgroundColor != null) branding.BackgroundColor = request.BackgroundColor;
        if (request.DealerName != null) branding.DealerName = request.DealerName;
        if (request.Tagline != null) branding.Tagline = request.Tagline;
        if (request.Language != null && (request.Language == "en" || request.Language == "es"))
            branding.Language = request.Language;

        // Pro+ tier: layout editor
        if (request.LandingLayoutJson != null)
        {
            if (tenant.Tier < TenantTier.Pro)
                return BadRequest(new { message = "Landing page layout customization requires Pro tier or higher." });
            branding.LandingLayoutJson = request.LandingLayoutJson;
        }

        // Enterprise tier: custom domain
        if (request.CustomDomain != null)
        {
            if (tenant.Tier < TenantTier.Enterprise)
                return BadRequest(new { message = "Custom domain requires Enterprise tier." });
            branding.CustomDomain = request.CustomDomain;
        }

        branding.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(MapToBrandingResponse(branding, tenant));
    }

    [HttpPost("branding/logo")]
    [Authorize(Roles = "TenantAdmin,Admin")]
    public async Task<ActionResult<TenantBrandingResponse>> UploadLogo(IFormFile file)
    {
        if (file.Length == 0) return BadRequest(new { message = "No file provided." });
        if (file.Length > 2 * 1024 * 1024) return BadRequest(new { message = "Logo must be under 2MB." });

        var tenantId = await GetRequiredTenantIdAsync();
        if (!tenantId.HasValue) return Forbid();

        var tenant = await _db.Tenants
            .Include(t => t.Branding)
            .FirstOrDefaultAsync(t => t.Id == tenantId.Value);

        if (tenant == null) return NotFound();

        var branding = tenant.Branding ?? await CreateDefaultBrandingAsync(tenant);

        // Delete old logo if exists
        if (!string.IsNullOrEmpty(branding.LogoUrl))
            await _blobService.DeleteAsync(branding.LogoUrl);

        using var stream = file.OpenReadStream();
        branding.LogoUrl = await _blobService.UploadAsync(
            stream,
            $"tenant-{tenantId}-logo{Path.GetExtension(file.FileName)}",
            file.ContentType);
        branding.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(MapToBrandingResponse(branding, tenant));
    }

    [HttpDelete("branding/logo")]
    [Authorize(Roles = "TenantAdmin,Admin")]
    public async Task<ActionResult<TenantBrandingResponse>> DeleteLogo()
    {
        var tenantId = await GetRequiredTenantIdAsync();
        if (!tenantId.HasValue) return Forbid();

        var tenant = await _db.Tenants
            .Include(t => t.Branding)
            .FirstOrDefaultAsync(t => t.Id == tenantId.Value);

        if (tenant == null) return NotFound();

        var branding = tenant.Branding;
        if (branding == null || string.IsNullOrEmpty(branding.LogoUrl))
            return BadRequest(new { message = "No logo to remove." });

        await _blobService.DeleteAsync(branding.LogoUrl);
        branding.LogoUrl = null;
        branding.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(MapToBrandingResponse(branding, tenant));
    }

    private async Task<TenantBranding> CreateDefaultBrandingAsync(Tenant tenant)
    {
        var branding = new TenantBranding
        {
            TenantId = tenant.Id,
            DealerName = tenant.Name,
            LandingLayoutJson = "[\"hero\",\"featured\",\"inventory\",\"about\",\"contact\"]"
        };
        _db.TenantBrandings.Add(branding);
        await _db.SaveChangesAsync();
        tenant.Branding = branding;
        return branding;
    }

    private static TenantBrandingResponse MapToBrandingResponse(TenantBranding b, Tenant t) => new(
        b.Id, b.TenantId, t.Name, t.Tier.ToString(),
        b.PrimaryColor, b.SecondaryColor, b.AccentColor,
        b.TextColor, b.BackgroundColor,
        b.LogoUrl, b.FaviconUrl, b.DealerName, b.Tagline,
        b.Language,
        b.LandingLayoutJson, b.CustomDomain);

    private static InvestorResponse MapToInvestorResponse(Investor i)
    {
        var totalInvested = i.Contributions.Where(c => c.Amount > 0).Sum(c => c.Amount);
        var totalReturned = i.Contributions.Where(c => c.Amount < 0).Sum(c => Math.Abs(c.Amount));
        var balance = i.Contributions.Sum(c => c.Amount);

        return new InvestorResponse(i.Id, i.Name, i.Email, i.Phone, i.Notes,
            totalInvested, totalReturned, balance, i.CreatedAt);
    }

    private static ContributionResponse MapToContributionResponse(InvestorContribution c)
    {
        var carName = c.Car != null ? $"{c.Car.Year} {c.Car.Make} {c.Car.Model}" : null;
        return new ContributionResponse(c.Id, c.InvestorId, c.Investor.Name, c.Amount,
            c.Type, c.Description, c.CarId, carName, c.Date);
    }

    private static CarFundingResponse MapToCarFundingResponse(CarFunding f) => new(
        f.Id, f.CarId, f.InvestorId, f.Investor?.Name, f.Amount, f.Notes, f.CreatedAt);
}
