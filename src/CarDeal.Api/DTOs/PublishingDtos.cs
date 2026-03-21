using System.ComponentModel.DataAnnotations;

namespace CarDeal.Api.DTOs;

public record ExternalPlatformResponse(int Id, string Name, string Slug, string? IconUrl, string? Description, bool IsActive);

public record PlatformConnectionResponse(int Id, int TenantId, int PlatformId, string PlatformName, string PlatformSlug,
    string? AccountId, bool IsEnabled, DateTime CreatedAt);

public record CreateConnectionRequest([Required] int PlatformId, string? ApiKey, string? ApiSecret, string? AccessToken, string? AccountId, string? ConfigJson);
public record UpdateConnectionRequest(string? ApiKey, string? ApiSecret, string? AccessToken, string? AccountId, string? ConfigJson, bool? IsEnabled);

public record CarPublicationResponse(int Id, int CarId, int PlatformConnectionId, string PlatformName, string PlatformSlug,
    string Status, string? ExternalListingId, string? ExternalUrl, string? ErrorMessage,
    DateTime? PublishedAt, DateTime? UnpublishedAt);

public record PublishRequest(int ConnectionId);
