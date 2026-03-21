using System.ComponentModel.DataAnnotations;

namespace CarDeal.Api.DTOs;

public record ProfileResponse(
    string Id,
    string Email,
    string FullName,
    string? Phone,
    string? ProfilePictureUrl,
    DateTime CreatedAt
);

public record UpdateProfileRequest(
    [Required] string FullName,
    string? Phone
);
