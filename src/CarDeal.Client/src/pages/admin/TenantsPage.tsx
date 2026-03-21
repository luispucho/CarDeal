import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { tenantApi, type Tenant } from '../../api/tenant';

export default function TenantsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [managingUsersId, setManagingUsersId] = useState<number | null>(null);
  const [newUserInput, setNewUserInput] = useState('');

  // Form state for create/edit
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formEmail, setFormEmail] = useState('');

  const { data: tenants, isLoading } = useQuery({
    queryKey: ['tenants'],
    queryFn: tenantApi.list,
  });

  const { data: tenantUsers } = useQuery({
    queryKey: ['tenantUsers', managingUsersId],
    queryFn: () => tenantApi.getUsers(managingUsersId!),
    enabled: managingUsersId != null,
  });

  const createMutation = useMutation({
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
      alert(t('tenants.deleted'));
    },
  });

  const assignUserMutation = useMutation({
    mutationFn: ({ tenantId, userId }: { tenantId: number; userId: string }) =>
      tenantApi.assignUser(tenantId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenantUsers', managingUsersId] });
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      setNewUserInput('');
      alert(t('tenants.userAssigned'));
    },
  });

  const removeUserMutation = useMutation({
    mutationFn: ({ tenantId, userId }: { tenantId: number; userId: string }) =>
      tenantApi.removeUser(tenantId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenantUsers', managingUsersId] });
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      alert(t('tenants.userRemoved'));
    },
  });

  const resetForm = () => {
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
    createMutation.mutate({ name: formName, slug: formSlug, contactEmail: formEmail || undefined });
  };

  const handleUpdate = () => {
    if (editingId == null) return;
    updateMutation.mutate({
      id: editingId,
      data: { name: formName, slug: formSlug, contactEmail: formEmail || undefined },
    });
  };

  const handleDelete = (id: number) => {
    if (window.confirm(t('tenants.confirmDelete'))) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) return <div className="text-center py-12 text-gray-500">{t('common.loading')}</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <Link to="/admin" className="text-blue-600 hover:underline text-sm">← {t('adminDashboard.title')}</Link>
          <h1 className="text-2xl font-bold mt-2">{t('tenants.title')}</h1>
        </div>
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
              <input
                type="text"
                value={formName}
                onChange={e => setFormName(e.target.value)}
                className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('tenants.slug')}</label>
              <input
                type="text"
                value={formSlug}
                onChange={e => setFormSlug(e.target.value)}
                className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('tenants.contactEmail')}</label>
              <input
                type="email"
                value={formEmail}
                onChange={e => setFormEmail(e.target.value)}
                className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={editingId != null ? handleUpdate : handleCreate}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium disabled:opacity-50"
            >
              {editingId != null ? t('common.save') : t('tenants.createTenant')}
            </button>
            <button
              onClick={() => { setShowCreate(false); setEditingId(null); resetForm(); }}
              className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200 transition text-sm"
            >
              {t('common.cancel')}
            </button>
          </div>
        </div>
      )}

      {/* Tenant Cards */}
      {!tenants?.length ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm text-gray-500">
          {t('tenants.noTenants')}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tenants.map(tenant => (
            <div key={tenant.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{tenant.name}</h3>
                  <p className="text-sm text-gray-500">/{tenant.slug}</p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => startEdit(tenant)}
                    className="text-blue-600 hover:text-blue-800 text-sm px-2 py-1 rounded hover:bg-blue-50 transition"
                  >
                    {t('cars.edit')}
                  </button>
                  <button
                    onClick={() => handleDelete(tenant.id)}
                    className="text-red-600 hover:text-red-800 text-sm px-2 py-1 rounded hover:bg-red-50 transition"
                  >
                    {t('common.delete')}
                  </button>
                </div>
              </div>

              {tenant.contactEmail && (
                <p className="text-sm text-gray-500 mb-3">✉ {tenant.contactEmail}</p>
              )}

              <div className="flex gap-4 text-sm mb-4">
                <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-medium">
                  {tenant.userCount} {t('tenants.users')}
                </span>
                <span className="bg-green-50 text-green-700 px-3 py-1 rounded-full font-medium">
                  {tenant.carCount} {t('tenants.cars')}
                </span>
              </div>

              <button
                onClick={() => setManagingUsersId(managingUsersId === tenant.id ? null : tenant.id)}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                {t('tenants.manageUsers')} {managingUsersId === tenant.id ? '▲' : '▼'}
              </button>

              {/* Manage Users Section */}
              {managingUsersId === tenant.id && (
                <div className="mt-4 border-t pt-4">
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={newUserInput}
                      onChange={e => setNewUserInput(e.target.value)}
                      placeholder={t('tenants.userIdPlaceholder')}
                      className="flex-1 border rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <button
                      onClick={() => {
                        if (newUserInput.trim()) {
                          assignUserMutation.mutate({ tenantId: tenant.id, userId: newUserInput.trim() });
                        }
                      }}
                      disabled={assignUserMutation.isPending}
                      className="bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition text-sm disabled:opacity-50"
                    >
                      {t('tenants.assignUser')}
                    </button>
                  </div>

                  {tenantUsers && tenantUsers.length > 0 ? (
                    <ul className="space-y-2">
                      {tenantUsers.map((u: any) => (
                        <li key={u.id} className="flex justify-between items-center bg-gray-50 rounded-lg px-3 py-2 text-sm">
                          <span>{u.fullName ?? u.email ?? u.id}</span>
                          <button
                            onClick={() => removeUserMutation.mutate({ tenantId: tenant.id, userId: u.id })}
                            className="text-red-500 hover:text-red-700 text-xs"
                          >
                            ✕
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-400">{t('tenants.noTenants')}</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
