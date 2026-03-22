using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;

namespace CarDeal.Api.Services;

public interface IBlobStorageService
{
    Task<string> UploadAsync(Stream stream, string fileName, string contentType);
    Task DeleteAsync(string blobUrl);
}

public class BlobStorageService : IBlobStorageService
{
    private readonly BlobContainerClient _container;
    private readonly IImageProcessingService _imageProcessor;

    public BlobStorageService(IConfiguration configuration, IImageProcessingService imageProcessor)
    {
        var connectionString = configuration["Azure:BlobStorage:ConnectionString"]
            ?? throw new InvalidOperationException("Blob storage connection string not configured");
        var containerName = configuration["Azure:BlobStorage:ContainerName"] ?? "car-images";
        _container = new BlobContainerClient(connectionString, containerName);
        _container.CreateIfNotExists(PublicAccessType.Blob);
        _imageProcessor = imageProcessor;
    }

    public async Task<string> UploadAsync(Stream stream, string fileName, string contentType)
    {
        if (contentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase))
        {
            var (optimized, newFileName, newContentType) = await _imageProcessor.OptimizeAsync(stream, fileName, contentType);
            stream = optimized;
            fileName = newFileName;
            contentType = newContentType;
        }

        var blobName = $"{Guid.NewGuid()}/{fileName}";
        var blob = _container.GetBlobClient(blobName);
        await blob.UploadAsync(stream, new BlobHttpHeaders { ContentType = contentType });
        return blob.Uri.ToString();
    }

    public async Task DeleteAsync(string blobUrl)
    {
        var uri = new Uri(blobUrl);
        var blobName = string.Join("/", uri.Segments.Skip(2)).TrimStart('/');
        var blob = _container.GetBlobClient(blobName);
        await blob.DeleteIfExistsAsync();
    }
}

/// <summary>
/// Local file system storage for development when Azurite is not available.
/// Stores images under wwwroot/uploads/car-images.
/// </summary>
public class LocalBlobStorageService : IBlobStorageService
{
    private readonly string _basePath;
    private readonly string _baseUrl;
    private readonly IImageProcessingService _imageProcessor;

    public LocalBlobStorageService(IWebHostEnvironment env, IConfiguration configuration, IImageProcessingService imageProcessor)
    {
        _basePath = Path.Combine(env.ContentRootPath, "wwwroot", "uploads", "car-images");
        Directory.CreateDirectory(_basePath);
        _baseUrl = "/uploads/car-images";
        _imageProcessor = imageProcessor;
    }

    public async Task<string> UploadAsync(Stream stream, string fileName, string contentType)
    {
        if (contentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase))
        {
            var (optimized, newFileName, newContentType) = await _imageProcessor.OptimizeAsync(stream, fileName, contentType);
            stream = optimized;
            fileName = newFileName;
            contentType = newContentType;
        }

        var folder = Guid.NewGuid().ToString();
        var dirPath = Path.Combine(_basePath, folder);
        Directory.CreateDirectory(dirPath);
        var filePath = Path.Combine(dirPath, fileName);
        using var fs = File.Create(filePath);
        await stream.CopyToAsync(fs);
        return $"{_baseUrl}/{folder}/{fileName}";
    }

    public Task DeleteAsync(string blobUrl)
    {
        var relativePath = blobUrl.Replace(_baseUrl + "/", "");
        var filePath = Path.Combine(_basePath, relativePath.Replace("/", Path.DirectorySeparatorChar.ToString()));
        if (File.Exists(filePath))
            File.Delete(filePath);
        return Task.CompletedTask;
    }
}
