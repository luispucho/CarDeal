namespace CarDeal.Api.Models;

public class InvestorContribution
{
    public int Id { get; set; }
    public int InvestorId { get; set; }
    public Investor Investor { get; set; } = null!;

    public decimal Amount { get; set; }
    public string Type { get; set; } = string.Empty; // "Investment", "Return", "Profit", "Withdrawal"
    public string? Description { get; set; }
    public int? CarId { get; set; }
    public Car? Car { get; set; }
    public DateTime Date { get; set; } = DateTime.UtcNow;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
