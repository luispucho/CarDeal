import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { carsApi } from '../api/cars';

const schema = z.object({
  make: z.string().min(1, 'Make is required'),
  model: z.string().min(1, 'Model is required'),
  year: z.coerce.number().min(1900).max(2100),
  mileage: z.coerce.number().min(0),
  vin: z.string().optional(),
  color: z.string().optional(),
  condition: z.string().optional(),
  description: z.string().optional(),
  askingPrice: z.coerce.number().min(0).optional(),
});
type FormData = z.infer<typeof schema>;

export default function SubmitCarPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema) as Resolver<FormData>,
  });

  const createMutation = useMutation({ mutationFn: carsApi.create });

  const onSubmit = async (data: FormData) => {
    try {
      setError('');
      const car = await createMutation.mutateAsync({
        make: data.make,
        model: data.model,
        year: data.year,
        mileage: data.mileage,
        vin: data.vin,
        color: data.color,
        condition: data.condition,
        description: data.description,
        askingPrice: data.askingPrice,
      });

      if (files.length > 0) {
        setUploading(true);
        for (const file of files) {
          await carsApi.uploadImage(car.id, file);
        }
        setUploading(false);
      }

      navigate(`/cars/${car.id}`);
    } catch (err: any) {
      setError(err.response?.data?.error || t('cars.failedSubmit'));
      setUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">{t('cars.submitYourCar')}</h1>
      {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4">{error}</div>}

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('cars.make')} *</label>
            <input {...register('make')} placeholder={t('cars.makePlaceholder')} className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
            {errors.make && <p className="text-red-500 text-sm mt-1">{errors.make.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('cars.model')} *</label>
            <input {...register('model')} placeholder={t('cars.modelPlaceholder')} className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
            {errors.model && <p className="text-red-500 text-sm mt-1">{errors.model.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('cars.year')} *</label>
            <input {...register('year')} type="number" className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
            {errors.year && <p className="text-red-500 text-sm mt-1">{errors.year.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('cars.mileage')} *</label>
            <input {...register('mileage')} type="number" className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
            {errors.mileage && <p className="text-red-500 text-sm mt-1">{errors.mileage.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('cars.vin')}</label>
            <input {...register('vin')} className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('cars.color')}</label>
            <input {...register('color')} className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('cars.condition')}</label>
          <select {...register('condition')} className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none">
            <option value="">{t('cars.selectCondition')}</option>
            <option value="Excellent">{t('cars.excellent')}</option>
            <option value="Good">{t('cars.good')}</option>
            <option value="Fair">{t('cars.fair')}</option>
            <option value="Poor">{t('cars.poor')}</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('cars.description')}</label>
          <textarea {...register('description')} rows={4} className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" placeholder={t('cars.descPlaceholder')} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('cars.askingPrice')}</label>
          <input {...register('askingPrice')} type="number" step="0.01" className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('cars.photosLimit')}</label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => setFiles(Array.from(e.target.files || []).slice(0, 10))}
            className="w-full border rounded-lg px-4 py-2"
          />
          {files.length > 0 && (
            <p className="text-sm text-gray-500 mt-1">{t('cars.filesSelected', { count: files.length })}</p>
          )}
        </div>

        <button type="submit" disabled={isSubmitting || uploading} className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition font-semibold">
          {uploading ? t('cars.uploadingImages') : isSubmitting ? t('cars.submitting') : t('cars.submitCar')}
        </button>
      </form>
    </div>
  );
}
