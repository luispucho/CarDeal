import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { adminApi } from '../../api/admin';
import { settingsApi } from '../../api/settings';
import { tenantApi } from '../../api/tenant';
import { useAuth } from '../../context/AuthContext';

export default function DashboardPage() {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const { isSuperAdmin } = useAuth();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['adminDashboard'],
    queryFn: adminApi.getDashboard,
  });

  const { data: tenants } = useQuery({
    queryKey: ['tenants'],
    queryFn: tenantApi.list,
    enabled: isSuperAdmin,
  });

  const { data: langData } = useQuery({
    queryKey: ['siteLanguage'],
    queryFn: settingsApi.getLanguage,
  });

  const langMutation = useMutation({
    mutationFn: settingsApi.setLanguage,
    onSuccess: (_, lang) => {
      i18n.changeLanguage(lang);
      localStorage.setItem('siteLanguage', lang);
      queryClient.invalidateQueries({ queryKey: ['siteLanguage'] });
    },
  });

  useEffect(() => {
    if (langData?.language) {
      i18n.changeLanguage(langData.language);
      localStorage.setItem('siteLanguage', langData.language);
    }
  }, [langData, i18n]);

  if (isLoading) return <div className="text-center py-12 text-gray-500">{t('common.loading')}</div>;
  if (!stats) return null;

  const tierCounts = tenants ? {
    Basic: tenants.filter(t => t.tier === 'Basic').length,
    Pro: tenants.filter(t => t.tier === 'Pro').length,
    Enterprise: tenants.filter(t => t.tier === 'Enterprise').length,
  } : { Basic: 0, Pro: 0, Enterprise: 0 };

  const statCards = isSuperAdmin ? [
    { label: t('adminDashboard.totalDealers'), value: tenants?.length ?? 0, color: 'bg-indigo-500' },
    { label: '🥉 Basic', value: tierCounts.Basic, color: 'bg-gray-400' },
    { label: '🥈 Pro', value: tierCounts.Pro, color: 'bg-blue-500' },
    { label: '🥇 Enterprise', value: tierCounts.Enterprise, color: 'bg-amber-500' },
  ] : [
    { label: t('adminDashboard.totalCars'), value: stats.totalCars, color: 'bg-blue-500' },
    { label: t('adminDashboard.pendingReview'), value: stats.pendingCars, color: 'bg-yellow-500' },
    { label: t('adminDashboard.activeOffers'), value: stats.activeOffers, color: 'bg-purple-500' },
    { label: t('adminDashboard.activeConsignments'), value: stats.activeConsignments, color: 'bg-green-500' },
  ];

  const statusColors: Record<string, string> = {
    Pending: 'bg-yellow-100 text-yellow-800',
    Reviewed: 'bg-blue-100 text-blue-800',
    Offered: 'bg-purple-100 text-purple-800',
    Consigned: 'bg-indigo-100 text-indigo-800',
    Sold: 'bg-green-100 text-green-800',
    Rejected: 'bg-red-100 text-red-800',
  };

  const TIER_COLORS: Record<string, string> = {
    Basic: 'bg-gray-100 text-gray-700',
    Pro: 'bg-blue-100 text-blue-700',
    Enterprise: 'bg-amber-100 text-amber-700',
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t('adminDashboard.title')}</h1>
        {!isSuperAdmin && (
          <Link to="/admin/consignments" className="text-blue-600 hover:underline text-sm">
            {t('adminDashboard.viewConsignments')}
          </Link>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
        <h2 className="text-lg font-semibold mb-3">{t('adminDashboard.language')}</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => langMutation.mutate('en')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              i18n.language === 'en' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            🇺🇸 {t('adminDashboard.english')}
          </button>
          <button
            onClick={() => langMutation.mutate('es')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              i18n.language === 'es' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            🇪🇸 {t('adminDashboard.spanish')}
          </button>
        </div>
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

      {/* SuperAdmin: show dealers overview */}
      {isSuperAdmin && tenants && tenants.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">{t('adminDashboard.dealersOverview')}</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-3 font-medium">{t('tenants.name')}</th>
                  <th className="pb-3 font-medium">Tier</th>
                  <th className="pb-3 font-medium">{t('tenants.users')}</th>
                  <th className="pb-3 font-medium">{t('tenants.cars')}</th>
                  <th className="pb-3 font-medium">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map((tenant) => (
                  <tr key={tenant.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="py-3 font-medium">{tenant.name}</td>
                    <td className="py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-semibold ${TIER_COLORS[tenant.tier] || 'bg-gray-100'}`}>
                        {tenant.tier}
                      </span>
                    </td>
                    <td className="py-3">{tenant.userCount}</td>
                    <td className="py-3">{tenant.carCount}</td>
                    <td className="py-3">
                      <Link to="/admin/tenants" className="text-blue-600 hover:underline">{t('tenants.manageAdmins')}</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Non-SuperAdmin: show recent submissions */}
      {!isSuperAdmin && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">{t('adminDashboard.recentSubmissions')}</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-3 font-medium">{t('adminDashboard.car')}</th>
                  <th className="pb-3 font-medium">{t('adminDashboard.owner')}</th>
                  <th className="pb-3 font-medium">{t('cars.mileage')}</th>
                  <th className="pb-3 font-medium">{t('adminDashboard.askingPrice')}</th>
                  <th className="pb-3 font-medium">{t('common.status')}</th>
                  <th className="pb-3 font-medium">{t('adminDashboard.submitted')}</th>
                  <th className="pb-3 font-medium">{t('common.actions')}</th>
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
                        {t(`carStatus.${car.status}`)}
                      </span>
                    </td>
                    <td className="py-3 text-gray-500">{new Date(car.createdAt).toLocaleDateString()}</td>
                    <td className="py-3">
                      <Link to={`/admin/cars/${car.id}`} className="text-blue-600 hover:underline">{t('adminDashboard.review')}</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
