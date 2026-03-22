namespace CarDeal.Api.Models;

public class HiddenCar
{
    public int Id { get; set; }
    public int TenantId { get; set; }
    public Tenant Tenant { get; set; } = null!;
    public int CarId { get; set; }
    public Car Car { get; set; } = null!;
    public DateTime HiddenAt { get; set; } = DateTime.UtcNow;
}
