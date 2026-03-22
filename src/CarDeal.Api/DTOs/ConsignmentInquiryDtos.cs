using System.ComponentModel.DataAnnotations;

namespace CarDeal.Api.DTOs;

public record CreateInquiryRequest(
    [Required] string FullName,
    [Required] string Email,
    [Required] string Phone,
    [Required] string VIN
);

public record VinDecodeResponse(
    string? Make, string? Model, string? ModelYear,
    string? BodyClass, string? DriveType, string? FuelTypePrimary,
    string? EngineCylinders, string? DisplacementL,
    string? TransmissionStyle, string? PlantCountry
);

public record InquiryResponse(
    int Id, int TenantId, string FullName, string Email, string Phone,
    string VIN, string? Make, string? Model, int? Year,
    string Status, int? CarId, DateTime CreatedAt
);
