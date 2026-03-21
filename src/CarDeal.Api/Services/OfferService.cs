using Microsoft.EntityFrameworkCore;
using CarDeal.Api.Data;
using CarDeal.Api.DTOs;
using CarDeal.Api.Models;

namespace CarDeal.Api.Services;

public interface IOfferService
{
    Task<OfferResponse> CreateAsync(int carId, string adminUserId, CreateOfferRequest request);
    Task<OfferResponse?> UpdateAsync(int offerId, UpdateOfferRequest request);
    Task<ConsignmentResponse> CreateConsignmentAsync(int carId, CreateConsignmentRequest request);
    Task<ConsignmentResponse?> UpdateConsignmentAsync(int consignmentId, UpdateConsignmentRequest request);
    Task<List<ConsignmentResponse>> GetConsignmentsAsync(string? statusFilter = null);
}

public class OfferService : IOfferService
{
    private readonly AppDbContext _db;

    public OfferService(AppDbContext db) => _db = db;

    public async Task<OfferResponse> CreateAsync(int carId, string adminUserId, CreateOfferRequest request)
    {
        var car = await _db.Cars.FindAsync(carId) ?? throw new KeyNotFoundException("Car not found");

        var offer = new Offer
        {
            CarId = carId,
            AdminUserId = adminUserId,
            Amount = request.Amount,
            Notes = request.Notes
        };
        _db.Offers.Add(offer);
        car.Status = CarStatus.Offered;
        await _db.SaveChangesAsync();

        var admin = await _db.Users.FindAsync(adminUserId);
        return new OfferResponse(offer.Id, offer.CarId, offer.AdminUserId, admin?.FullName ?? "", offer.Amount, offer.Notes, offer.Status.ToString(), offer.CreatedAt, offer.UpdatedAt);
    }

    public async Task<OfferResponse?> UpdateAsync(int offerId, UpdateOfferRequest request)
    {
        var offer = await _db.Offers.Include(o => o.AdminUser).FirstOrDefaultAsync(o => o.Id == offerId);
        if (offer == null) return null;

        if (request.Amount.HasValue) offer.Amount = request.Amount.Value;
        if (request.Notes != null) offer.Notes = request.Notes;
        if (request.Status != null && Enum.TryParse<OfferStatus>(request.Status, true, out var status))
            offer.Status = status;
        offer.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return new OfferResponse(offer.Id, offer.CarId, offer.AdminUserId, offer.AdminUser.FullName, offer.Amount, offer.Notes, offer.Status.ToString(), offer.CreatedAt, offer.UpdatedAt);
    }

    public async Task<ConsignmentResponse> CreateConsignmentAsync(int carId, CreateConsignmentRequest request)
    {
        var car = await _db.Cars.FindAsync(carId) ?? throw new KeyNotFoundException("Car not found");

        var consignment = new Consignment
        {
            CarId = carId,
            AgreedPrice = request.AgreedPrice,
            CommissionPercent = request.CommissionPercent,
            StartDate = request.StartDate,
            EndDate = request.EndDate
        };
        _db.Consignments.Add(consignment);
        car.Status = CarStatus.Consigned;
        await _db.SaveChangesAsync();

        return new ConsignmentResponse(consignment.Id, consignment.CarId, consignment.AgreedPrice, consignment.CommissionPercent, consignment.StartDate, consignment.EndDate, consignment.Status.ToString(), consignment.CreatedAt);
    }

    public async Task<ConsignmentResponse?> UpdateConsignmentAsync(int consignmentId, UpdateConsignmentRequest request)
    {
        var consignment = await _db.Consignments.Include(c => c.Car).FirstOrDefaultAsync(c => c.Id == consignmentId);
        if (consignment == null) return null;

        if (request.EndDate.HasValue) consignment.EndDate = request.EndDate.Value;
        if (request.Status != null && Enum.TryParse<ConsignmentStatus>(request.Status, true, out var status))
        {
            consignment.Status = status;
            if (status == ConsignmentStatus.Sold) consignment.Car.Status = CarStatus.Sold;
        }

        await _db.SaveChangesAsync();
        return new ConsignmentResponse(consignment.Id, consignment.CarId, consignment.AgreedPrice, consignment.CommissionPercent, consignment.StartDate, consignment.EndDate, consignment.Status.ToString(), consignment.CreatedAt);
    }

    public async Task<List<ConsignmentResponse>> GetConsignmentsAsync(string? statusFilter = null)
    {
        var query = _db.Consignments.AsQueryable();
        if (statusFilter != null && Enum.TryParse<ConsignmentStatus>(statusFilter, true, out var status))
            query = query.Where(c => c.Status == status);

        var consignments = await query.OrderByDescending(c => c.CreatedAt).ToListAsync();
        return consignments.Select(c => new ConsignmentResponse(c.Id, c.CarId, c.AgreedPrice, c.CommissionPercent, c.StartDate, c.EndDate, c.Status.ToString(), c.CreatedAt)).ToList();
    }
}
