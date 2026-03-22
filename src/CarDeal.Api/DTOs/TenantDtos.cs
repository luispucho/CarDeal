using System.ComponentModel.DataAnnotations;

namespace CarDeal.Api.DTOs;

public record TenantResponse(int Id, string Name, string Slug, string? LogoUrl, string? ContactEmail, string Tier, DateTime CreatedAt, int UserCount, int CarCount, bool IsActive, bool IsShowcased);
public record CreateTenantRequest([Required] string Name, [Required] string Slug, string? ContactEmail, bool IsShowcased = false);
public record UpdateTenantRequest(string? Name, string? Slug, string? ContactEmail, bool? IsShowcased);
public record AssignUserRequest([Required] string UserId);
public record ResetPasswordResponse(string Email, string NewPassword, string Message);
