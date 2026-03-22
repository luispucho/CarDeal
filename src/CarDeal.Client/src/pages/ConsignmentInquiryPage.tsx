import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { publicApi, type VinDecodeData } from '../api/public';
import NotFoundPage from './NotFoundPage';

const step1Schema = z.object({
  fullName: z.string().min(1, 'Required'),
  email: z.string().email('Invalid email'),
  phone: z.string().min(1, 'Required'),
  vin: z.string().length(17, 'VIN must be exactly 17 characters'),
});
type Step1Data = z.infer<typeof step1Schema>;

export default function ConsignmentInquiryPage() {
  const { t } = useTranslation();
  const { tenantIdOrSlug } = useParams<{ tenantIdOrSlug: string }>();
  const slug = tenantIdOrSlug ?? '';

  const [step, setStep] = useState(1);
  const [contactData, setContactData] = useState<Step1Data | null>(null);
  const [vinData, setVinData] = useState<VinDecodeData | null>(null);
  const [vinError, setVinError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [decodingVin, setDecodingVin] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const { data: branding, isLoading: brandingLoading, isError } = useQuery({
    queryKey: ['tenantBranding', slug],
    queryFn: () => publicApi.getBranding(slug),
    enabled: !!slug,
    retry: false,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Step1Data>({
    resolver: zodResolver(step1Schema) as Resolver<Step1Data>,
  });

  if (isError) return <NotFoundPage />;
  if (brandingLoading) return <div className="text-center py-20 text-gray-500">{t('common.loading')}</div>;
  if (!branding) return <NotFoundPage />;

  const primaryColor = branding.primaryColor || '#4f46e5';

  const onStep1Submit = async (data: Step1Data) => {
    setContactData(data);
    setDecodingVin(true);
    setVinError(false);
    try {
      const decoded = await publicApi.decodeVin(data.vin);
      if (decoded.make || decoded.model) {
        setVinData(decoded);
      } else {
        setVinError(true);
      }
    } catch {
      setVinError(true);
    }
    setDecodingVin(false);
    setStep(2);
  };

  const onConfirmSubmit = async () => {
    if (!contactData || !branding.tenantId) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      await publicApi.submitInquiry(branding.tenantId, {
        fullName: contactData.fullName,
        email: contactData.email,
        phone: contactData.phone,
        vin: contactData.vin,
      });
      setStep(3);
    } catch {
      setSubmitError('Something went wrong. Please try again.');
    }
    setSubmitting(false);
  };

  return (
    <div className="max-w-2xl mx-auto mt-8 mb-16">
      {/* Header */}
      <div className="text-center mb-8">
        {branding.logoUrl && (
          <img src={branding.logoUrl} alt={branding.tenantName} className="w-16 h-16 rounded-xl mx-auto mb-4 object-cover" />
        )}
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">{t('consignment.sellYourCar')}</h1>
        <p className="text-gray-500">{t('consignment.sellSubtitle')}</p>
        <p className="text-sm text-gray-400 mt-1">{branding.tenantName}</p>
      </div>

      {/* Progress */}
      <div className="flex items-center justify-center gap-2 mb-10">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                step >= s ? 'text-white' : 'bg-gray-200 text-gray-500'
              }`}
              style={step >= s ? { backgroundColor: primaryColor } : undefined}
            >
              {s}
            </div>
            {s < 3 && <div className={`w-12 h-0.5 ${step > s ? 'bg-blue-400' : 'bg-gray-200'}`} style={step > s ? { backgroundColor: primaryColor } : undefined} />}
          </div>
        ))}
      </div>

      {/* Step 1 */}
      {step === 1 && (
        <form onSubmit={handleSubmit(onStep1Submit)} className="bg-white rounded-2xl shadow-sm border p-8 space-y-5">
          <h2 className="text-xl font-bold text-gray-900 mb-2">{t('consignment.step1Title')}</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('consignment.fullName')}</label>
            <input {...register('fullName')} className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
            {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('consignment.email')}</label>
            <input {...register('email')} type="email" className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('consignment.phone')}</label>
            <input {...register('phone')} type="tel" className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
            {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('consignment.vinNumber')}</label>
            <input
              {...register('vin')}
              maxLength={17}
              className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-mono uppercase tracking-wider"
            />
            <p className="text-xs text-gray-400 mt-1">{t('consignment.vinHelp')}</p>
            {errors.vin && <p className="text-red-500 text-sm mt-1">{errors.vin.message}</p>}
          </div>

          <button
            type="submit"
            disabled={decodingVin}
            className="w-full text-white py-3 rounded-lg font-bold hover:opacity-90 disabled:opacity-50 transition"
            style={{ backgroundColor: primaryColor }}
          >
            {decodingVin ? t('common.loading') : t('consignment.next')}
          </button>
        </form>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <div className="bg-white rounded-2xl shadow-sm border p-8 space-y-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2">{t('consignment.step2Title')}</h2>

          {vinData && !vinError ? (
            <>
              <p className="text-green-600 font-medium">{t('consignment.vinDecoded')}</p>
              <div className="bg-gray-50 rounded-xl p-6 space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  {vinData.make && (
                    <div>
                      <span className="text-xs text-gray-400 uppercase">Make</span>
                      <p className="font-semibold text-gray-900">{vinData.make}</p>
                    </div>
                  )}
                  {vinData.model && (
                    <div>
                      <span className="text-xs text-gray-400 uppercase">Model</span>
                      <p className="font-semibold text-gray-900">{vinData.model}</p>
                    </div>
                  )}
                  {vinData.modelYear && (
                    <div>
                      <span className="text-xs text-gray-400 uppercase">Year</span>
                      <p className="font-semibold text-gray-900">{vinData.modelYear}</p>
                    </div>
                  )}
                  {vinData.bodyClass && (
                    <div>
                      <span className="text-xs text-gray-400 uppercase">{t('consignment.bodyClass')}</span>
                      <p className="font-semibold text-gray-900">{vinData.bodyClass}</p>
                    </div>
                  )}
                  {vinData.driveType && (
                    <div>
                      <span className="text-xs text-gray-400 uppercase">{t('consignment.driveType')}</span>
                      <p className="font-semibold text-gray-900">{vinData.driveType}</p>
                    </div>
                  )}
                  {vinData.fuelTypePrimary && (
                    <div>
                      <span className="text-xs text-gray-400 uppercase">{t('consignment.fuelType')}</span>
                      <p className="font-semibold text-gray-900">{vinData.fuelTypePrimary}</p>
                    </div>
                  )}
                  {(vinData.engineCylinders || vinData.displacementL) && (
                    <div>
                      <span className="text-xs text-gray-400 uppercase">{t('consignment.engine')}</span>
                      <p className="font-semibold text-gray-900">
                        {[vinData.engineCylinders && `${vinData.engineCylinders} cyl`, vinData.displacementL && `${vinData.displacementL}L`].filter(Boolean).join(', ')}
                      </p>
                    </div>
                  )}
                  {vinData.transmissionStyle && (
                    <div>
                      <span className="text-xs text-gray-400 uppercase">{t('consignment.transmission')}</span>
                      <p className="font-semibold text-gray-900">{vinData.transmissionStyle}</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <p className="text-amber-600 bg-amber-50 rounded-lg p-4">{t('consignment.vinFailed')}</p>
          )}

          {submitError && <p className="text-red-500 text-sm">{submitError}</p>}

          <div className="flex gap-3">
            <button
              onClick={() => { setStep(1); setVinData(null); setVinError(false); }}
              className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-50 transition"
            >
              {t('consignment.goBack')}
            </button>
            <button
              onClick={onConfirmSubmit}
              disabled={submitting}
              className="flex-1 text-white py-3 rounded-lg font-bold hover:opacity-90 disabled:opacity-50 transition"
              style={{ backgroundColor: primaryColor }}
            >
              {submitting ? t('common.loading') : t('consignment.looksCorrect')}
            </button>
          </div>
        </div>
      )}

      {/* Step 3 */}
      {step === 3 && contactData && (
        <div className="bg-white rounded-2xl shadow-sm border p-8 text-center space-y-4">
          <div className="text-5xl mb-2">🎉</div>
          <h2 className="text-2xl font-bold text-gray-900">{t('consignment.step3Title')}</h2>
          <p className="text-gray-600">
            {t('consignment.submitted')} <span className="font-semibold">{branding.tenantName}</span>.
          </p>
          <p className="text-gray-500">
            {t('consignment.willContact')}{' '}
            <span className="font-medium text-gray-700">{contactData.email}</span>{' '}
            {t('consignment.or')}{' '}
            <span className="font-medium text-gray-700">{contactData.phone}</span>.
          </p>
        </div>
      )}
    </div>
  );
}
