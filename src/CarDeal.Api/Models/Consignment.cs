namespace CarDeal.Api.Models;

public class Consignment
{
    public int Id { get; set; }
    public int CarId { get; set; }
    public Car Car { get; set; } = null!;
    
    public decimal AgreedPrice { get; set; }
    public decimal CommissionPercent { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public ConsignmentStatus Status { get; set; } = ConsignmentStatus.Active;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public enum ConsignmentStatus
{
    Active,
    Sold,
    Expired,
    Cancelled
}
