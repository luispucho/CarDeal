namespace CarDeal.Api.Models;

public class CarFinancials
{
    public int Id { get; set; }
    public int CarId { get; set; }
    public Car Car { get; set; } = null!;

    public decimal? PurchasePrice { get; set; }
    public decimal? SalePrice { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
