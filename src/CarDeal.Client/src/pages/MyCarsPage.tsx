import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { carsApi } from '../api/cars';

const statusColors: Record<string, string> = {
  Pending: 'bg-yellow-100 text-yellow-800',
  Reviewed: 'bg-blue-100 text-blue-800',
  Offered: 'bg-purple-100 text-purple-800',
  Consigned: 'bg-indigo-100 text-indigo-800',
  Sold: 'bg-green-100 text-green-800',
  Rejected: 'bg-red-100 text-red-800',
};

export default function MyCarsPage() {
  const { t } = useTranslation();
  const { data: cars, isLoading } = useQuery({
    queryKey: ['myCars'],
    queryFn: carsApi.getMyCars,
  });

  if (isLoading) return <div className="text-center py-12 text-gray-500">{t('common.loading')}</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t('cars.myCars')}</h1>
        <Link to="/submit-car" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm">
          {t('cars.submitNewCar')}
        </Link>
      </div>

      {!cars?.length ? (
        <div className="text-center py-16 bg-white rounded-xl shadow-sm">
          <p className="text-gray-500 mb-4">{t('cars.noCarsYet')}</p>
          <Link to="/submit-car" className="text-blue-600 hover:underline">{t('cars.submitFirst')}</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cars.map((car) => (
            <Link key={car.id} to={`/cars/${car.id}`} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition">
              <div className="h-48 bg-gray-200 flex items-center justify-center">
                {car.images.length > 0 ? (
                  <img src={car.images.find(i => i.isPrimary)?.blobUrl || car.images[0].blobUrl} alt={`${car.make} ${car.model}`} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-gray-400 text-4xl">🚗</span>
                )}
              </div>
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-lg">{car.year} {car.make} {car.model}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${statusColors[car.status] || 'bg-gray-100'}`}>
                    {t(`carStatus.${car.status}`)}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{car.mileage.toLocaleString()} {t('common.miles')}</p>
                {car.askingPrice && <p className="text-lg font-bold text-green-600 mt-2">${car.askingPrice.toLocaleString()}</p>}
                {(car.offers?.length ?? 0) > 0 && (
                  <p className="text-sm text-purple-600 mt-1">
                    {t('cars.offersReceived', { count: car.offers!.length })}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
