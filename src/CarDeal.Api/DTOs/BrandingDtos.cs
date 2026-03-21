namespace CarDeal.Api.DTOs;

public record TenantBrandingResponse(
    int Id, int TenantId, string TenantName, string Tier,
    string PrimaryColor, string SecondaryColor, string AccentColor,
    string TextColor, string BackgroundColor,
    string? LogoUrl, string? FaviconUrl, string? DealerName, string? Tagline,
    string? LandingLayoutJson, string? CustomDomain);

public record UpdateBrandingRequest(
    string? PrimaryColor, string? SecondaryColor, string? AccentColor,
    string? TextColor, string? BackgroundColor,
    string? DealerName, string? Tagline,
    string? LandingLayoutJson, string? CustomDomain);

public record UpdateTenantTierRequest(string Tier);
