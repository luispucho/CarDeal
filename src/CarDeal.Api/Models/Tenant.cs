namespace CarDeal.Api.Models;

public class Tenant
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? LogoUrl { get; set; }
    public string? ContactEmail { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public TenantTier Tier { get; set; } = TenantTier.Basic;
    public TenantBranding? Branding { get; set; }
    
    public ICollection<User> Users { get; set; } = new List<User>();
    public ICollection<Car> Cars { get; set; } = new List<Car>();
}

public enum TenantTier
{
    Basic,      // Logo, dealer name, primary/secondary colors
    Pro,        // + Drag-and-drop landing page layout editor
    Enterprise  // + Custom domain, priority badge
}
