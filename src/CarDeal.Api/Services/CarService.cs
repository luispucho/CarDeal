using Microsoft.EntityFrameworkCore;
using CarDeal.Api.Data;
using CarDeal.Api.DTOs;
using CarDeal.Api.Models;

namespace CarDeal.Api.Services;

public interface ICarService
{
    Task<CarResponse> CreateAsync(string userId, CreateCarRequest request);
    Task<CarResponse?> GetByIdAsync(int id, string? userId = null, int? tenantId = null);
    Task<List<CarResponse>> GetByUserAsync(string userId, int? tenantId = null);
    Task<List<CarResponse>> GetAllAsync(string? statusFilter = null);
    Task<CarResponse?> UpdateAsync(int id, string userId, UpdateCarRequest request, int? tenantId = null);
    Task<bool> DeleteAsync(int id, string userId, int? tenantId = null);
    Task<CarImageResponse> AddImageAsync(int carId, string userId, Stream stream, string fileName, string contentType, int? tenantId = null);
    Task<bool> RemoveImageAsync(int carId, int imageId, string userId, int? tenantId = null);
    Task SetFeaturedAsync(int carId, bool isFeatured);
}

public class CarService : ICarService
{
    private readonly AppDbContext _db;
    private readonly IBlobStorageService _blobService;

    public CarService(AppDbContext db, IBlobStorageService blobService)
    {
        _db = db;
        _blobService = blobService;
    }

    public async Task<CarResponse> CreateAsync(string userId, CreateCarRequest request)
    {
        var car = new Car
        {
            UserId = userId,
            Make = request.Make,
            Model = request.Model,
            Year = request.Year,
            Mileage = request.Mileage,
            VIN = request.VIN,
            Color = request.Color,
            Condition = request.Condition,
            Description = request.Description,
            AskingPrice = request.AskingPrice
        };
        var userEntity = await _db.Users.FindAsync(userId);
        if (userEntity?.TenantId != null)
            car.TenantId = userEntity.TenantId;

        _db.Cars.Add(car);
        await _db.SaveChangesAsync();
        return await GetByIdAsync(car.Id) ?? throw new InvalidOperationException("Failed to create car");
    }

    public async Task<CarResponse?> GetByIdAsync(int id, string? userId = null, int? tenantId = null)
    {
        var query = _db.Cars
            .Include(c => c.User)
            .Include(c => c.Tenant)
            .Include(c => c.Images)
            .Include(c => c.Offers).ThenInclude(o => o.AdminUser)
            .AsQueryable();

        if (tenantId != null)
            query = query.Where(c => c.TenantId == tenantId);
        else if (userId != null)
            query = query.Where(c => c.UserId == userId);

        var car = await query.FirstOrDefaultAsync(c => c.Id == id);
        return car == null ? null : MapToResponse(car);
    }

    public async Task<List<CarResponse>> GetByUserAsync(string userId, int? tenantId = null)
    {
        var query = _db.Cars
            .Include(c => c.User)
            .Include(c => c.Tenant)
            .Include(c => c.Images)
            .Include(c => c.Offers).ThenInclude(o => o.AdminUser)
            .AsQueryable();

        if (tenantId != null)
            query = query.Where(c => c.TenantId == tenantId);
        else
            query = query.Where(c => c.UserId == userId);

        var cars = await query.OrderByDescending(c => c.CreatedAt).ToListAsync();
        return cars.Select(MapToResponse).ToList();
    }

    public async Task<List<CarResponse>> GetAllAsync(string? statusFilter = null)
    {
        var query = _db.Cars
            .Include(c => c.User)
            .Include(c => c.Tenant)
            .Include(c => c.Images)
            .Include(c => c.Offers).ThenInclude(o => o.AdminUser)
            .AsQueryable();

        if (statusFilter != null && Enum.TryParse<CarStatus>(statusFilter, true, out var status))
            query = query.Where(c => c.Status == status);

        var cars = await query.OrderByDescending(c => c.CreatedAt).ToListAsync();
        return cars.Select(MapToResponse).ToList();
    }

    public async Task<CarResponse?> UpdateAsync(int id, string userId, UpdateCarRequest request, int? tenantId = null)
    {
        Car? car;
        if (tenantId != null)
            car = await _db.Cars.FirstOrDefaultAsync(c => c.Id == id && c.TenantId == tenantId);
        else
            car = await _db.Cars.FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);
        if (car == null) return null;

        if (request.Make != null) car.Make = request.Make;
        if (request.Model != null) car.Model = request.Model;
        if (request.Year.HasValue) car.Year = request.Year.Value;
        if (request.Mileage.HasValue) car.Mileage = request.Mileage.Value;
        if (request.VIN != null) car.VIN = request.VIN;
        if (request.Color != null) car.Color = request.Color;
        if (request.Condition != null) car.Condition = request.Condition;
        if (request.Description != null) car.Description = request.Description;
        if (request.AskingPrice.HasValue) car.AskingPrice = request.AskingPrice.Value;
        car.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return await GetByIdAsync(car.Id);
    }

    public async Task<bool> DeleteAsync(int id, string userId, int? tenantId = null)
    {
        Car? car;
        if (tenantId != null)
            car = await _db.Cars.Include(c => c.Images).FirstOrDefaultAsync(c => c.Id == id && c.TenantId == tenantId);
        else
            car = await _db.Cars.Include(c => c.Images).FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);
        if (car == null) return false;

        foreach (var img in car.Images)
            await _blobService.DeleteAsync(img.BlobUrl);

        _db.Cars.Remove(car);
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<CarImageResponse> AddImageAsync(int carId, string userId, Stream stream, string fileName, string contentType, int? tenantId = null)
    {
        Car? car;
        if (tenantId != null)
            car = await _db.Cars.Include(c => c.Images).FirstOrDefaultAsync(c => c.Id == carId && c.TenantId == tenantId);
        else
            car = await _db.Cars.Include(c => c.Images).FirstOrDefaultAsync(c => c.Id == carId && c.UserId == userId);
        if (car == null) throw new KeyNotFoundException("Car not found");

        if (car.Images.Count >= 10)
            throw new InvalidOperationException("Maximum 10 images per car");

        var blobUrl = await _blobService.UploadAsync(stream, fileName, contentType);
        var image = new CarImage
        {
            CarId = carId,
            BlobUrl = blobUrl,
            FileName = fileName,
            IsPrimary = !car.Images.Any()
        };
        _db.CarImages.Add(image);
        await _db.SaveChangesAsync();

        return new CarImageResponse(image.Id, image.BlobUrl, image.FileName, image.IsPrimary, image.UploadedAt);
    }

    public async Task<bool> RemoveImageAsync(int carId, int imageId, string userId, int? tenantId = null)
    {
        IQueryable<CarImage> query = _db.CarImages.Include(i => i.Car);
        if (tenantId != null)
            query = query.Where(i => i.Id == imageId && i.CarId == carId && i.Car.TenantId == tenantId);
        else
            query = query.Where(i => i.Id == imageId && i.CarId == carId && i.Car.UserId == userId);

        var image = await query.FirstOrDefaultAsync();
        if (image == null) return false;

        await _blobService.DeleteAsync(image.BlobUrl);
        _db.CarImages.Remove(image);
        await _db.SaveChangesAsync();
        return true;
    }

    private static CarResponse MapToResponse(Car car) => new(
        car.Id, car.UserId, car.User.FullName,
        car.Make, car.Model, car.Year, car.Mileage,
        car.VIN, car.Color, car.Condition, car.Description, car.AskingPrice,
        car.IsFeatured,
        car.Status.ToString(), car.CreatedAt, car.UpdatedAt,
        car.TenantId, car.Tenant?.Name,
        car.Images.Select(i => new CarImageResponse(i.Id, i.BlobUrl, i.FileName, i.IsPrimary, i.UploadedAt)).ToList(),
        car.Offers.Select(o => new OfferResponse(o.Id, o.CarId, o.AdminUserId, o.AdminUser.FullName, o.Amount, o.Notes, o.Status.ToString(), o.CreatedAt, o.UpdatedAt)).ToList()
    );

    public async Task SetFeaturedAsync(int carId, bool isFeatured)
    {
        var car = await _db.Cars.FindAsync(carId);
        if (car == null) throw new KeyNotFoundException("Car not found");
        car.IsFeatured = isFeatured;
        car.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
    }
}
