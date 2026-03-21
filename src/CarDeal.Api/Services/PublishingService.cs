using Microsoft.EntityFrameworkCore;
using CarDeal.Api.Data;
using CarDeal.Api.Models;

namespace CarDeal.Api.Services;

public interface IPublishingService
{
    Task<CarPublication> PublishCarAsync(int carId, int connectionId);
    Task<CarPublication> UpdatePublicationAsync(int publicationId);
    Task<CarPublication> UnpublishCarAsync(int publicationId);
}

public class PublishingService : IPublishingService
{
    private readonly AppDbContext _db;
    private readonly IEnumerable<IPublishingConnector> _connectors;

    public PublishingService(AppDbContext db, IEnumerable<IPublishingConnector> connectors)
    {
        _db = db;
        _connectors = connectors;
    }

    private IPublishingConnector? GetConnector(string slug)
        => _connectors.FirstOrDefault(c => c.PlatformSlug == slug);

    public async Task<CarPublication> PublishCarAsync(int carId, int connectionId)
    {
        var connection = await _db.Set<PlatformConnection>()
            .Include(c => c.Platform)
            .FirstOrDefaultAsync(c => c.Id == connectionId)
            ?? throw new KeyNotFoundException("Platform connection not found.");

        var car = await _db.Cars
            .Include(c => c.Images)
            .FirstOrDefaultAsync(c => c.Id == carId)
            ?? throw new KeyNotFoundException("Car not found.");

        if (car.TenantId != connection.TenantId)
            throw new InvalidOperationException("Car and connection belong to different tenants.");

        var connector = GetConnector(connection.Platform.Slug)
            ?? throw new InvalidOperationException($"No connector registered for platform '{connection.Platform.Slug}'.");

        // Find or create a publication record
        var publication = await _db.Set<CarPublication>()
            .FirstOrDefaultAsync(p => p.CarId == carId && p.PlatformConnectionId == connectionId);

        if (publication == null)
        {
            publication = new CarPublication
            {
                CarId = carId,
                PlatformConnectionId = connectionId
            };
            _db.Set<CarPublication>().Add(publication);
        }

        publication.Status = PublicationStatus.Publishing;
        publication.ErrorMessage = null;
        publication.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        var result = await connector.PublishAsync(car, connection);

        if (result.Success)
        {
            publication.Status = PublicationStatus.Published;
            publication.ExternalListingId = result.ExternalListingId;
            publication.ExternalUrl = result.ExternalUrl;
            publication.PublishedAt = DateTime.UtcNow;
        }
        else
        {
            publication.Status = PublicationStatus.Failed;
            publication.ErrorMessage = result.Error;
        }

        publication.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return publication;
    }

    public async Task<CarPublication> UpdatePublicationAsync(int publicationId)
    {
        var publication = await _db.Set<CarPublication>()
            .Include(p => p.Connection).ThenInclude(c => c.Platform)
            .Include(p => p.Car).ThenInclude(c => c.Images)
            .FirstOrDefaultAsync(p => p.Id == publicationId)
            ?? throw new KeyNotFoundException("Publication not found.");

        if (string.IsNullOrEmpty(publication.ExternalListingId))
            throw new InvalidOperationException("Publication has no external listing ID to update.");

        var connector = GetConnector(publication.Connection.Platform.Slug)
            ?? throw new InvalidOperationException($"No connector registered for platform '{publication.Connection.Platform.Slug}'.");

        var result = await connector.UpdateAsync(publication.Car, publication.Connection, publication.ExternalListingId);

        if (result.Success)
        {
            publication.Status = PublicationStatus.Published;
            publication.ErrorMessage = null;
        }
        else
        {
            publication.Status = PublicationStatus.Failed;
            publication.ErrorMessage = result.Error;
        }

        publication.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return publication;
    }

    public async Task<CarPublication> UnpublishCarAsync(int publicationId)
    {
        var publication = await _db.Set<CarPublication>()
            .Include(p => p.Connection).ThenInclude(c => c.Platform)
            .FirstOrDefaultAsync(p => p.Id == publicationId)
            ?? throw new KeyNotFoundException("Publication not found.");

        if (string.IsNullOrEmpty(publication.ExternalListingId))
            throw new InvalidOperationException("Publication has no external listing ID to unpublish.");

        var connector = GetConnector(publication.Connection.Platform.Slug)
            ?? throw new InvalidOperationException($"No connector registered for platform '{publication.Connection.Platform.Slug}'.");

        publication.Status = PublicationStatus.Unpublishing;
        publication.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        var result = await connector.UnpublishAsync(publication.Connection, publication.ExternalListingId);

        if (result.Success)
        {
            publication.Status = PublicationStatus.Unpublished;
            publication.UnpublishedAt = DateTime.UtcNow;
            publication.ErrorMessage = null;
        }
        else
        {
            publication.Status = PublicationStatus.Failed;
            publication.ErrorMessage = result.Error;
        }

        publication.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return publication;
    }
}
