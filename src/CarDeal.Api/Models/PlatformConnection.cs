namespace CarDeal.Api.Models;

public class PlatformConnection
{
    public int Id { get; set; }
    public int TenantId { get; set; }
    public Tenant Tenant { get; set; } = null!;
    public int PlatformId { get; set; }
    public ExternalPlatform Platform { get; set; } = null!;

    public string? ApiKey { get; set; }
    public string? ApiSecret { get; set; }
    public string? AccessToken { get; set; }
    public string? AccountId { get; set; }
    public string? ConfigJson { get; set; }
    public bool IsEnabled { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
