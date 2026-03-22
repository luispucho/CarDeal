namespace CarDeal.Api.Models;

public class PageView
{
    public long Id { get; set; }
    public string Page { get; set; } = string.Empty;
    public int? CarId { get; set; }
    public int? TenantId { get; set; }
    public string? City { get; set; }
    public string? Country { get; set; }
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public string? IpAddress { get; set; }
    public string SessionId { get; set; } = string.Empty;
    public int? DurationSeconds { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Car? Car { get; set; }
    public Tenant? Tenant { get; set; }
}
