namespace CarDeal.Api.Models;

public class CarFunding
{
    public int Id { get; set; }
    public int CarId { get; set; }
    public Car Car { get; set; } = null!;

    public int? InvestorId { get; set; } // null = dealer's own funds
    public Investor? Investor { get; set; }

    public decimal Amount { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
