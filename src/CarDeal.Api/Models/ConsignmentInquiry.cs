namespace CarDeal.Api.Models;

public class ConsignmentInquiry
{
    public int Id { get; set; }
    public int TenantId { get; set; }
    public Tenant Tenant { get; set; } = null!;

    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string VIN { get; set; } = string.Empty;

    // VIN decoded data
    public string? Make { get; set; }
    public string? Model { get; set; }
    public int? Year { get; set; }

    public string Status { get; set; } = "Pending"; // Pending, Approved, Rejected
    public int? CarId { get; set; }
    public Car? Car { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
