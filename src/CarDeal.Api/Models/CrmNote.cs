namespace CarDeal.Api.Models;

public class CrmNote
{
    public int Id { get; set; }
    public int CarId { get; set; }
    public Car Car { get; set; } = null!;

    public string AuthorUserId { get; set; } = string.Empty;
    public User Author { get; set; } = null!;

    public string Content { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
