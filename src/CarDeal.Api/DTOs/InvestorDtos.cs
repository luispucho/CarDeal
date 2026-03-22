using System.ComponentModel.DataAnnotations;

namespace CarDeal.Api.DTOs;

public record InvestorResponse(int Id, string Name, string? Email, string? Phone, string? Notes,
    decimal TotalInvested, decimal TotalReturned, decimal Balance, DateTime CreatedAt);

public record CreateInvestorRequest([Required] string Name, string? Email, string? Phone, string? Notes);
public record UpdateInvestorRequest(string? Name, string? Email, string? Phone, string? Notes);

public record ContributionResponse(int Id, int InvestorId, string InvestorName, decimal Amount,
    string Type, string? Description, int? CarId, string? CarName, DateTime Date);

public record CreateContributionRequest([Required] decimal Amount, [Required] string Type, string? Description, int? CarId);

public record CarFundingResponse(int Id, int CarId, int? InvestorId, string? InvestorName, decimal Amount, string? Notes, DateTime CreatedAt);
public record CreateCarFundingRequest(int? InvestorId, [Required] decimal Amount, string? Notes);
