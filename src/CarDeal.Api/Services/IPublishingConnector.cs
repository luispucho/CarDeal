using CarDeal.Api.Models;

namespace CarDeal.Api.Services;

public interface IPublishingConnector
{
    string PlatformSlug { get; }
    Task<PublishResult> PublishAsync(Car car, PlatformConnection connection);
    Task<PublishResult> UpdateAsync(Car car, PlatformConnection connection, string externalListingId);
    Task<PublishResult> UnpublishAsync(PlatformConnection connection, string externalListingId);
}

public record PublishResult(bool Success, string? ExternalListingId = null, string? ExternalUrl = null, string? Error = null);

public class MockPublishingConnector : IPublishingConnector
{
    private readonly string _slug;
    public string PlatformSlug => _slug;

    public MockPublishingConnector(string slug) => _slug = slug;

    public Task<PublishResult> PublishAsync(Car car, PlatformConnection connection)
    {
        var shortId = Guid.NewGuid().ToString("N")[..8];
        var listingId = $"{_slug}-{car.Id}-{shortId}";
        var url = _slug switch
        {
            "facebook" => $"https://facebook.com/marketplace/item/{listingId}",
            "craigslist" => $"https://craigslist.org/cto/{listingId}.html",
            "carscom" => $"https://cars.com/vehicledetail/{listingId}",
            "autotrader" => $"https://autotrader.com/cars-for-sale/{listingId}",
            "cargurus" => $"https://cargurus.com/Cars/{listingId}",
            "offerup" => $"https://offerup.com/item/detail/{listingId}",
            _ => $"https://example.com/{listingId}"
        };
        return Task.FromResult(new PublishResult(true, listingId, url));
    }

    public Task<PublishResult> UpdateAsync(Car car, PlatformConnection connection, string externalListingId)
        => Task.FromResult(new PublishResult(true, externalListingId));

    public Task<PublishResult> UnpublishAsync(PlatformConnection connection, string externalListingId)
        => Task.FromResult(new PublishResult(true));
}
