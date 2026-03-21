namespace CarDeal.Api.Models;

public class CarPublication
{
    public int Id { get; set; }
    public int CarId { get; set; }
    public Car Car { get; set; } = null!;
    public int PlatformConnectionId { get; set; }
    public PlatformConnection Connection { get; set; } = null!;

    public PublicationStatus Status { get; set; } = PublicationStatus.Draft;
    public string? ExternalListingId { get; set; }
    public string? ExternalUrl { get; set; }
    public string? ErrorMessage { get; set; }
    public DateTime? PublishedAt { get; set; }
    public DateTime? UnpublishedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public enum PublicationStatus
{
    Draft,
    Publishing,
    Published,
    Failed,
    Unpublishing,
    Unpublished
}
