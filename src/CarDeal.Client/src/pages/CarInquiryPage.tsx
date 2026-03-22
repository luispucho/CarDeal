import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { publicApi } from '../api/public';

const inquirySchema = z.object({
  fullName: z.string().min(1, 'Required'),
  email: z.string().email('Invalid email'),
  phone: z.string().min(1, 'Required'),
  message: z.string().optional(),
});
type InquiryFormData = z.infer<typeof inquirySchema>;

export default function CarInquiryPage() {
  const { t } = useTranslation();
  const { tenantIdOrSlug, carId } = useParams<{ tenantIdOrSlug?: string; carId: string }>();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const tenantPrefix = tenantIdOrSlug ? `/${tenantIdOrSlug}` : '';

  const { data: car, isLoading } = useQuery({
    queryKey: ['publicCar', carId],
    queryFn: () => publicApi.getCarById(Number(carId)),
    enabled: !!carId,
  });

  const { data: branding } = useQuery({
    queryKey: ['tenantBranding', tenantIdOrSlug],
    queryFn: () => publicApi.getBranding(tenantIdOrSlug!),
    enabled: !!tenantIdOrSlug && isNaN(Number(tenantIdOrSlug)),
    retry: false,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<InquiryFormData>({
    resolver: zodResolver(inquirySchema) as Resolver<InquiryFormData>,
  });

  const onSubmit = async (data: InquiryFormData) => {
    if (!carId) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      await publicApi.submitCarInquiry({
        carId: Number(carId),
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        message: data.message || undefined,
      });
      setSubmitted(true);
    } catch {
      setSubmitError('Something went wrong. Please try again.');
    }
    setSubmitting(false);
  };

  if (isLoading) return <div className="text-center py-12 text-gray-500">{t('common.loading')}</div>;
  if (!car) return <div className="text-center py-12 text-red-500">{t('cars.carNotFound')}</div>;

  const primaryImage = car.images.find(i => i.isPrimary) ?? car.images[0];
  const tenantName = branding?.tenantName ?? car.tenantName ?? '';

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto mt-8 mb-16">
        <div className="bg-white rounded-2xl shadow-sm border p-8 text-center space-y-4">
          <div className="text-5xl mb-2">🎉</div>
          <h2 className="text-2xl font-bold text-gray-900">{t('inventory.inquirySubmitted')}</h2>
          <p className="text-gray-600">
            {tenantName && (
              <>
                {t('inventory.inquiryMessage')}{' '}
                <span className="font-semibold">{car.year} {car.make} {car.model}</span>{' '}
                {t('inventory.inquirySoon')}.
              </>
            )}
            {!tenantName && (
              <>
                {t('inventory.inquiryMessage')}{' '}
                <span className="font-semibold">{car.year} {car.make} {car.model}</span>{' '}
                {t('inventory.inquirySoon')}.
              </>
            )}
          </p>
          <Link
            to={`${tenantPrefix}/inventory`}
            className="inline-block mt-4 text-blue-600 hover:underline font-medium"
          >
            ← {t('inventory.backToInventory')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto mt-8 mb-16">
      {/* Car Info Header */}
      <div className="bg-white rounded-2xl shadow-sm border p-6 mb-6">
        <div className="flex gap-4 items-center">
          {primaryImage ? (
            <img
              src={primaryImage.blobUrl}
              alt={`${car.year} ${car.make} ${car.model}`}
              className="w-24 h-18 object-cover rounded-xl"
            />
          ) : (
            <div className="w-24 h-18 bg-gray-100 rounded-xl flex items-center justify-center text-3xl text-gray-300">🚗</div>
          )}
          <div>
            <h2 className="text-xl font-bold text-gray-900">{car.year} {car.make} {car.model}</h2>
            {car.askingPrice != null && (
              <p className="text-lg font-semibold text-green-600">${car.askingPrice.toLocaleString()}</p>
            )}
            {tenantName && <p className="text-sm text-gray-500">{tenantName}</p>}
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-2xl shadow-sm border p-8 space-y-5">
        <h2 className="text-xl font-bold text-gray-900 mb-2">{t('inventory.contactAbout')}</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('inventory.yourName')}</label>
          <input
            {...register('fullName')}
            className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
          {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('inventory.yourEmail')}</label>
          <input
            {...register('email')}
            type="email"
            className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('inventory.yourPhone')}</label>
          <input
            {...register('phone')}
            type="tel"
            className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
          {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('inventory.yourMessage')}</label>
          <textarea
            {...register('message')}
            rows={3}
            placeholder={t('inventory.messagePlaceholder')}
            className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
          />
        </div>

        {submitError && <p className="text-red-500 text-sm">{submitError}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 transition"
        >
          {submitting ? t('common.loading') : t('inventory.submitInquiry')}
        </button>

        <Link
          to={`${tenantPrefix}/inventory/${carId}`}
          className="block text-center text-sm text-gray-500 hover:text-gray-700 mt-2"
        >
          ← {t('inventory.backToInventory')}
        </Link>
      </form>
    </div>
  );
}
