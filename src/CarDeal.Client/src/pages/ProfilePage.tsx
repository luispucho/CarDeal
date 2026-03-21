import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileApi } from '../api/profile';
import { useAuth } from '../context/AuthContext';

const schema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export default function ProfilePage() {
  const { t } = useTranslation();
  const { user, updateUser, logout } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: profileApi.getProfile,
  });

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as Resolver<FormData>,
    values: profile ? { fullName: profile.fullName, phone: profile.phone || '' } : undefined,
  });

  const updateMutation = useMutation({
    mutationFn: profileApi.updateProfile,
    onSuccess: (data) => {
      queryClient.setQueryData(['profile'], data);
      updateUser({ fullName: data.fullName, phone: data.phone, profilePictureUrl: data.profilePictureUrl });
      setFeedback({ type: 'success', message: t('profile.saved') });
      setTimeout(() => setFeedback(null), 3000);
    },
    onError: () => {
      setFeedback({ type: 'error', message: t('profile.error') });
      setTimeout(() => setFeedback(null), 3000);
    },
  });

  const uploadMutation = useMutation({
    mutationFn: profileApi.uploadPicture,
    onSuccess: (data) => {
      queryClient.setQueryData(['profile'], data);
      updateUser({ fullName: data.fullName, phone: data.phone, profilePictureUrl: data.profilePictureUrl });
      setFeedback({ type: 'success', message: t('profile.pictureUploaded') });
      setTimeout(() => setFeedback(null), 3000);
    },
    onError: () => {
      setFeedback({ type: 'error', message: t('profile.pictureError') });
      setTimeout(() => setFeedback(null), 3000);
    },
  });

  const deletePictureMutation = useMutation({
    mutationFn: profileApi.deletePicture,
    onSuccess: (data) => {
      queryClient.setQueryData(['profile'], data);
      updateUser({ fullName: data.fullName, phone: data.phone, profilePictureUrl: data.profilePictureUrl });
      setFeedback({ type: 'success', message: t('profile.pictureRemoved') });
      setTimeout(() => setFeedback(null), 3000);
    },
    onError: () => {
      setFeedback({ type: 'error', message: t('profile.pictureError') });
      setTimeout(() => setFeedback(null), 3000);
    },
  });

  const onSubmit = (data: FormData) => {
    updateMutation.mutate({ fullName: data.fullName, phone: data.phone || undefined });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadMutation.mutate(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm(t('profile.confirmDelete'))) return;
    const answer = window.prompt(t('profile.confirmDeleteFinal'));
    if (answer !== 'DELETE') return;

    setDeleting(true);
    try {
      await profileApi.deleteAccount();
      logout();
    } catch {
      setFeedback({ type: 'error', message: t('profile.error') });
      setTimeout(() => setFeedback(null), 3000);
    } finally {
      setDeleting(false);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (isLoading) {
    return <div className="text-center py-12 text-gray-500">{t('common.loading')}</div>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">{t('profile.title')}</h1>

      {feedback && (
        <div className={`p-3 rounded-lg mb-4 ${feedback.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
          {feedback.message}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
        {/* Avatar Section */}
        <div className="flex flex-col items-center space-y-3">
          <div className="relative">
            {profile?.profilePictureUrl ? (
              <img
                src={profile.profilePictureUrl}
                alt={t('profile.avatar')}
                className="w-24 h-24 rounded-full object-cover border-4 border-blue-100"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-bold border-4 border-blue-100">
                {getInitials(profile?.fullName || user?.fullName || '?')}
              </div>
            )}
          </div>
          <div className="flex space-x-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadMutation.isPending}
              className="text-sm bg-blue-600 text-white px-4 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {uploadMutation.isPending
                ? t('common.loading')
                : profile?.profilePictureUrl
                  ? t('profile.changePicture')
                  : t('profile.uploadPicture')}
            </button>
            {profile?.profilePictureUrl && (
              <button
                type="button"
                onClick={() => deletePictureMutation.mutate()}
                disabled={deletePictureMutation.isPending}
                className="text-sm bg-red-50 text-red-600 px-4 py-1.5 rounded-lg hover:bg-red-100 disabled:opacity-50 transition"
              >
                {t('profile.removePicture')}
              </button>
            )}
          </div>
        </div>

        {/* Profile Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('profile.fullName')} *</label>
            <input
              {...register('fullName')}
              className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
            {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('profile.phone')}</label>
            <input
              {...register('phone')}
              type="tel"
              className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('profile.email')}</label>
            <input
              type="email"
              value={profile?.email || ''}
              readOnly
              className="w-full border rounded-lg px-4 py-2 bg-gray-50 text-gray-500 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('profile.memberSince')}</label>
            <input
              type="text"
              value={profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : ''}
              readOnly
              className="w-full border rounded-lg px-4 py-2 bg-gray-50 text-gray-500 cursor-not-allowed"
            />
          </div>

          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition font-semibold"
          >
            {updateMutation.isPending ? t('profile.saving') : t('profile.save')}
          </button>
        </form>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-xl shadow-sm p-6 mt-6 border border-red-200">
        <h2 className="text-lg font-semibold text-red-600 mb-2">{t('profile.dangerZone')}</h2>
        <p className="text-sm text-gray-600 mb-4">{t('profile.deleteWarning')}</p>
        <button
          onClick={handleDeleteAccount}
          disabled={deleting}
          className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 transition text-sm font-semibold"
        >
          {deleting ? t('common.loading') : t('profile.deleteAccount')}
        </button>
      </div>
    </div>
  );
}
