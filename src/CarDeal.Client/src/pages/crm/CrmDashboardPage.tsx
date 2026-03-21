import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { crmApi } from '../../api/crm';

function formatCurrency(value: number) {
  return `$${value.toLocaleString()}`;
}

function TenantDashboard() {
  const { t } = useTranslation();
  const { data: stats, isLoading } = useQuery({
    queryKey: ['crmTenantStats'],
    queryFn: crmApi.getTenantStats,
  });

  if (isLoading) return <div className="text-center py-12 text-gray-500">{t('common.loading')}</div>;
  if (!stats) return null;

  const statCards = [
    { label: t('crm.totalCars'), value: stats.totalCars, color: 'bg-blue-500' },
    { label: t('crm.soldCars'), value: stats.soldCars, color: 'bg-green-500' },
    { label: t('crm.consignedCars'), value: stats.consignedCars, color: 'bg-purple-500' },
    { label: t('crm.pendingCars'), value: stats.pendingCars, color: 'bg-yellow-500' },
    { label: t('crm.activeInventory'), value: stats.activeInventory, color: 'bg-indigo-500' },
  ];

  const financeCards = [
    { label: t('crm.totalRevenue'), value: formatCurrency(stats.totalRevenue), color: 'bg-green-500' },
    { label: t('crm.totalExpenses'), value: formatCurrency(stats.totalExpenses), color: 'bg-red-500' },
    { label: t('crm.totalProfit'), value: formatCurrency(stats.totalProfit), color: stats.totalProfit >= 0 ? 'bg-green-500' : 'bg-red-500' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{t('crm.tenantStats')}</h1>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl shadow-sm p-5">
            <p className="text-sm text-gray-500">{card.label}</p>
            <p className="text-3xl font-bold mt-1">{card.value}</p>
            <div className={`h-1 ${card.color} rounded mt-3 w-12`} />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {financeCards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl shadow-sm p-5">
            <p className="text-sm text-gray-500">{card.label}</p>
            <p className="text-3xl font-bold mt-1">{card.value}</p>
            <div className={`h-1 ${card.color} rounded mt-3 w-12`} />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Profitable Cars */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">{t('crm.topProfitable')}</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-3 font-medium">{t('crm.car')}</th>
                  <th className="pb-3 font-medium text-right">{t('crm.profit')}</th>
                </tr>
              </thead>
              <tbody>
                {stats.topProfitableCars.map((car) => (
                  <tr key={car.carId} className="border-b last:border-0">
                    <td className="py-3">{car.carName}</td>
                    <td className={`py-3 text-right font-medium ${(car.profit ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {car.profit != null ? formatCurrency(car.profit) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Expense Breakdown */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">{t('crm.expenseBreakdown')}</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-3 font-medium">{t('crm.type')}</th>
                  <th className="pb-3 font-medium text-right">{t('crm.total')}</th>
                </tr>
              </thead>
              <tbody>
                {stats.expensesByType.map((expense) => (
                  <tr key={expense.type} className="border-b last:border-0">
                    <td className="py-3">{t(`crm.${expense.type.toLowerCase()}`, expense.type)}</td>
                    <td className="py-3 text-right font-medium">{formatCurrency(expense.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Monthly Sales */}
      <div className="bg-white rounded-xl shadow-sm p-6 mt-6">
        <h2 className="text-lg font-semibold mb-4">{t('crm.monthlySales')}</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-3 font-medium">{t('crm.month')}</th>
                <th className="pb-3 font-medium text-right">{t('crm.count')}</th>
                <th className="pb-3 font-medium text-right">{t('crm.revenue')}</th>
              </tr>
            </thead>
            <tbody>
              {stats.monthlySales.map((m) => (
                <tr key={m.month} className="border-b last:border-0">
                  <td className="py-3">{m.month}</td>
                  <td className="py-3 text-right">{m.count}</td>
                  <td className="py-3 text-right font-medium">{formatCurrency(m.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function PlatformDashboard() {
  const { t } = useTranslation();
  const { data: stats, isLoading } = useQuery({
    queryKey: ['crmPlatformStats'],
    queryFn: crmApi.getPlatformStats,
  });

  if (isLoading) return <div className="text-center py-12 text-gray-500">{t('common.loading')}</div>;
  if (!stats) return null;

  const statCards = [
    { label: t('crm.totalTenants'), value: stats.totalTenants, color: 'bg-blue-500' },
    { label: t('crm.totalCars'), value: stats.totalCars, color: 'bg-indigo-500' },
    { label: t('crm.totalSold'), value: stats.totalSold, color: 'bg-green-500' },
    { label: t('crm.totalActive'), value: stats.totalActive, color: 'bg-yellow-500' },
    { label: t('crm.totalRevenue'), value: formatCurrency(stats.totalRevenue), color: 'bg-emerald-500' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{t('crm.platformStats')}</h1>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl shadow-sm p-5">
            <p className="text-sm text-gray-500">{card.label}</p>
            <p className="text-3xl font-bold mt-1">{card.value}</p>
            <div className={`h-1 ${card.color} rounded mt-3 w-12`} />
          </div>
        ))}
      </div>

      {/* Sales by Tenant */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">{t('crm.salesByTenant')}</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-3 font-medium">{t('crm.tenant')}</th>
                <th className="pb-3 font-medium text-right">{t('crm.cars')}</th>
                <th className="pb-3 font-medium text-right">{t('crm.sold')}</th>
                <th className="pb-3 font-medium text-right">{t('crm.revenue')}</th>
              </tr>
            </thead>
            <tbody>
              {stats.salesByTenant.map((tenant) => (
                <tr key={tenant.tenantId} className="border-b last:border-0">
                  <td className="py-3 font-medium">{tenant.tenantName}</td>
                  <td className="py-3 text-right">{tenant.totalCars}</td>
                  <td className="py-3 text-right">{tenant.soldCars}</td>
                  <td className="py-3 text-right font-medium">{formatCurrency(tenant.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Brands */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">{t('crm.topBrands')}</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-3 font-medium">{t('crm.brand')}</th>
                <th className="pb-3 font-medium text-right">{t('crm.count')}</th>
                <th className="pb-3 font-medium text-right">{t('crm.sold')}</th>
              </tr>
            </thead>
            <tbody>
              {stats.topBrands.map((brand) => (
                <tr key={brand.make} className="border-b last:border-0">
                  <td className="py-3 font-medium">{brand.make}</td>
                  <td className="py-3 text-right">{brand.count}</td>
                  <td className="py-3 text-right">{brand.soldCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function CrmDashboardPage() {
  const { isSuperAdmin } = useAuth();
  return isSuperAdmin ? <PlatformDashboard /> : <TenantDashboard />;
}
