import { useEffect, useRef } from 'react';
import { analyticsApi } from '../api/analytics';

let _sessionId: string | null = null;
function getSessionId(): string {
  if (!_sessionId) {
    _sessionId = sessionStorage.getItem('analytics_sid');
    if (!_sessionId) {
      _sessionId = crypto.randomUUID();
      sessionStorage.setItem('analytics_sid', _sessionId);
    }
  }
  return _sessionId;
}

interface GeoCache {
  city?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
}

let _geoCache: GeoCache | null | undefined = undefined;

async function getLocation(): Promise<GeoCache | null> {
  if (_geoCache !== undefined) return _geoCache;

  // Try browser geolocation first
  try {
    const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000, maximumAge: 300000 });
    });
    _geoCache = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
    return _geoCache;
  } catch {
    // Browser location denied or unavailable — backend will use IP fallback
    _geoCache = null;
    return null;
  }
}

/**
 * Tracks a page view and time spent on page.
 * Call from any public page component.
 */
export function usePageTracking(page: string, options?: { carId?: number; tenantId?: number }) {
  const startTime = useRef(Date.now());
  const tracked = useRef(false);

  useEffect(() => {
    startTime.current = Date.now();
    tracked.current = false;

    const sessionId = getSessionId();

    // Fire page view asynchronously
    (async () => {
      const geo = await getLocation();
      analyticsApi.trackPageView({
        page,
        carId: options?.carId,
        tenantId: options?.tenantId,
        sessionId,
        city: geo?.city,
        country: geo?.country,
        latitude: geo?.latitude,
        longitude: geo?.longitude,
      });
    })();

    // Send duration on page leave
    const sendDuration = () => {
      if (tracked.current) return;
      tracked.current = true;
      const duration = Math.round((Date.now() - startTime.current) / 1000);
      if (duration > 0) {
        analyticsApi.updateDuration({ sessionId, page, durationSeconds: duration });
      }
    };

    window.addEventListener('beforeunload', sendDuration);
    return () => {
      sendDuration();
      window.removeEventListener('beforeunload', sendDuration);
    };
  }, [page, options?.carId, options?.tenantId]);
}
