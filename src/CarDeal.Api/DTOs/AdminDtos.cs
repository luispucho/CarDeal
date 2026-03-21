namespace CarDeal.Api.DTOs;

public record DashboardStatsResponse(
    int TotalCars,
    int PendingCars,
    int ActiveOffers,
    int ActiveConsignments,
    int TotalUsers,
    List<CarResponse> RecentSubmissions
);
