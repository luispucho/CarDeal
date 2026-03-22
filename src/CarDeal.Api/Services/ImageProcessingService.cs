using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Jpeg;
using SixLabors.ImageSharp.Formats.Png;
using SixLabors.ImageSharp.Formats.Webp;
using SixLabors.ImageSharp.Processing;

namespace CarDeal.Api.Services;

public interface IImageProcessingService
{
    /// <summary>
    /// Optimizes an image for web: resizes if too large and compresses to JPEG.
    /// Returns the processed stream, updated filename, and content type.
    /// </summary>
    Task<(Stream stream, string fileName, string contentType)> OptimizeAsync(
        Stream input, string fileName, string contentType, int maxWidth = 1920, int maxHeight = 1080);
}

public class ImageProcessingService : IImageProcessingService
{
    private static readonly HashSet<string> SupportedTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "image/jpeg", "image/png", "image/webp", "image/gif", "image/bmp"
    };

    public async Task<(Stream stream, string fileName, string contentType)> OptimizeAsync(
        Stream input, string fileName, string contentType, int maxWidth = 1920, int maxHeight = 1080)
    {
        if (!SupportedTypes.Contains(contentType))
            return (input, fileName, contentType);

        using var image = await Image.LoadAsync(input);

        // Resize if either dimension exceeds the max
        if (image.Width > maxWidth || image.Height > maxHeight)
        {
            image.Mutate(x => x.Resize(new ResizeOptions
            {
                Mode = ResizeMode.Max,
                Size = new Size(maxWidth, maxHeight)
            }));
        }

        // Encode as JPEG at 80% quality — great balance of size and visual quality
        var output = new MemoryStream();
        await image.SaveAsJpegAsync(output, new JpegEncoder { Quality = 80 });
        output.Position = 0;

        var optimizedFileName = Path.GetFileNameWithoutExtension(fileName) + ".jpg";
        return (output, optimizedFileName, "image/jpeg");
    }
}
