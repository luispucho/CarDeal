namespace CarDeal.Api.Models;

public class ExternalPlatform
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? IconUrl { get; set; }
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
}
