namespace CarDeal.Api.Models;

public class CarInquiry
{
    public int Id { get; set; }
    public int CarId { get; set; }
    public Car Car { get; set; } = null!;
    public int? TenantId { get; set; }
    public Tenant? Tenant { get; set; }

    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? Message { get; set; }

    public string Status { get; set; } = "New"; // New, Contacted, Closed
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
