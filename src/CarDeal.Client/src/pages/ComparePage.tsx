import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { publicApi, type PublicCar } from '../api/public';

const MAX_COMPARE = 4;

interface SpecRow {
  label: string;
  getValue: (car: PublicCar) => string;
}

export default function ComparePage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();

  const idsParam = searchParams.get('ids') ?? '';
  const carIds = idsParam
    .split(',')
    .map(s => Number(s.trim()))
    .filter(n => !isNaN(n) && n > 0)
    .slice(0, MAX_COMPARE);

  const { data: allCars } = useQuery({
    queryKey: ['publicCars'],
    queryFn: () => publicApi.getCars(),
  });

  const cars = allCars?.filter(c => carIds.includes(c.id)) ?? [];

  const specRows: SpecRow[] = [
    { label: t('inventory.make'), getValue: c => c.make },
    { label: t('inventory.model'), getValue: c => c.model },
    { label: t('cars.year'), getValue: c => String(c.year) },
    { label: t('cars.mileage'), getValue: c => c.mileage.toLocaleString() + ' mi' },
    { label: t('cars.color'), getValue: c => c.color ?? t('common.noData') },
    { label: t('cars.condition'), getValue: c => c.condition ?? t('common.noData') },
    { label: t('cars.askingPrice'), getValue: c => c.askingPrice != null ? `$${c.askingPrice.toLocaleString()}` : t('common.noData') },
    { label: t('crm.listingType'), getValue: c => t(`listingType.${c.listingType}`) },
    { label: t('tenants.soldBy'), getValue: c => c.tenantName ?? t('common.noData') },
  ];

  // Check if values differ across cars for highlighting
  const hasDifference = (getValue: (car: PublicCar) => string): boolean => {
    if (cars.length < 2) return false;
    const values = cars.map(getValue);
    return new Set(values).size > 1;
  };

  if (carIds.length < 2) {
    return (
      <div className="text-center py-16">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">{t('inventory.comparison')}</h1>
        <p className="text-gray-500 mb-6">{t('inventory.selectToCompare')}</p>
        <Link to="/inventory" className="text-blue-600 hover:text-blue-800 font-medium">
          ← {t('inventory.backToInventory')}
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link to="/inventory" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
            ← {t('inventory.backToInventory')}
          </Link>
          <h1 className="text-3xl font-extrabold text-gray-900 mt-2">{t('inventory.comparison')}</h1>
        </div>
      </div>

      {/* Comparison table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            {/* Images row */}
            <thead>
              <tr className="border-b border-gray-100">
                <th className="p-4 text-left text-sm font-semibold text-gray-500 w-40">{t('inventory.specification')}</th>
                {cars.map(car => {
                  const img = car.images.find(i => i.isPrimary) ?? car.images[0];
                  return (
                    <th key={car.id} className="p-4 text-center min-w-[200px]">
                      <div className="flex flex-col items-center">
                        {img ? (
                          <img
                            src={img.blobUrl}
                            alt={`${car.year} ${car.make} ${car.model}`}
                            className="w-full max-w-[220px] aspect-[16/10] object-cover rounded-xl mb-3"
                          />
                        ) : (
                          <div className="w-full max-w-[220px] aspect-[16/10] bg-gray-100 rounded-xl mb-3 flex items-center justify-center text-4xl text-gray-300">
                            🚗
                          </div>
                        )}
                        <Link
                          to={`/inventory/${car.id}`}
                          className="font-bold text-gray-900 hover:text-blue-600 transition text-base"
                        >
                          {car.year} {car.make} {car.model}
                        </Link>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            {/* Spec rows */}
            <tbody>
              {specRows.map(row => {
                const differs = hasDifference(row.getValue);
                return (
                  <tr key={row.label} className="border-b border-gray-50">
                    <td className="p-4 text-sm font-semibold text-gray-500">{row.label}</td>
                    {cars.map(car => {
                      const val = row.getValue(car);
                      // Highlight this cell if values differ across compared cars
                      const allValues = cars.map(c => row.getValue(c));
                      const isUnique = differs && allValues.filter(v => v === val).length < cars.length;
                      return (
                        <td
                          key={car.id}
                          className={`p-4 text-sm text-center text-gray-700 ${isUnique ? 'bg-yellow-50' : ''}`}
                        >
                          {val}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
