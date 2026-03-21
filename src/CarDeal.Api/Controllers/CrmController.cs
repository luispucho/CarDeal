using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CarDeal.Api.Data;
using CarDeal.Api.DTOs;
using CarDeal.Api.Models;

namespace CarDeal.Api.Controllers;

[ApiController]
[Route("api/crm")]
[Authorize]
public class CrmController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly UserManager<User> _userManager;

    public CrmController(AppDbContext db, UserManager<User> userManager)
    {
        _db = db;
        _userManager = userManager;
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
}
