import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { publicApi, type PublicCar } from '../api/public';
import { setCurrentTenant } from '../utils/tenantCookie';
import { usePageTracking } from '../hooks/usePageTracking';
import ListingRibbon from '../components/common/ListingRibbon';
import NotFoundPage from './NotFoundPage';

export default function TenantLandingPage() {
  const { t } = useTranslation();
  const { tenantIdOrSlug } = useParams<{ tenantIdOrSlug: string }>();
  const [notFound, setNotFound] = useState(false);

  const slug = tenantIdOrSlug ?? '';

  const { data: branding, isLoading: brandingLoading, isError } = useQuery({
    queryKey: ['tenantBranding', slug],
    queryFn: () => publicApi.getBranding(slug),
    enabled: !!slug,
    retry: false,
  });

  const tenantId = branding?.tenantId;
  usePageTracking('/tenant-landing', { tenantId });

  const { data: cars } = useQuery({
    queryKey: ['tenantCars', tenantId],
    queryFn: () => publicApi.getCars({ tenantId: tenantId!, sort: 'newest' }),
    enabled: !!tenantId,
  });

  useEffect(() => {
    if (isError) setNotFound(true);
  }, [isError]);

  useEffect(() => {
    if (tenantId) setCurrentTenant(tenantId);
  }, [tenantId]);

  if (notFound) return <NotFoundPage />;
  if (brandingLoading) return <div className="text-center py-20 text-gray-500">{t('common.loading')}</div>;
  if (!branding) return <NotFoundPage />;

  const primaryColor = branding.primaryColor || '#4f46e5';
  const featured = cars?.slice(0, 6) ?? [];

  return (
    <div className="-mx-4 sm:-mx-6 lg:-mx-8 -mt-8">
      {/* Hero */}
      <section
        className="relative overflow-hidden py-24 md:py-32"
        style={{ background: `linear-gradient(135deg, ${primaryColor}, ${branding.secondaryColor || '#1e1b4b'})` }}
      >
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {branding.logoUrl && (
            <img src={branding.logoUrl} alt={branding.tenantName} className="w-24 h-24 rounded-2xl mx-auto mb-6 object-cover shadow-lg" />
          )}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-4">
            {branding.tenantName}
          </h1>
          {branding.tagline && (
            <p className="text-xl text-white/80 max-w-2xl mx-auto mb-10">{branding.tagline}</p>
          )}
          <Link
            to={`/${slug}/inventory`}
            className="inline-flex items-center justify-center bg-white px-8 py-4 rounded-xl text-lg font-bold shadow-lg hover:-translate-y-0.5 transition-all duration-200"
            style={{ color: primaryColor }}
          >
            {t('home.viewInventory')}
          </Link>
          <Link
            to={`/${slug}/sell`}
            className="inline-flex items-center justify-center border-2 border-white text-white px-8 py-4 rounded-xl text-lg font-bold shadow-lg hover:bg-white/10 hover:-translate-y-0.5 transition-all duration-200 ml-4"
          >
            {t('consignment.sellYourCar')}
          </Link>
        </div>
      </section>

      {/* Featured Cars */}
      {featured.length > 0 && (
        <section className="bg-white py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3">
                {t('home.featuredTitle')}
              </h2>
              <p className="text-gray-500 text-lg">{t('home.featuredSubtitle')}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featured.map((car: PublicCar) => {
                const primaryImage = car.images.find(i => i.isPrimary) ?? car.images[0];
                return (
                  <Link
                    key={car.id}
                    to={`/${slug}/inventory/${car.id}`}
                    className="bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-200 group"
                  >
                    <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
                      <ListingRibbon listingType={car.listingType} tenantId={car.tenantId} viewerTenantId={tenantId} />
                      {primaryImage ? (
                        <img
                          src={primaryImage.blobUrl}
                          alt={`${car.year} ${car.make} ${car.model}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-6xl text-gray-300">🚗</div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-gray-900 text-lg">
                        {car.year} {car.make} {car.model}
                      </h3>
                      <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                        <span>{car.mileage.toLocaleString()} {t('common.mi')}</span>
                        {car.condition && (
                          <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium">
                            {car.condition}
                          </span>
                        )}
                      </div>
                      {car.askingPrice != null && (
                        <p className="mt-3 text-xl font-bold text-green-600">${car.askingPrice.toLocaleString()}</p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
            <div className="text-center mt-10">
              <Link
                to={`/${slug}/inventory`}
                className="inline-flex items-center justify-center text-white px-8 py-3 rounded-xl font-bold hover:opacity-90 transition-all duration-200 shadow-lg hover:-translate-y-0.5"
                style={{ backgroundColor: primaryColor }}
              >
                {t('home.viewInventory')}
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Contact / CTA */}
      {branding.contactEmail && (
        <section className="bg-gray-50 py-16">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('crm.contactSection')}</h2>
            <p className="text-gray-600 mb-2">{branding.contactEmail}</p>
          </div>
        </section>
      )}
    </div>
  );
}
