import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../api/admin';

export default function DashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['adminDashboard'],
    queryFn: adminApi.getDashboard,
  });

  if (isLoading) return <div className="text-center py-12 text-gray-500">Loading...</div>;
  if (!stats) return null;

  const statCards = [
    { label: 'Total Cars', value: stats.totalCars, color: 'bg-blue-500' },
    { label: 'Pending Review', value: stats.pendingCars, color: 'bg-yellow-500' },
    { label: 'Active Offers', value: stats.activeOffers, color: 'bg-purple-500' },
    { label: 'Active Consignments', value: stats.activeConsignments, color: 'bg-green-500' },
  ];

  const statusColors: Record<string, string> = {
    Pending: 'bg-yellow-100 text-yellow-800',
    Reviewed: 'bg-blue-100 text-blue-800',
    Offered: 'bg-purple-100 text-purple-800',
    Consigned: 'bg-indigo-100 text-indigo-800',
    Sold: 'bg-green-100 text-green-800',
    Rejected: 'bg-red-100 text-red-800',
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <Link to="/admin/consignments" className="text-blue-600 hover:underline text-sm">
          View All Consignments →
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl shadow-sm p-6">
            <p className="text-sm text-gray-500">{card.label}</p>
            <p className="text-3xl font-bold mt-1">{card.value}</p>
            <div className={`h-1 ${card.color} rounded mt-3 w-12`} />
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Submissions</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-3 font-medium">Car</th>
                <th className="pb-3 font-medium">Owner</th>
                <th className="pb-3 font-medium">Mileage</th>
                <th className="pb-3 font-medium">Asking Price</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Submitted</th>
                <th className="pb-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentSubmissions.map((car) => (
                <tr key={car.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="py-3 font-medium">{car.year} {car.make} {car.model}</td>
                  <td className="py-3 text-gray-600">{car.userName}</td>
                  <td className="py-3">{car.mileage.toLocaleString()}</td>
                  <td className="py-3">{car.askingPrice ? `$${car.askingPrice.toLocaleString()}` : '—'}</td>
                  <td className="py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${statusColors[car.status] || 'bg-gray-100'}`}>
                      {car.status}
                    </span>
                  </td>
                  <td className="py-3 text-gray-500">{new Date(car.createdAt).toLocaleDateString()}</td>
                  <td className="py-3">
                    <Link to={`/admin/cars/${car.id}`} className="text-blue-600 hover:underline">Review</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
