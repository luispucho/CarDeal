using System.ComponentModel.DataAnnotations;

namespace CarDeal.Api.DTOs;

public record CreateCarRequest(
    [Required] string Make,
    [Required] string Model,
    [Required][Range(1900, 2100)] int Year,
    [Required][Range(0, int.MaxValue)] int Mileage,
    string? VIN,
    string? Color,
    string? Condition,
    string? Description,
    [Range(0, double.MaxValue)] decimal? AskingPrice
);

public record UpdateCarRequest(
    string? Make,
    string? Model,
    int? Year,
    int? Mileage,
    string? VIN,
    string? Color,
    string? Condition,
    string? Description,
    decimal? AskingPrice
);

public record CarResponse(
    int Id,
    string UserId,
    string UserName,
    string Make,
    string Model,
    int Year,
    int Mileage,
    string? VIN,
    string? Color,
    string? Condition,
    string? Description,
    decimal? AskingPrice,
    string Status,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    List<CarImageResponse> Images,
    List<OfferResponse>? Offers
);

public record CarImageResponse(int Id, string BlobUrl, string FileName, bool IsPrimary, DateTime UploadedAt);
