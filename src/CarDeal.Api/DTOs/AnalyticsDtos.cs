namespace CarDeal.Api.DTOs;

public record TrackPageViewRequest(
    string Page,
    int? CarId,
    int? TenantId,
    string? City,
    string? Country,
    double? Latitude,
    double? Longitude,
    string SessionId,
    int? DurationSeconds
);

public record VisitorInsightsResponse(
    int TotalVisits,
    int UniqueVisitors,
    double AvgDurationSeconds,
    List<LocationStat> TopLocations,
    List<PageStat> PageViews,
    List<CarViewStat> TopViewedCars,
    List<DailyVisitStat> DailyVisits
);

public record LocationStat(string Country, string? City, int Visits);
public record PageStat(string Page, int Visits, double AvgDurationSeconds);
public record CarViewStat(int CarId, string Make, string Model, int Year, int Views);
public record DailyVisitStat(string Date, int Visits);
