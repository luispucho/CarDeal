import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../context/AuthContext';

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      setError('');
      await login(data);
      // Redirect based on role
      const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
      if (savedUser.role === 'SuperAdmin') {
        navigate('/admin/tenants');
      } else if (savedUser.tenantId) {
        navigate('/crm');
      } else {
        navigate('/my-cars');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12">
      <h1 className="text-3xl font-bold text-center mb-8">{t('auth.signIn')}</h1>
      {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4">{error}</div>}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.email')}</label>
          <input {...register('email')} type="email" className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.password')}</label>
          <input {...register('password')} type="password" className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
          {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
        </div>
        <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition">
          {isSubmitting ? t('auth.signingIn') : t('auth.signIn')}
        </button>
      </form>

      <p className="text-center mt-6 text-sm text-gray-600">
        {t('auth.dealerManaged')}
      </p>
    </div>
  );
}
