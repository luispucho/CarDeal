namespace CarDeal.Api.Models;

public class Expense
{
    public int Id { get; set; }
    public int CarId { get; set; }
    public Car Car { get; set; } = null!;

    public ExpenseType Type { get; set; }
    public decimal Amount { get; set; }
    public string? Description { get; set; }
    public DateTime Date { get; set; } = DateTime.UtcNow;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public enum ExpenseType
{
    Repair,
    Marketing,
    Transport,
    Inspection,
    Other
}
