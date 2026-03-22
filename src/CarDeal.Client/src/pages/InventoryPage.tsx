import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { publicApi, type PublicCar } from '../api/public';
import ListingRibbon from '../components/common/ListingRibbon';
import { getCurrentTenant, setCurrentTenant } from '../utils/tenantCookie';

const LISTING_TYPES = ['Consigned', 'Inventory', 'CertifiedInventory', 'TrustedPartner'] as const;
const MAX_COMPARE = 4;

const MIN_PRICE_OPTIONS = [0, 5000, 10000, 15000, 20000, 25000, 30000, 40000, 50000, 75000];
const MAX_PRICE_OPTIONS = [10000, 15000, 20000, 25000, 30000, 40000, 50000, 75000, 100000, 150000];

function FilterSection({ title, defaultOpen = true, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-100 pb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full text-sm font-semibold text-gray-800 py-2"
      >
        {title}
        <span className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`}>
          ▾
        </span>
      </button>
      {isOpen && <div className="mt-2 space-y-2">{children}</div>}
    </div>
  );
}

function CarCard({
  car,
  isSelected,
  onToggleCompare,
  disableCompare,
  viewerTenantId,
  tenantPrefix,
}: {
  car: PublicCar;
  isSelected: boolean;
  onToggleCompare: (car: PublicCar) => void;
  disableCompare: boolean;
  viewerTenantId?: number | null;
  tenantPrefix: string;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const primaryImage = car.images.find(i => i.isPrimary) ?? car.images[0];

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking the compare checkbox area
    const target = e.target as HTMLElement;
    if (target.closest('label')) return;
    navigate(`${tenantPrefix}/inventory/${car.id}`);
  };

  return (
    <div
      onClick={handleCardClick}
      className="relative bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 group cursor-pointer"
    >
      {/* Compare checkbox */}
      <label className="absolute top-3 left-3 z-10 flex items-center gap-1.5 bg-white/90 backdrop-blur rounded-full px-2.5 py-1 shadow-sm cursor-pointer"
        onClick={e => e.stopPropagation()}>
        <input
          type="checkbox"
          checked={isSelected}
          disabled={!isSelected && disableCompare}
          onChange={() => onToggleCompare(car)}
          className="w-4 h-4 rounded text-blue-600"
        />
        <span className="text-xs font-medium text-gray-600">{t('inventory.compare')}</span>
      </label>

      {/* Listing ribbon - top right */}
      <ListingRibbon listingType={car.listingType} tenantId={car.tenantId} viewerTenantId={viewerTenantId} />

      {/* Image */}
      <div className="aspect-[16/10] bg-gray-100 overflow-hidden">
        {primaryImage ? (
          <img
            src={primaryImage.blobUrl}
            alt={`${car.year} ${car.make} ${car.model}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl text-gray-300">🚗</div>
        )}
      </div>

      {/* Info */}
      <div className="p-5">
        <h3 className="font-bold text-gray-900 text-lg leading-tight">
          {car.year} {car.make} {car.model}
        </h3>
        {car.tenantName && <p className="text-xs text-gray-400 mt-1">{car.tenantName}</p>}

        {/* Specs row */}
        <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
          <span className="flex items-center gap-1">📏 {car.mileage.toLocaleString()} mi</span>
          <span className="flex items-center gap-1">📅 {car.year}</span>
          {car.condition && <span className="flex items-center gap-1">⭐ {car.condition}</span>}
        </div>

        {/* Price */}
        {car.askingPrice != null && (
          <p className="mt-4 text-2xl font-extrabold text-gray-900">${car.askingPrice.toLocaleString()}</p>
        )}
      </div>
    </div>
  );
}

export default function InventoryPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { tenantIdOrSlug } = useParams<{ tenantIdOrSlug?: string }>();

  // Resolve tenant from URL or cookie
  const urlTenantId = tenantIdOrSlug ? (isNaN(Number(tenantIdOrSlug)) ? undefined : Number(tenantIdOrSlug)) : undefined;

  // If we have a URL tenant param, resolve its numeric ID via branding
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

  const [make, setMake] = useState('');
  const [yearMin, setYearMin] = useState<string>('');
  const [yearMax, setYearMax] = useState<string>('');
  const [priceMin, setPriceMin] = useState<string>('');
  const [priceMax, setPriceMax] = useState<string>('');
  const [sort, setSort] = useState('');
  const [selectedListingTypes, setSelectedListingTypes] = useState<string[]>([]);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [selectedCars, setSelectedCars] = useState<PublicCar[]>([]);

  // Use the first checked listing type for the API (or undefined for all)
  const listingTypeParam = selectedListingTypes.length === 1 ? selectedListingTypes[0] : undefined;

  const { data: cars, isLoading } = useQuery({
    queryKey: ['publicCars', make, yearMin, yearMax, priceMin, priceMax, sort, listingTypeParam, viewerTenantId],
    queryFn: () =>
      publicApi.getCars({
        make: make || undefined,
        yearMin: yearMin ? Number(yearMin) : undefined,
        yearMax: yearMax ? Number(yearMax) : undefined,
        priceMin: priceMin ? Number(priceMin) : undefined,
        priceMax: priceMax ? Number(priceMax) : undefined,
        sort: sort || undefined,
        listingType: listingTypeParam,
        tenantId: viewerTenantId,
      }),
  });

  // Client-side filter for multiple listing types
  const filteredCars =
    selectedListingTypes.length > 1 && cars
      ? cars.filter(c => selectedListingTypes.includes(c.listingType))
      : cars;

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 30 }, (_, i) => currentYear - i);

  const toggleListingType = (lt: string) => {
    setSelectedListingTypes(prev =>
      prev.includes(lt) ? prev.filter(x => x !== lt) : [...prev, lt],
    );
  };

  const clearFilters = () => {
    setMake('');
    setYearMin('');
    setYearMax('');
    setPriceMin('');
    setPriceMax('');
    setSort('');
    setSelectedListingTypes([]);
  };

  const toggleCompare = useCallback((car: PublicCar) => {
    setSelectedCars(prev => {
      const exists = prev.find(c => c.id === car.id);
      if (exists) return prev.filter(c => c.id !== car.id);
      if (prev.length >= MAX_COMPARE) return prev;
      return [...prev, car];
    });
  }, []);

  const removeFromCompare = (id: number) => {
    setSelectedCars(prev => prev.filter(c => c.id !== id));
  };

  const openCompare = () => {
    const ids = selectedCars.map(c => c.id).join(',');
    navigate(`/compare?ids=${ids}`);
  };

  const sidebarContent = (
    <div className="space-y-1">
      {/* Search */}
      <FilterSection title={t('inventory.searchMake')} defaultOpen={true}>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          <input
            type="text"
            value={make}
            onChange={e => setMake(e.target.value)}
            placeholder={t('inventory.searchMake')}
            className="w-full border border-gray-200 rounded-lg pl-9 pr-4 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      </FilterSection>

      {/* Year */}
      <FilterSection title={t('inventory.year')}>
        <div className="flex gap-2">
          <select
            value={yearMin}
            onChange={e => setYearMin(e.target.value)}
            className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">{t('inventory.yearFrom')}</option>
            {yearOptions.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <select
            value={yearMax}
            onChange={e => setYearMax(e.target.value)}
            className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">{t('inventory.yearTo')}</option>
            {yearOptions.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </FilterSection>

      {/* Price Range */}
      <FilterSection title={t('inventory.price')}>
        <div className="flex gap-2">
          <select
            value={priceMin}
            onChange={e => setPriceMin(e.target.value)}
            className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">{t('inventory.priceFrom')}</option>
            {MIN_PRICE_OPTIONS.map(p => (
              <option key={p} value={p}>${p.toLocaleString()}</option>
            ))}
          </select>
          <select
            value={priceMax}
            onChange={e => setPriceMax(e.target.value)}
            className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">{t('inventory.priceTo')}</option>
            {MAX_PRICE_OPTIONS.map(p => (
              <option key={p} value={p}>${p.toLocaleString()}</option>
            ))}
            <option value="">{t('inventory.noMax')}</option>
          </select>
        </div>
      </FilterSection>

      {/* Listing Type checkboxes */}
      <FilterSection title={t('inventory.listingTypeFilter')}>
        {LISTING_TYPES.map(lt => (
          <label key={lt} className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedListingTypes.includes(lt)}
              onChange={() => toggleListingType(lt)}
              className="w-4 h-4 rounded text-blue-600 cursor-pointer"
            />
            <span className="text-sm text-gray-600 cursor-pointer">{t(`listingType.${lt}`)}</span>
          </label>
        ))}
      </FilterSection>

      {/* Sort By */}
      <FilterSection title={t('inventory.sortBy')}>
        <select
          value={sort}
          onChange={e => setSort(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="">{t('inventory.sortBy')}</option>
          <option value="newest">{t('inventory.newest')}</option>
          <option value="price_asc">{t('inventory.priceAsc')}</option>
          <option value="price_desc">{t('inventory.priceDesc')}</option>
          <option value="year_desc">{t('inventory.yearDesc')}</option>
          <option value="mileage_asc">{t('inventory.mileageAsc')}</option>
        </select>
      </FilterSection>

      {/* Clear Filters */}
      <button
        onClick={clearFilters}
        className="w-full text-sm text-blue-600 hover:text-blue-800 font-medium transition pt-2"
      >
        {t('inventory.clearFilters')}
      </button>
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900">{t('inventory.title')}</h1>
        <p className="text-gray-500 text-lg mt-2">{t('inventory.subtitle')}</p>
      </div>

      {/* Mobile filter toggle */}
      <div className="lg:hidden mb-4">
        <button
          onClick={() => setShowMobileFilters(!showMobileFilters)}
          className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 shadow-sm"
        >
          <span>☰</span>
          {t('inventory.filters')}
        </button>
      </div>

      {/* Mobile filter overlay */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowMobileFilters(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-80 bg-white shadow-xl p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900">{t('inventory.filters')}</h2>
              <button onClick={() => setShowMobileFilters(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Two-column layout */}
      <div className="flex gap-8">
        {/* Sidebar - desktop */}
        <aside className="hidden lg:block w-[280px] flex-shrink-0">
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-5 sticky top-8">
            {sidebarContent}
          </div>
        </aside>

        {/* Car grid */}
        <div className="flex-1 min-w-0">
          {/* Results count */}
          {filteredCars && (
            <p className="text-sm text-gray-500 mb-4">
              {t('inventory.vehiclesFound', { count: filteredCars.length })}
            </p>
          )}

          {isLoading ? (
            <div className="text-center py-12 text-gray-500">{t('common.loading')}</div>
          ) : filteredCars && filteredCars.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredCars.map(car => (
                <CarCard
                  key={car.id}
                  car={car}
                  isSelected={!!selectedCars.find(c => c.id === car.id)}
                  onToggleCompare={toggleCompare}
                  disableCompare={selectedCars.length >= MAX_COMPARE}
                  viewerTenantId={viewerTenantId}
                  tenantPrefix={tenantPrefix}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <span className="text-6xl block mb-4">🔍</span>
              <p className="text-gray-500 text-lg">{t('inventory.noCarsFound')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Compare bar - sticky bottom */}
      {selectedCars.length >= 2 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-2xl z-40 px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-x-auto">
              {selectedCars.map(car => {
                const img = car.images.find(i => i.isPrimary) ?? car.images[0];
                return (
                  <div key={car.id} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 flex-shrink-0">
                    {img ? (
                      <img src={img.blobUrl} alt="" className="w-10 h-10 rounded object-cover" />
                    ) : (
                      <span className="w-10 h-10 rounded bg-gray-200 flex items-center justify-center text-lg">🚗</span>
                    )}
                    <span className="text-sm font-medium text-gray-700 whitespace-nowrap">{car.year} {car.make}</span>
                    <button onClick={() => removeFromCompare(car.id)} className="text-gray-400 hover:text-red-500 ml-1">✕</button>
                  </div>
                );
              })}
            </div>
            <button
              onClick={openCompare}
              className="bg-blue-600 text-white px-6 py-2.5 rounded-xl hover:bg-blue-700 transition font-semibold flex items-center gap-2 flex-shrink-0"
            >
              🔄 {t('inventory.compareSelected', { count: selectedCars.length })}
            </button>
          </div>
        </div>
      )}

      {/* Bottom padding when compare bar is visible */}
      {selectedCars.length >= 2 && <div className="h-24" />}
    </div>
  );
}
