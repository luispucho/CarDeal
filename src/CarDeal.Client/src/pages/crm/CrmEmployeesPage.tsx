import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { crmApi } from '../../api/crm';

export default function CrmEmployeesPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');

  const isTenantAdmin = user?.role === 'TenantAdmin' || user?.role === 'SuperAdmin';

  const { data: employees, isLoading } = useQuery({
    queryKey: ['crmEmployees'],
    queryFn: crmApi.getEmployees,
    enabled: isTenantAdmin,
  });

  const addMutation = useMutation({
    mutationFn: () => crmApi.addEmployee({ email }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crmEmployees'] });
      setEmail('');
      setMsg(t('crm.employeeAdded'));
      setTimeout(() => setMsg(''), 3000);
    },
  });

  const removeMutation = useMutation({
    mutationFn: (userId: string) => crmApi.removeEmployee(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crmEmployees'] });
      setMsg(t('crm.employeeRemoved'));
      setTimeout(() => setMsg(''), 3000);
    },
  });

  if (!isTenantAdmin) {
    return (
      <div className="text-center py-12 text-gray-500">
        {t('crm.noCrmAccess')}
      </div>
    );
  }

  if (isLoading) return <div className="text-center py-12 text-gray-500">{t('common.loading')}</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{t('crm.employees')}</h1>

      {/* Add Employee */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold mb-3">{t('crm.addEmployee')}</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (email.trim()) addMutation.mutate();
          }}
          className="flex gap-3"
        >
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('crm.employeeEmail')}
            className="flex-1 border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
          <button
            type="submit"
            disabled={addMutation.isPending || !email.trim()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm disabled:opacity-50"
          >
            {t('crm.addEmployee')}
          </button>
        </form>
        {msg && <p className="text-green-600 text-sm mt-2">{msg}</p>}
        {addMutation.isError && (
          <p className="text-red-600 text-sm mt-2">
            {(addMutation.error as Error)?.message || 'Error'}
          </p>
        )}
      </div>

      {/* Employee List */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b bg-gray-50">
                <th className="px-4 py-3 font-medium">{t('auth.fullName')}</th>
                <th className="px-4 py-3 font-medium">{t('common.email')}</th>
                <th className="px-4 py-3 font-medium">{t('crm.status')}</th>
                <th className="px-4 py-3 font-medium">{t('crm.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {employees && employees.length > 0 ? (
                employees.map((emp) => (
                  <tr key={emp.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{emp.fullName}</td>
                    <td className="px-4 py-3 text-gray-600">{emp.email}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                        {emp.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => {
                          if (window.confirm(t('crm.confirmRemoveEmployee'))) {
                            removeMutation.mutate(emp.id);
                          }
                        }}
                        className="text-red-600 hover:underline text-sm"
                        disabled={removeMutation.isPending}
                      >
                        {t('common.delete')}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                    {t('crm.noEmployees')}
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
