namespace CarDeal.Api.Models;

public class Investor
{
    public int Id { get; set; }
    public int TenantId { get; set; }
    public Tenant Tenant { get; set; } = null!;

    public string Name { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<InvestorContribution> Contributions { get; set; } = new List<InvestorContribution>();
    public ICollection<CarFunding> CarFundings { get; set; } = new List<CarFunding>();
}
