using System.ComponentModel.DataAnnotations;

namespace CarDeal.Api.DTOs;

public record CreateCarInquiryRequest(
    [Required] int CarId,
    [Required] string FullName,
    [Required] string Email,
    [Required] string Phone,
    string? Message);

public record CarInquiryResponse(
    int Id, int CarId, string CarName, string FullName, string Email,
    string Phone, string? Message, string Status, DateTime CreatedAt);

public record UpdateCarInquiryStatusRequest([Required] string Status);
