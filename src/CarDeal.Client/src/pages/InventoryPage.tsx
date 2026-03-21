import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { publicApi, type PublicCar } from '../api/public';
import ListingRibbon from '../components/common/ListingRibbon';

function CarCard({ car }: { car: PublicCar }) {
  const { t } = useTranslation();
  const primaryImage = car.images.find(i => i.isPrimary) ?? car.images[0];

  return (
    <Link
      to={`/inventory/${car.id}`}
      className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-200 group"
    >
      <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
        <ListingRibbon listingType={car.listingType} />
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
        {car.tenantName && (
          <p className="text-xs text-gray-400 mt-0.5">{car.tenantName}</p>
        )}
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
}

export default function InventoryPage() {
  const { t } = useTranslation();
  const [make, setMake] = useState('');
  const [yearMin, setYearMin] = useState<string>('');
  const [yearMax, setYearMax] = useState<string>('');
  const [priceMin, setPriceMin] = useState<string>('');
  const [priceMax, setPriceMax] = useState<string>('');
  const [sort, setSort] = useState('');
  const [listingType, setListingType] = useState('');

  const { data: cars, isLoading } = useQuery({
    queryKey: ['publicCars', make, yearMin, yearMax, priceMin, priceMax, sort, listingType],
    queryFn: () =>
      publicApi.getCars({
        make: make || undefined,
        yearMin: yearMin ? Number(yearMin) : undefined,
        yearMax: yearMax ? Number(yearMax) : undefined,
        priceMin: priceMin ? Number(priceMin) : undefined,
        priceMax: priceMax ? Number(priceMax) : undefined,
        sort: sort || undefined,
        listingType: listingType || undefined,
      }),
  });

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 30 }, (_, i) => currentYear - i);

  return (
    <div>
      <div className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900">{t('inventory.title')}</h1>
        <p className="text-gray-500 text-lg mt-2">{t('inventory.subtitle')}</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          <input
            type="text"
            value={make}
            onChange={e => setMake(e.target.value)}
            placeholder={t('inventory.searchMake')}
            className="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <select
            value={yearMin}
            onChange={e => setYearMin(e.target.value)}
            className="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">{t('inventory.allYears')}</option>
            {yearOptions.map(y => (
              <option key={y} value={y}>{y}+</option>
            ))}
          </select>
          <select
            value={priceMin}
            onChange={e => setPriceMin(e.target.value)}
            className="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">{t('inventory.allPrices')}</option>
            <option value="5000">$5,000+</option>
            <option value="10000">$10,000+</option>
            <option value="20000">$20,000+</option>
            <option value="30000">$30,000+</option>
            <option value="50000">$50,000+</option>
          </select>
          <select
            value={priceMax}
            onChange={e => setPriceMax(e.target.value)}
            className="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">{t('inventory.allPrices')}</option>
            <option value="10000">&lt; $10,000</option>
            <option value="20000">&lt; $20,000</option>
            <option value="30000">&lt; $30,000</option>
            <option value="50000">&lt; $50,000</option>
            <option value="100000">&lt; $100,000</option>
          </select>
          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            className="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">{t('inventory.sortBy')}</option>
            <option value="newest">{t('inventory.newest')}</option>
            <option value="price_asc">{t('inventory.priceAsc')}</option>
            <option value="price_desc">{t('inventory.priceDesc')}</option>
            <option value="year_desc">{t('inventory.yearDesc')}</option>
            <option value="mileage_asc">{t('inventory.mileageAsc')}</option>
          </select>
          <select
            value={yearMax}
            onChange={e => setYearMax(e.target.value)}
            className="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">{t('inventory.allYears')}</option>
            {yearOptions.map(y => (
              <option key={y} value={y}>≤ {y}</option>
            ))}
          </select>
          <select
            value={listingType}
            onChange={e => setListingType(e.target.value)}
            className="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">{t('inventory.allTypes')}</option>
            <option value="Consigned">{t('listingType.Consigned')}</option>
            <option value="Inventory">{t('listingType.Inventory')}</option>
            <option value="CertifiedInventory">{t('listingType.CertifiedInventory')}</option>
            <option value="TrustedPartner">{t('listingType.TrustedPartner')}</option>
          </select>
        </div>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-500">{t('common.loading')}</div>
      ) : cars && cars.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {cars.map(car => (
            <CarCard key={car.id} car={car} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <span className="text-6xl block mb-4">🔍</span>
          <p className="text-gray-500 text-lg">{t('inventory.noCarsFound')}</p>
        </div>
      )}
    </div>
  );
}
