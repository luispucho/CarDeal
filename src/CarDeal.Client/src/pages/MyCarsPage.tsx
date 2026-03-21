import { Link } from 'react-router-dom';
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
  const { data: cars, isLoading } = useQuery({
    queryKey: ['myCars'],
    queryFn: carsApi.getMyCars,
  });

  if (isLoading) return <div className="text-center py-12 text-gray-500">Loading...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Cars</h1>
        <Link to="/submit-car" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm">
          + Submit New Car
        </Link>
      </div>

      {!cars?.length ? (
        <div className="text-center py-16 bg-white rounded-xl shadow-sm">
          <p className="text-gray-500 mb-4">You haven't submitted any cars yet.</p>
          <Link to="/submit-car" className="text-blue-600 hover:underline">Submit your first car →</Link>
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
                    {car.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{car.mileage.toLocaleString()} miles</p>
                {car.askingPrice && <p className="text-lg font-bold text-green-600 mt-2">${car.askingPrice.toLocaleString()}</p>}
                {(car.offers?.length ?? 0) > 0 && (
                  <p className="text-sm text-purple-600 mt-1">
                    {car.offers!.length} offer{car.offers!.length > 1 ? 's' : ''} received
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
