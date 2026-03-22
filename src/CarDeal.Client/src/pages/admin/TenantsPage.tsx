import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { tenantApi, type Tenant } from '../../api/tenant';

const TIER_COLORS: Record<string, string> = {
  Basic: 'bg-gray-100 text-gray-700',
  Pro: 'bg-blue-100 text-blue-700',
  Enterprise: 'bg-amber-100 text-amber-700',
};

export default function TenantsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showingAdminId, setShowingAdminId] = useState<number | null>(null);
  const [newPasswordInfo, setNewPasswordInfo] = useState<{ tenantId: number; password: string } | null>(null);

  // Filters
  const [searchName, setSearchName] = useState('');
  const [filterTier, setFilterTier] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Form state for create/edit
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formEmail, setFormEmail] = useState('');

  const { data: tenants, isLoading } = useQuery({
    queryKey: ['tenants'],
    queryFn: tenantApi.list,
  });

  const createMutation= useMutation({
    mutationFn: tenantApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      setShowCreate(false);
      resetForm();
      alert(t('tenants.created'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name?: string; slug?: string; contactEmail?: string } }) =>
      tenantApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      setEditingId(null);
      resetForm();
      alert(t('tenants.updated'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: tenantApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      alert(t('tenants.permanentlyDeleted'));
    },
  });

  const activateMutation = useMutation({
    mutationFn: tenantApi.activate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      alert(t('tenants.activated'));
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: tenantApi.deactivate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      alert(t('tenants.deactivated'));
    },
  });

  const resetPwdMutation = useMutation({
    mutationFn: tenantApi.resetPassword,
    onSuccess: (data, tenantId) => {
      setNewPasswordInfo({ tenantId, password: data.newPassword });
    },
  });

  const sendCredsMutation = useMutation({
    mutationFn: tenantApi.sendCredentials,
    onSuccess: () => alert(t('tenants.credentialsSent')),
  });

  const handleResetPassword = (tenantId: number) => {
    resetPwdMutation.mutate(tenantId);
  };

  const handleSendCredentials = (tenantId: number) => {
    sendCredsMutation.mutate(tenantId);
  };

  const resetForm= () => {
    setFormName('');
    setFormSlug('');
    setFormEmail('');
  };

  const startEdit = (tenant: Tenant) => {
    setEditingId(tenant.id);
    setFormName(tenant.name);
    setFormSlug(tenant.slug);
    setFormEmail(tenant.contactEmail ?? '');
    setShowCreate(false);
  };

  const handleCreate = () => {
    if (!formSlug.trim()) { alert(t('tenants.slugRequired')); return; }
    const slugTaken = tenants?.some(t => t.slug.toLowerCase() === formSlug.trim().toLowerCase());
    if (slugTaken) { alert(t('tenants.slugTaken')); return; }
    createMutation.mutate({ name: formName, slug: formSlug.trim(), contactEmail: formEmail || undefined });
  };

  const handleUpdate = () => {
    if (editingId == null) return;
    const slugTaken = tenants?.some(t => t.id !== editingId && t.slug.toLowerCase() === formSlug.trim().toLowerCase());
    if (slugTaken) { alert(t('tenants.slugTaken')); return; }
    updateMutation.mutate({
      id: editingId,
      data: { name: formName, slug: formSlug.trim(), contactEmail: formEmail || undefined },
    });
  };

  const handleDelete = (id: number) => {
    if (window.confirm(t('tenants.confirmHardDelete'))) {
      if (window.confirm(t('tenants.confirmHardDelete'))) {
        deleteMutation.mutate(id);
      }
    }
  };

  const handleDeactivate = (id: number) => {
    if (window.confirm(t('tenants.confirmDeactivate'))) {
      deactivateMutation.mutate(id);
    }
  };

  const handleActivate = (id: number) => {
    activateMutation.mutate(id);
  };

  const handleTierChange = async (tenantId: number, tier: string) => {
    try {
      const { default: apiClient } = await import('../../api/client');
      await apiClient.put(`/tenant/${tenantId}/tier`, { tier });
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
    } catch { /* ignore */ }
  };

  if (isLoading) return <div className="text-center py-12 text-gray-500">{t('common.loading')}</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">🏪 {t('nav.dealers')}</h1>
        <button
          onClick={() => { setShowCreate(!showCreate); setEditingId(null); resetForm(); }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium"
        >
          + {t('tenants.createTenant')}
        </button>
      </div>

      {/* Create / Edit Form */}
      {(showCreate || editingId != null) && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-lg font-bold mb-4">
            {editingId != null ? t('cars.edit') : t('tenants.createTenant')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('tenants.name')}</label>
              <input type="text" value={formName} onChange={e => setFormName(e.target.value)}
                className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('tenants.slug')}</label>
              <input type="text" value={formSlug} onChange={e => setFormSlug(e.target.value)}
                className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('tenants.contactEmail')}</label>
              <input type="email" value={formEmail} onChange={e => setFormEmail(e.target.value)}
                className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={editingId != null ? handleUpdate : handleCreate}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium disabled:opacity-50">
              {editingId != null ? t('common.save') : t('tenants.createTenant')}
            </button>
            <button onClick={() => { setShowCreate(false); setEditingId(null); resetForm(); }}
              className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200 transition text-sm">
              {t('common.cancel')}
            </button>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            type="text"
            value={searchName}
            onChange={e => setSearchName(e.target.value)}
            placeholder={`🔍 ${t('tenants.searchByName')}`}
            className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <select
            value={filterTier}
            onChange={e => setFilterTier(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">{t('tenants.allTiers')}</option>
            <option value="Basic">🥉 Basic</option>
            <option value="Pro">🥈 Pro</option>
            <option value="Enterprise">🥇 Enterprise</option>
          </select>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">{t('tenants.allStatuses')}</option>
            <option value="active">{t('tenants.active')}</option>
            <option value="inactive">{t('tenants.inactive')}</option>
          </select>
        </div>
      </div>

      {/* Dealer Cards */}
      {(() => {
        const filtered = (tenants ?? []).filter(t => {
          if (searchName && !t.name.toLowerCase().includes(searchName.toLowerCase())) return false;
          if (filterTier && t.tier !== filterTier) return false;
          if (filterStatus === 'active' && !t.isActive) return false;
          if (filterStatus === 'inactive' && t.isActive) return false;
          return true;
        });
        return !filtered.length ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm text-gray-500">
          {t('tenants.noTenants')}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(tenant => (
            <div key={tenant.id} className={`bg-white rounded-xl shadow-sm border p-6 relative ${tenant.isActive ? 'border-gray-100' : 'border-red-300 opacity-60'}`}>
              {!tenant.isActive && (
                <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded">
                  PAUSED
                </span>
              )}
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-gray-900">{tenant.name}</h3>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${tenant.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {tenant.isActive ? t('tenants.active') : t('tenants.inactive')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">/{tenant.slug}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => startEdit(tenant)}
                    className="text-blue-600 hover:text-blue-800 text-sm px-2 py-1 rounded hover:bg-blue-50 transition">
                    {t('cars.edit')}
                  </button>
                </div>
              </div>

              {tenant.contactEmail && (
                <p className="text-sm text-gray-500 mb-3">✉ {tenant.contactEmail}</p>
              )}

              {/* Tier selector */}
              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-500 mb-1">Tier</label>
                <select
                  value={tenant.tier}
                  onChange={e => handleTierChange(tenant.id, e.target.value)}
                  className={`text-sm font-semibold px-3 py-1.5 rounded-lg border-0 cursor-pointer ${TIER_COLORS[tenant.tier] || 'bg-gray-100'}`}
                >
                  <option value="Basic">🥉 Basic</option>
                  <option value="Pro">🥈 Pro</option>
                  <option value="Enterprise">🥇 Enterprise</option>
                </select>
              </div>

              <div className="flex gap-4 text-sm mb-4">
                <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-medium">
                  {tenant.userCount} {t('tenants.users')}
                </span>
                <span className="bg-green-50 text-green-700 px-3 py-1 rounded-full font-medium">
                  {tenant.carCount} {t('tenants.cars')}
                </span>
              </div>

              {/* Activate / Deactivate / Hard Delete actions */}
              <div className="flex gap-2 mb-4">
                {tenant.isActive ? (
                  <button
                    onClick={() => handleDeactivate(tenant.id)}
                    disabled={deactivateMutation.isPending}
                    className="text-xs font-medium px-3 py-1.5 rounded-lg bg-yellow-100 text-yellow-800 hover:bg-yellow-200 transition disabled:opacity-50"
                  >
                    ⏸ {t('tenants.deactivate')}
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => handleActivate(tenant.id)}
                      disabled={activateMutation.isPending}
                      className="text-xs font-medium px-3 py-1.5 rounded-lg bg-green-100 text-green-800 hover:bg-green-200 transition disabled:opacity-50"
                    >
                      ▶ {t('tenants.activate')}
                    </button>
                    <button
                      onClick={() => handleDelete(tenant.id)}
                      disabled={deleteMutation.isPending}
                      className="text-xs font-medium px-3 py-1.5 rounded-lg bg-red-100 text-red-800 hover:bg-red-200 transition disabled:opacity-50"
                    >
                      🗑 {t('common.delete')}
                    </button>
                  </>
                )}
              </div>

              <button
                onClick={() => setShowingAdminId(showingAdminId === tenant.id ? null : tenant.id)}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                {t('tenants.adminAccount')} {showingAdminId === tenant.id ? '▲' : '▼'}
              </button>

              {/* Admin Account Section */}
              {showingAdminId === tenant.id && (
                <div className="mt-4 border-t pt-4">
                  <div className="mb-3">
                    <p className="text-xs text-gray-500 mb-1">{t('tenants.adminEmail')}</p>
                    <p className="text-sm font-medium">{tenant.contactEmail}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleResetPassword(tenant.id)} disabled={resetPwdMutation.isPending}
                      className="text-xs font-medium px-3 py-1.5 rounded-lg bg-blue-100 text-blue-800 hover:bg-blue-200 transition disabled:opacity-50">
                      🔑 {t('tenants.resetPassword')}
                    </button>
                    <button onClick={() => handleSendCredentials(tenant.id)} disabled={sendCredsMutation.isPending}
                      className="text-xs font-medium px-3 py-1.5 rounded-lg bg-green-100 text-green-800 hover:bg-green-200 transition disabled:opacity-50">
                      📧 {t('tenants.sendCredentials')}
                    </button>
                  </div>
                  {newPasswordInfo && newPasswordInfo.tenantId === tenant.id && (
                    <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <p className="text-xs text-yellow-800 font-medium mb-1">{t('tenants.newPasswordGenerated')}</p>
                      <p className="text-sm font-mono bg-white px-2 py-1 rounded border">{newPasswordInfo.password}</p>
                      <p className="text-xs text-yellow-600 mt-1">{t('tenants.savePasswordWarning')}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      );
      })()}
    </div>
  );
}
