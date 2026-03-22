namespace CarDeal.Api.Models;

public class TenantBranding
{
    public int Id { get; set; }
    public int TenantId { get; set; }
    public Tenant Tenant { get; set; } = null!;

    // Colors
    public string PrimaryColor { get; set; } = "#2563eb";     // blue-600
    public string SecondaryColor { get; set; } = "#1e40af";   // blue-800
    public string AccentColor { get; set; } = "#3b82f6";      // blue-500
    public string TextColor { get; set; } = "#1f2937";        // gray-800
    public string BackgroundColor { get; set; } = "#ffffff";  // white

    // Branding
    public string? LogoUrl { get; set; }
    public string? FaviconUrl { get; set; }
    public string? DealerName { get; set; }
    public string? Tagline { get; set; }
    public string Language { get; set; } = "en";  // "en" or "es"

    // Layout (Pro+ tier) - JSON array of section IDs defining order
    public string? LandingLayoutJson { get; set; }  // e.g., ["hero","featured","inventory","about","contact"]

    // Enterprise tier
    public string? CustomDomain { get; set; }

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
