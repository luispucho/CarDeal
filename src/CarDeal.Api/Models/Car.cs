namespace CarDeal.Api.Models;

public class Car
{
    public int Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public User User { get; set; } = null!;
    
    public string Make { get; set; } = string.Empty;
    public string Model { get; set; } = string.Empty;
    public int Year { get; set; }
    public int Mileage { get; set; }
    public string? VIN { get; set; }
    public string? Color { get; set; }
    public string? Condition { get; set; } // Excellent, Good, Fair, Poor
    public string? Description { get; set; }
    public decimal? AskingPrice { get; set; }
    public bool IsFeatured { get; set; }
    public ListingType ListingType { get; set; } = ListingType.Consigned;
    public CarStatus Status { get; set; } = CarStatus.Pending;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    public ICollection<CarImage> Images { get; set; } = new List<CarImage>();
    public ICollection<Offer> Offers { get; set; } = new List<Offer>();
    public Consignment? Consignment { get; set; }
}

public enum ListingType
{
    Consigned,
    Inventory,
    CertifiedInventory,
    TrustedPartner
}

public enum CarStatus
{
    Pending,
    Reviewed,
    Offered,
    Consigned,
    Sold,
    Rejected
}
