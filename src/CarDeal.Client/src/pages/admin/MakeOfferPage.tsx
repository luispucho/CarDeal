import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { adminApi } from '../../api/admin';
import { useState } from 'react';

const offerSchema = z.object({
  amount: z.coerce.number().min(0.01, 'Amount must be positive'),
  notes: z.string().optional(),
});

const consignSchema = z.object({
  agreedPrice: z.coerce.number().min(0.01, 'Price must be positive'),
  commissionPercent: z.coerce.number().min(0).max(100, 'Must be 0-100'),
  startDate: z.string().min(1, 'Start date required'),
  endDate: z.string().optional(),
});

type OfferForm = z.infer<typeof offerSchema>;
type ConsignForm = z.infer<typeof consignSchema>;

export default function MakeOfferPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'offer' | 'consign'>('offer');
  const [error, setError] = useState('');

  const { data: car, isLoading } = useQuery({
    queryKey: ['adminCar', id],
    queryFn: () => adminApi.getCar(Number(id)),
    enabled: !!id,
  });

  const offerForm = useForm<OfferForm>({ resolver: zodResolver(offerSchema) as Resolver<OfferForm> });
  const consignForm = useForm<ConsignForm>({ resolver: zodResolver(consignSchema) as Resolver<ConsignForm> });

  const offerMutation = useMutation({
    mutationFn: (data: OfferForm) => adminApi.makeOffer(Number(id), data),
    onSuccess: () => navigate(`/admin/cars/${id}`),
    onError: (err: any) => setError(err.response?.data?.error || 'Failed to create offer'),
  });

  const consignMutation = useMutation({
    mutationFn: (data: ConsignForm) => adminApi.createConsignment(Number(id), {
      agreedPrice: data.agreedPrice,
      commissionPercent: data.commissionPercent,
      startDate: data.startDate,
      endDate: data.endDate,
    }),
    onSuccess: () => navigate(`/admin/consignments`),
    onError: (err: any) => setError(err.response?.data?.error || 'Failed to create consignment'),
  });

  if (isLoading) return <div className="text-center py-12 text-gray-500">Loading...</div>;
  if (!car) return <div className="text-center py-12 text-red-500">Car not found</div>;

  return (
    <div className="max-w-2xl mx-auto">
      <Link to={`/admin/cars/${id}`} className="text-blue-600 hover:underline text-sm">← Back to Review</Link>
      <h1 className="text-2xl font-bold mt-2 mb-1">Make Offer / Consign</h1>
      <p className="text-gray-500 mb-6">{car.year} {car.make} {car.model} — Asking {car.askingPrice ? `$${car.askingPrice.toLocaleString()}` : 'N/A'}</p>

      {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4">{error}</div>}

      <div className="flex space-x-1 mb-6">
        <button onClick={() => setTab('offer')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab === 'offer' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
          💰 Make Offer
        </button>
        <button onClick={() => setTab('consign')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab === 'consign' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
          🤝 Consign
        </button>
      </div>

      {tab === 'offer' ? (
        <form onSubmit={offerForm.handleSubmit((d) => offerMutation.mutate(d))} className="bg-white rounded-xl shadow-sm p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Offer Amount ($) *</label>
            <input {...offerForm.register('amount')} type="number" step="0.01" className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
            {offerForm.formState.errors.amount && <p className="text-red-500 text-sm mt-1">{offerForm.formState.errors.amount.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea {...offerForm.register('notes')} rows={3} className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Any notes about this offer..." />
          </div>
          <button type="submit" disabled={offerMutation.isPending} className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 transition font-semibold">
            {offerMutation.isPending ? 'Submitting...' : 'Submit Offer'}
          </button>
        </form>
      ) : (
        <form onSubmit={consignForm.handleSubmit((d) => consignMutation.mutate(d))} className="bg-white rounded-xl shadow-sm p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Agreed Price ($) *</label>
            <input {...consignForm.register('agreedPrice')} type="number" step="0.01" className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
            {consignForm.formState.errors.agreedPrice && <p className="text-red-500 text-sm mt-1">{consignForm.formState.errors.agreedPrice.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Commission (%) *</label>
            <input {...consignForm.register('commissionPercent')} type="number" step="0.01" className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
            {consignForm.formState.errors.commissionPercent && <p className="text-red-500 text-sm mt-1">{consignForm.formState.errors.commissionPercent.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
              <input {...consignForm.register('startDate')} type="date" className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
              {consignForm.formState.errors.startDate && <p className="text-red-500 text-sm mt-1">{consignForm.formState.errors.startDate.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input {...consignForm.register('endDate')} type="date" className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          </div>
          <button type="submit" disabled={consignMutation.isPending} className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition font-semibold">
            {consignMutation.isPending ? 'Creating...' : 'Create Consignment'}
          </button>
        </form>
      )}
    </div>
  );
}
