using System.ComponentModel.DataAnnotations;

namespace CarDeal.Api.DTOs;

public record CreateOfferRequest(
    [Required][Range(0.01, double.MaxValue)] decimal Amount,
    string? Notes
);

public record UpdateOfferRequest(
    decimal? Amount,
    string? Notes,
    string? Status
);

public record OfferResponse(
    int Id,
    int CarId,
    string AdminUserId,
    string AdminName,
    decimal Amount,
    string? Notes,
    string Status,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

public record CreateConsignmentRequest(
    [Required][Range(0.01, double.MaxValue)] decimal AgreedPrice,
    [Required][Range(0, 100)] decimal CommissionPercent,
    [Required] DateTime StartDate,
    DateTime? EndDate
);

public record UpdateConsignmentRequest(
    string? Status,
    DateTime? EndDate
);

public record ConsignmentResponse(
    int Id,
    int CarId,
    decimal AgreedPrice,
    decimal CommissionPercent,
    DateTime StartDate,
    DateTime? EndDate,
    string Status,
    DateTime CreatedAt
);
