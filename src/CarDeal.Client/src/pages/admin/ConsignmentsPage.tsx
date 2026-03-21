import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api/admin';

export default function ConsignmentsPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('');

  const { data: consignments, isLoading } = useQuery({
    queryKey: ['consignments', statusFilter],
    queryFn: () => adminApi.getConsignments(statusFilter || undefined),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      adminApi.updateConsignment(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['consignments'] }),
  });

  const statusColors: Record<string, string> = {
    Active: 'bg-green-100 text-green-800',
    Sold: 'bg-blue-100 text-blue-800',
    Expired: 'bg-yellow-100 text-yellow-800',
    Cancelled: 'bg-red-100 text-red-800',
  };

  if (isLoading) return <div className="text-center py-12 text-gray-500">Loading...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <Link to="/admin" className="text-blue-600 hover:underline text-sm">← Back to Dashboard</Link>
          <h1 className="text-2xl font-bold mt-2">Consignments</h1>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border rounded-lg px-4 py-2 text-sm"
        >
          <option value="">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Sold">Sold</option>
          <option value="Expired">Expired</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      {!consignments?.length ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm text-gray-500">No consignments found</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b bg-gray-50">
                <th className="px-6 py-3 font-medium">ID</th>
                <th className="px-6 py-3 font-medium">Car ID</th>
                <th className="px-6 py-3 font-medium">Agreed Price</th>
                <th className="px-6 py-3 font-medium">Commission</th>
                <th className="px-6 py-3 font-medium">Period</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {consignments.map((c) => (
                <tr key={c.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-6 py-4">{c.id}</td>
                  <td className="px-6 py-4">
                    <Link to={`/admin/cars/${c.carId}`} className="text-blue-600 hover:underline">#{c.carId}</Link>
                  </td>
                  <td className="px-6 py-4 font-medium">${c.agreedPrice.toLocaleString()}</td>
                  <td className="px-6 py-4">{c.commissionPercent}%</td>
                  <td className="px-6 py-4 text-gray-500">
                    {new Date(c.startDate).toLocaleDateString()} — {c.endDate ? new Date(c.endDate).toLocaleDateString() : 'Open'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2 py-1 rounded-full ${statusColors[c.status] || 'bg-gray-100'}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {c.status === 'Active' && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => updateMutation.mutate({ id: c.id, status: 'Sold' })}
                          className="text-green-600 hover:underline text-xs"
                        >
                          Mark Sold
                        </button>
                        <button
                          onClick={() => updateMutation.mutate({ id: c.id, status: 'Cancelled' })}
                          className="text-red-600 hover:underline text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
