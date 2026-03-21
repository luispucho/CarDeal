import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { carsApi } from '../api/cars';
import { useAuth } from '../context/AuthContext';

const editSchema = z.object({
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
type EditFormData = z.infer<typeof editSchema>;

export default function CarDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const { data: car, isLoading } = useQuery({
    queryKey: ['car', id],
    queryFn: () => carsApi.getById(Number(id)),
    enabled: !!id,
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<EditFormData>({
    resolver: zodResolver(editSchema) as Resolver<EditFormData>,
  });

  const deleteMutation = useMutation({
    mutationFn: () => carsApi.delete(Number(id)),
    onSuccess: () => navigate('/my-cars'),
  });

  const updateMutation = useMutation({
    mutationFn: (data: EditFormData) => carsApi.update(Number(id), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['car', id] });
      setIsEditing(false);
      setEditError('');
      setEditSuccess(t('cars.carUpdated'));
      setTimeout(() => setEditSuccess(''), 3000);
    },
    onError: (err: any) => {
      setEditError(err.response?.data?.error || t('cars.failedUpdate'));
    },
  });

  const deleteImageMutation = useMutation({
    mutationFn: (imageId: number) => carsApi.deleteImage(Number(id), imageId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['car', id] }),
  });

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (lightboxIndex === null) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxIndex(null);
      if (e.key === 'ArrowRight') setLightboxIndex(prev => prev !== null ? (prev + 1) % car!.images.length : null);
      if (e.key === 'ArrowLeft') setLightboxIndex(prev => prev !== null ? (prev - 1 + car!.images.length) % car!.images.length : null);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [lightboxIndex, car?.images.length]);

  const handleImageUpload= async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        await carsApi.uploadImage(Number(id), file);
      }
      queryClient.invalidateQueries({ queryKey: ['car', id] });
    } finally {
      setUploading(false);
    }
  };

  const startEditing = () => {
    if (!car) return;
    reset({
      make: car.make,
      model: car.model,
      year: car.year,
      mileage: car.mileage,
      vin: car.vin || '',
      color: car.color || '',
      condition: car.condition || '',
      description: car.description || '',
      askingPrice: car.askingPrice ?? undefined,
    });
    setEditError('');
    setEditSuccess('');
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditError('');
  };

  if (isLoading) return <div className="text-center py-12 text-gray-500">{t('common.loading')}</div>;
  if (!car) return <div className="text-center py-12 text-red-500">{t('cars.carNotFound')}</div>;

  const isOwnerPending = car.userId === user?.id && car.status === 'Pending';

  const statusColors: Record<string, string> = {
    Pending: 'bg-yellow-100 text-yellow-800',
    Reviewed: 'bg-blue-100 text-blue-800',
    Offered: 'bg-purple-100 text-purple-800',
    Consigned: 'bg-indigo-100 text-indigo-800',
    Sold: 'bg-green-100 text-green-800',
    Rejected: 'bg-red-100 text-red-800',
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold">{car.year} {car.make} {car.model}</h1>
          <span className={`inline-block mt-2 text-sm px-3 py-1 rounded-full ${statusColors[car.status] || 'bg-gray-100'}`}>
            {t(`carStatus.${car.status}`)}
          </span>
        </div>
        {isOwnerPending && (
          <div className="flex gap-3">
            {!isEditing && (
              <button onClick={startEditing} className="text-blue-600 hover:text-blue-800 text-sm">
                {t('cars.edit')}
              </button>
            )}
            <button onClick={() => deleteMutation.mutate()} className="text-red-600 hover:text-red-800 text-sm">
              {t('common.delete')}
            </button>
          </div>
        )}
      </div>

      {editSuccess && <div className="bg-green-50 text-green-600 p-3 rounded-lg mb-4">{editSuccess}</div>}
      {editError && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4">{editError}</div>}

      {/* Images */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">{t('cars.photos')}</h2>
        {car.images.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {car.images.map((img) => (
              <div key={img.id} className="relative group">
                <img src={img.blobUrl} alt={img.fileName} className="w-full h-32 object-cover rounded-lg cursor-pointer" onClick={() => setLightboxIndex(car.images.indexOf(img))} />
                {car.userId === user?.id && (
                  <button
                    onClick={() => { if (window.confirm(t('cars.confirmDeletePhoto'))) deleteImageMutation.mutate(img.id); }}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 text-xs opacity-0 group-hover:opacity-100 transition"
                  >
                    ✕
                  </button>
                )}
                {img.isPrimary && <span className="absolute bottom-1 left-1 bg-blue-600 text-white text-xs px-2 py-0.5 rounded">{t('common.primary')}</span>}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">{t('cars.noPhotosYet')}</p>
        )}
        {car.userId === user?.id && car.images.length < 10 && (
          <div className="mt-4">
            <label className="inline-flex items-center gap-2 cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
              {t('cars.addPhotos')}
              <input type="file" className="hidden" accept="image/*" multiple onChange={handleImageUpload} disabled={uploading} />
            </label>
            {uploading && <p className="text-sm text-blue-600 mt-1">{t('cars.uploading')}</p>}
          </div>
        )}
      </div>

      {/* Details */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">{isEditing ? t('cars.editing') : t('cars.details')}</h2>

        {isEditing ? (
          <form onSubmit={handleSubmit((data) => updateMutation.mutate(data))} className="space-y-4">
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

            <div className="flex gap-3">
              <button type="submit" disabled={isSubmitting} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition font-semibold">
                {isSubmitting ? t('cars.editing') : t('cars.saveChanges')}
              </button>
              <button type="button" onClick={cancelEditing} className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition font-semibold">
                {t('cars.cancel')}
              </button>
            </div>
          </form>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-gray-500">{t('cars.make')}:</span> <span className="font-medium">{car.make}</span></div>
              <div><span className="text-gray-500">{t('cars.model')}:</span> <span className="font-medium">{car.model}</span></div>
              <div><span className="text-gray-500">{t('cars.year')}:</span> <span className="font-medium">{car.year}</span></div>
              <div><span className="text-gray-500">{t('cars.mileage')}:</span> <span className="font-medium">{car.mileage.toLocaleString()} {t('common.miles')}</span></div>
              {car.vin && <div><span className="text-gray-500">{t('cars.vin')}:</span> <span className="font-medium">{car.vin}</span></div>}
              {car.color && <div><span className="text-gray-500">{t('cars.color')}:</span> <span className="font-medium">{car.color}</span></div>}
              {car.condition && <div><span className="text-gray-500">{t('cars.condition')}:</span> <span className="font-medium">{car.condition}</span></div>}
              {car.askingPrice && <div><span className="text-gray-500">{t('cars.askingPrice')}:</span> <span className="font-medium text-green-600">${car.askingPrice.toLocaleString()}</span></div>}
            </div>
            {car.description && <p className="mt-4 text-gray-700">{car.description}</p>}
          </>
        )}
      </div>

      {/* Offers */}
      {car.offers && car.offers.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">{t('cars.offers')}</h2>
          <div className="space-y-3">
            {car.offers.map((offer) => (
              <div key={offer.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-semibold text-lg text-green-600">${offer.amount.toLocaleString()}</p>
                  {offer.notes && <p className="text-sm text-gray-600 mt-1">{offer.notes}</p>}
                  <p className="text-xs text-gray-400 mt-1">{t('cars.from')} {offer.adminName} · {new Date(offer.createdAt).toLocaleDateString()}</p>
                </div>
                <span className={`text-sm px-3 py-1 rounded-full ${
                  offer.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                  offer.status === 'Accepted' ? 'bg-green-100 text-green-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {t(`offerStatus.${offer.status}`)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxIndex !== null && car.images.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center" onClick={() => setLightboxIndex(null)}>
          {/* Close button */}
          <button className="absolute top-4 right-4 text-white text-3xl hover:text-gray-300 z-10" onClick={() => setLightboxIndex(null)}>✕</button>

          {/* Main image */}
          <div className="flex-1 flex items-center justify-center w-full px-16 py-4" onClick={(e) => e.stopPropagation()}>
            {/* Left arrow */}
            {car.images.length > 1 && (
              <button
                className="absolute left-4 text-white text-4xl hover:text-gray-300 select-none"
                onClick={(e) => { e.stopPropagation(); setLightboxIndex((lightboxIndex - 1 + car.images.length) % car.images.length); }}
              >
                ‹
              </button>
            )}

            <img
              src={car.images[lightboxIndex].blobUrl}
              alt={car.images[lightboxIndex].fileName}
              className="max-h-[70vh] max-w-full object-contain rounded-lg"
            />

            {/* Right arrow */}
            {car.images.length > 1 && (
              <button
                className="absolute right-4 text-white text-4xl hover:text-gray-300 select-none"
                onClick={(e) => { e.stopPropagation(); setLightboxIndex((lightboxIndex + 1) % car.images.length); }}
              >
                ›
              </button>
            )}
          </div>

          {/* Image counter */}
          <p className="text-white text-sm mb-2">{lightboxIndex + 1} / {car.images.length}</p>

          {/* Thumbnail strip */}
          <div className="flex gap-2 pb-4 px-4 overflow-x-auto" onClick={(e) => e.stopPropagation()}>
            {car.images.map((img, idx) => (
              <img
                key={img.id}
                src={img.blobUrl}
                alt={img.fileName}
                className={`h-16 w-20 object-cover rounded cursor-pointer transition ${idx === lightboxIndex ? 'ring-2 ring-white opacity-100' : 'opacity-50 hover:opacity-80'}`}
                onClick={() => setLightboxIndex(idx)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
