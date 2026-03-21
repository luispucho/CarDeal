using System.ComponentModel.DataAnnotations;

namespace CarDeal.Api.DTOs;

public record RegisterRequest(
    [Required] string Email,
    [Required] string Password,
    [Required] string FullName,
    string? Phone
);

public record LoginRequest(
    [Required] string Email,
    [Required] string Password
);

public record AuthResponse(
    string Token,
    string RefreshToken,
    DateTime Expiration,
    UserDto User
);

public record RefreshRequest(string RefreshToken);

public record UserDto(string Id, string Email, string FullName, string? Phone, string? ProfilePictureUrl, string Role);
