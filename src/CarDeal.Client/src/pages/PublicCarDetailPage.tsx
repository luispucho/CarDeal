import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { publicApi } from '../api/public';
import ListingRibbon from '../components/common/ListingRibbon';
import { getCurrentTenant, setCurrentTenant } from '../utils/tenantCookie';

export default function PublicCarDetailPage() {
  const { t } = useTranslation();
  const { id, tenantIdOrSlug } = useParams<{ id: string; tenantIdOrSlug?: string }>();
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Resolve tenant from URL or cookie
  const urlTenantId = tenantIdOrSlug ? (isNaN(Number(tenantIdOrSlug)) ? undefined : Number(tenantIdOrSlug)) : undefined;

  const { data: brandingData } = useQuery({
    queryKey: ['tenantBranding', tenantIdOrSlug],
    queryFn: () => publicApi.getBranding(tenantIdOrSlug!),
    enabled: !!tenantIdOrSlug && !urlTenantId,
    retry: false,
  });

  const resolvedTenantId = urlTenantId ?? brandingData?.tenantId ?? undefined;
  const viewerTenantId = resolvedTenantId ?? getCurrentTenant() ?? undefined;

  useEffect(() => {
    if (resolvedTenantId) setCurrentTenant(resolvedTenantId);
  }, [resolvedTenantId]);

  const tenantPrefix = tenantIdOrSlug ? `/${tenantIdOrSlug}` : '';
  const backLink = `${tenantPrefix}/inventory`;

  const { data: car, isLoading } = useQuery({
    queryKey: ['publicCar', id],
    queryFn: () => publicApi.getCarById(Number(id)),
    enabled: !!id,
  });

  useEffect(() => {
    if (lightboxIndex === null || !car) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxIndex(null);
      if (e.key === 'ArrowRight') setLightboxIndex(prev => prev !== null ? (prev + 1) % car.images.length : null);
      if (e.key === 'ArrowLeft') setLightboxIndex(prev => prev !== null ? (prev - 1 + car.images.length) % car.images.length : null);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [lightboxIndex, car]);

  if (isLoading) return <div className="text-center py-12 text-gray-500">{t('common.loading')}</div>;
  if (!car) return <div className="text-center py-12 text-red-500">{t('cars.carNotFound')}</div>;

  const primaryImage = car.images.find(i => i.isPrimary) ?? car.images[0];

  return (
    <div className="max-w-5xl mx-auto">
      <Link to={backLink} className="text-blue-600 hover:underline text-sm mb-4 inline-block">
        ← {t('inventory.title')}
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Image Section */}
        <div>
          {/* Main Image */}
          <div
            className="relative aspect-[4/3] bg-gray-100 rounded-xl overflow-hidden cursor-pointer"
            onClick={() => car.images.length > 0 && setLightboxIndex(car.images.indexOf(primaryImage!))}
          >
            <ListingRibbon listingType={car.listingType} tenantId={car.tenantId} viewerTenantId={viewerTenantId} />
            {primaryImage ? (
              <img
                src={primaryImage.blobUrl}
                alt={`${car.year} ${car.make} ${car.model}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-8xl text-gray-300">🚗</div>
            )}
          </div>

          {/* Thumbnails */}
          {car.images.length > 1 && (
            <div className="flex gap-2 mt-3 overflow-x-auto">
              {car.images.map((img, idx) => (
                <img
                  key={img.id}
                  src={img.blobUrl}
                  alt={img.fileName}
                  className={`h-16 w-20 object-cover rounded-lg cursor-pointer transition ${
                    img.id === primaryImage?.id ? 'ring-2 ring-blue-500' : 'opacity-70 hover:opacity-100'
                  }`}
                  onClick={() => setLightboxIndex(idx)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Details Section */}
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
            {car.year} {car.make} {car.model}
          </h1>

          {car.tenantName && (
            <p className="text-sm text-gray-500 mb-2">{t('tenants.soldBy')}: {car.tenantName}</p>
          )}

          {car.askingPrice != null && (
            <p className="text-3xl font-bold text-green-600 mb-6">${car.askingPrice.toLocaleString()}</p>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-gray-500">{t('cars.make')}:</span> <span className="font-medium">{car.make}</span></div>
              <div><span className="text-gray-500">{t('cars.model')}:</span> <span className="font-medium">{car.model}</span></div>
              <div><span className="text-gray-500">{t('cars.year')}:</span> <span className="font-medium">{car.year}</span></div>
              <div><span className="text-gray-500">{t('cars.mileage')}:</span> <span className="font-medium">{car.mileage.toLocaleString()} {t('common.mi')}</span></div>
              {car.color && <div><span className="text-gray-500">{t('cars.color')}:</span> <span className="font-medium">{car.color}</span></div>}
              {car.condition && <div><span className="text-gray-500">{t('cars.condition')}:</span> <span className="font-medium">{car.condition}</span></div>}
            </div>
            {car.description && (
              <p className="mt-4 text-gray-700 border-t pt-4">{car.description}</p>
            )}
          </div>

          {/* CTA */}
          <div className="bg-blue-50 rounded-xl p-6 text-center">
            <h3 className="text-lg font-bold text-gray-900 mb-2">{t('inventory.interested')}</h3>
            <Link
              to="/register"
              className="inline-flex items-center justify-center bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all duration-200 shadow-lg hover:-translate-y-0.5"
            >
              {t('inventory.registerCta')}
            </Link>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && car.images.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center" onClick={() => setLightboxIndex(null)}>
          <button className="absolute top-4 right-4 text-white text-3xl hover:text-gray-300 z-10" onClick={() => setLightboxIndex(null)}>✕</button>

          <div className="flex-1 flex items-center justify-center w-full px-16 py-4" onClick={e => e.stopPropagation()}>
            {car.images.length > 1 && (
              <button
                className="absolute left-4 text-white text-4xl hover:text-gray-300 select-none"
                onClick={e => { e.stopPropagation(); setLightboxIndex((lightboxIndex - 1 + car.images.length) % car.images.length); }}
              >
                ‹
              </button>
            )}

            <img
              src={car.images[lightboxIndex].blobUrl}
              alt={car.images[lightboxIndex].fileName}
              className="max-h-[70vh] max-w-full object-contain rounded-lg"
            />

            {car.images.length > 1 && (
              <button
                className="absolute right-4 text-white text-4xl hover:text-gray-300 select-none"
                onClick={e => { e.stopPropagation(); setLightboxIndex((lightboxIndex + 1) % car.images.length); }}
              >
                ›
              </button>
            )}
          </div>

          <p className="text-white text-sm mb-2">{lightboxIndex + 1} / {car.images.length}</p>

          <div className="flex gap-2 pb-4 px-4 overflow-x-auto" onClick={e => e.stopPropagation()}>
            {car.images.map((img, idx) => (
              <img
                key={img.id}
                src={img.blobUrl}
                alt={img.fileName}
                className={`h-16 w-20 object-cover rounded cursor-pointer transition ${idx === lightboxIndex ? 'ring-2 ring-white opacity-100' : 'opacity-50 hover:opacity-80'}`}
                onClick={() => setLightboxIndex(idx)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
