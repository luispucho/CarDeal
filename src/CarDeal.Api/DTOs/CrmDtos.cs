using System.ComponentModel.DataAnnotations;

namespace CarDeal.Api.DTOs;

public record CarFinancialsResponse(
    int Id, int CarId, decimal? PurchasePrice, decimal? SalePrice,
    string? Notes, decimal TotalExpenses, decimal? Profit);

public record UpdateFinancialsRequest(decimal? PurchasePrice, decimal? SalePrice, string? Notes);

public record ExpenseResponse(int Id, int CarId, string Type, decimal Amount, string? Description, DateTime Date);
public record CreateExpenseRequest([Required] string Type, [Required] decimal Amount, string? Description, DateTime? Date);

public record CrmNoteResponse(int Id, int CarId, string AuthorId, string AuthorName, string Content, DateTime CreatedAt);
public record CreateNoteRequest([Required] string Content);

public record CrmCarResponse(
    int Id, string Make, string Model, int Year, int Mileage,
    string? Color, string? Condition, decimal? AskingPrice,
    string Status, string ListingType, bool IsFeatured,
    string? UserName, DateTime CreatedAt,
    CarFinancialsResponse? Financials,
    List<CarImageResponse> Images,
    int ExpenseCount, decimal TotalExpenses);

public record PlatformStatsResponse(
    int TotalTenants, int TotalCars, int TotalSold, int TotalActive,
    List<TenantSalesStats> SalesByTenant,
    List<BrandStats> TopBrands,
    decimal TotalRevenue);

public record TenantSalesStats(int TenantId, string TenantName, int TotalCars, int SoldCars, decimal Revenue, int VisitsThisMonth, int VisitsThisYear);
public record BrandStats(string Make, int Count, int SoldCount);

public record TenantStatsResponse(
    int TotalCars, int SoldCars, int ConsignedCars, int PendingCars, int ActiveInventory,
    decimal TotalRevenue, decimal TotalExpenses, decimal TotalProfit,
    List<CarProfitStats> TopProfitableCars,
    List<ExpenseBreakdown> ExpensesByType,
    List<MonthlySales> MonthlySales,
    List<VisitorLocationStat> TopVisitorLocations,
    int VisitsThisMonth, int VisitsThisYear);

public record CarProfitStats(int CarId, string CarName, decimal? Profit);
public record ExpenseBreakdown(string Type, decimal Total);
public record MonthlySales(string Month, int Count, decimal Revenue);

public record EmployeeResponse(string Id, string Email, string FullName, string Role);
public record AddEmployeeRequest([Required] string Email);
public record VisitorLocationStat(string Country, string? City, int Visits);
