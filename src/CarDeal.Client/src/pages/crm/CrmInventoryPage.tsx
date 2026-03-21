import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { crmApi } from '../../api/crm';

function formatCurrency(value?: number) {
  if (value == null) return '—';
  return `$${value.toLocaleString()}`;
}

export default function CrmInventoryPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data: cars, isLoading } = useQuery({
    queryKey: ['crmInventory'],
    queryFn: crmApi.getInventory,
  });

  if (isLoading) return <div className="text-center py-12 text-gray-500">{t('common.loading')}</div>;

  const statusColors: Record<string, string> = {
    Pending: 'bg-yellow-100 text-yellow-800',
    Reviewed: 'bg-blue-100 text-blue-800',
    Offered: 'bg-purple-100 text-purple-800',
    Consigned: 'bg-indigo-100 text-indigo-800',
    Sold: 'bg-green-100 text-green-800',
    Rejected: 'bg-red-100 text-red-800',
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{t('crm.inventory')}</h1>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b bg-gray-50">
                <th className="px-4 py-3 font-medium">{t('crm.car')}</th>
                <th className="px-4 py-3 font-medium">{t('crm.status')}</th>
                <th className="px-4 py-3 font-medium">{t('crm.listingType')}</th>
                <th className="px-4 py-3 font-medium text-right">{t('crm.purchasePrice')}</th>
                <th className="px-4 py-3 font-medium text-right">{t('crm.salePrice')}</th>
                <th className="px-4 py-3 font-medium text-right">{t('crm.expenses')}</th>
                <th className="px-4 py-3 font-medium text-right">{t('crm.profit')}</th>
                <th className="px-4 py-3 font-medium">{t('crm.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {cars?.map((car) => {
                const purchasePrice = car.financials?.purchasePrice;
                const salePrice = car.financials?.salePrice;
                const totalExpenses = car.totalExpenses;
                const profit =
                  purchasePrice != null && salePrice != null
                    ? salePrice - purchasePrice - totalExpenses
                    : null;

                const primaryImage = car.images.find((img) => img.isPrimary) ?? car.images[0];

                return (
                  <tr
                    key={car.id}
                    onClick={() => navigate(`/crm/inventory/${car.id}`)}
                    className="border-b last:border-0 hover:bg-gray-50 cursor-pointer transition"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {primaryImage ? (
                          <img
                            src={primaryImage.blobUrl}
                            alt=""
                            className="w-12 h-9 object-cover rounded"
                          />
                        ) : (
                          <div className="w-12 h-9 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs">
                            —
                          </div>
                        )}
                        <span className="font-medium whitespace-nowrap">
                          {car.year} {car.make} {car.model}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${statusColors[car.status] || 'bg-gray-100'}`}>
                        {t(`carStatus.${car.status}`, car.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {t(`listingType.${car.listingType}`, car.listingType)}
                    </td>
                    <td className="px-4 py-3 text-right">{formatCurrency(purchasePrice)}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(salePrice)}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(totalExpenses)}</td>
                    <td className={`px-4 py-3 text-right font-medium ${
                      profit == null ? '' : profit >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {profit != null ? formatCurrency(profit) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/crm/inventory/${car.id}`);
                        }}
                        className="text-blue-600 hover:underline text-sm"
                      >
                        {t('crm.view')}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {(!cars || cars.length === 0) && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    {t('crm.totalCars')}: 0
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
