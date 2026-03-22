import apiClient from './client';

export interface VisitorInsights {
  totalVisits: number;
  uniqueVisitors: number;
  avgDurationSeconds: number;
  topLocations: { country: string; city?: string; visits: number }[];
  pageViews: { page: string; visits: number; avgDurationSeconds: number }[];
  topViewedCars: { carId: number; make: string; model: string; year: number; views: number }[];
  dailyVisits: { date: string; visits: number }[];
}

export const analyticsApi = {
  trackPageView: (data: {
    page: string;
    carId?: number;
    tenantId?: number;
    city?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
    sessionId: string;
    durationSeconds?: number;
  }) => apiClient.post('/analytics/pageview', data).catch(() => {}),

  updateDuration: (data: { sessionId: string; page: string; durationSeconds: number }) =>
    apiClient.patch('/analytics/pageview/duration', data).catch(() => {}),

  getStats: (tenantId?: number) =>
    apiClient.get<VisitorInsights>('/analytics/stats', { params: tenantId ? { tenantId } : {} }).then(r => r.data),
};
