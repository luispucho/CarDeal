import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { carsApi } from '../api/cars';
import { useAuth } from '../context/AuthContext';

export default function CarDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);

  const { data: car, isLoading } = useQuery({
    queryKey: ['car', id],
    queryFn: () => carsApi.getById(Number(id)),
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: () => carsApi.delete(Number(id)),
    onSuccess: () => navigate('/my-cars'),
  });

  const deleteImageMutation = useMutation({
    mutationFn: (imageId: number) => carsApi.deleteImage(Number(id), imageId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['car', id] }),
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

  if (isLoading) return <div className="text-center py-12 text-gray-500">{t('common.loading')}</div>;
  if (!car) return <div className="text-center py-12 text-red-500">{t('cars.carNotFound')}</div>;

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
        {car.userId === user?.id && car.status === 'Pending' && (
          <button onClick={() => deleteMutation.mutate()} className="text-red-600 hover:text-red-800 text-sm">
            {t('common.delete')}
          </button>
        )}
      </div>

      {/* Images */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">{t('cars.photos')}</h2>
        {car.images.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {car.images.map((img) => (
              <div key={img.id} className="relative group">
                <img src={img.blobUrl} alt={img.fileName} className="w-full h-32 object-cover rounded-lg" />
                {car.userId === user?.id && (
                  <button
                    onClick={() => deleteImageMutation.mutate(img.id)}
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
            <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="text-sm" disabled={uploading} />
            {uploading && <p className="text-sm text-blue-600 mt-1">{t('cars.uploading')}</p>}
          </div>
        )}
      </div>

      {/* Details */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">{t('cars.details')}</h2>
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
    </div>
  );
}
