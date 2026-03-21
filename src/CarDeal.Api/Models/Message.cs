namespace CarDeal.Api.Models;

public class Message
{
    public int Id { get; set; }
    public string SenderId { get; set; } = string.Empty;
    public User Sender { get; set; } = null!;
    public string ReceiverId { get; set; } = string.Empty;
    public User Receiver { get; set; } = null!;
    
    public int? CarId { get; set; }
    public Car? Car { get; set; }
    
    public string Subject { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
