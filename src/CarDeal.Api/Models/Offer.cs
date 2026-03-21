namespace CarDeal.Api.Models;

public class Offer
{
    public int Id { get; set; }
    public int CarId { get; set; }
    public Car Car { get; set; } = null!;
    public string AdminUserId { get; set; } = string.Empty;
    public User AdminUser { get; set; } = null!;
    
    public decimal Amount { get; set; }
    public string? Notes { get; set; }
    public OfferStatus Status { get; set; } = OfferStatus.Pending;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public enum OfferStatus
{
    Pending,
    Accepted,
    Rejected,
    Countered
}
