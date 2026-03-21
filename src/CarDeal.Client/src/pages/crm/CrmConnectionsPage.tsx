import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { crmApi } from '../../api/crm';
import TierGate from '../../components/common/TierGate';

const PLATFORM_ICONS: Record<string, string> = {
  facebook: '📘',
  craigslist: '📋',
  carscom: '🚗',
  autotrader: '🏷️',
  cargurus: '🦉',
  offerup: '🎁',
};

interface ConnectionForm {
  apiKey: string;
  apiSecret: string;
  accessToken: string;
  accountId: string;
}

const emptyForm: ConnectionForm = { apiKey: '', apiSecret: '', accessToken: '', accountId: '' };

export default function CrmConnectionsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [editingPlatformId, setEditingPlatformId] = useState<number | null>(null);
  const [form, setForm] = useState<ConnectionForm>(emptyForm);
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const isTenantAdmin = user?.role === 'TenantAdmin' || user?.role === 'SuperAdmin';

  const { data: branding } = useQuery({
    queryKey: ['branding'],
    queryFn: crmApi.getBranding,
    enabled: isTenantAdmin,
  });

  const { data: platforms, isLoading: loadingPlatforms } = useQuery({
    queryKey: ['platforms'],
    queryFn: crmApi.getPlatforms,
  });

  const { data: connections, isLoading: loadingConnections } = useQuery({
    queryKey: ['connections'],
    queryFn: crmApi.getConnections,
    enabled: isTenantAdmin,
  });

  const showMsg = (text: string, type: 'success' | 'error') => {
    setMsg({ text, type });
    setTimeout(() => setMsg(null), 3000);
  };

  const createMutation = useMutation({
    mutationFn: (data: { platformId: number } & Partial<ConnectionForm>) =>
      crmApi.createConnection(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connections'] });
      setEditingPlatformId(null);
      setForm(emptyForm);
      showMsg(t('crm.connectionSaved'), 'success');
    },
    onError: () => showMsg('Error', 'error'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      crmApi.updateConnection(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connections'] });
      setEditingPlatformId(null);
      setForm(emptyForm);
      showMsg(t('crm.connectionSaved'), 'success');
    },
    onError: () => showMsg('Error', 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => crmApi.deleteConnection(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connections'] });
      showMsg(t('crm.connectionDeleted'), 'success');
    },
    onError: () => showMsg('Error', 'error'),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isEnabled }: { id: number; isEnabled: boolean }) =>
      crmApi.updateConnection(id, { isEnabled }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connections'] });
    },
  });

  if (!isTenantAdmin) {
    return (
      <div className="text-center py-12 text-gray-500">
        {t('crm.noCrmAccess')}
      </div>
    );
  }

  if (loadingPlatforms || loadingConnections) {
    return <div className="text-center py-12 text-gray-500">{t('common.loading')}</div>;
  }

  const getConnection = (platformId: number) =>
    connections?.find((c: any) => c.platformId === platformId);

  const handleEdit = (platformId: number) => {
    const conn = getConnection(platformId);
    setForm({
      apiKey: '',
      apiSecret: '',
      accessToken: '',
      accountId: conn?.accountId ?? '',
    });
    setEditingPlatformId(platformId);
  };

  const handleConnect = (platformId: number) => {
    setForm(emptyForm);
    setEditingPlatformId(platformId);
  };

  const handleSave = (platformId: number) => {
    const conn = getConnection(platformId);
    const payload: any = {};
    if (form.apiKey) payload.apiKey = form.apiKey;
    if (form.apiSecret) payload.apiSecret = form.apiSecret;
    if (form.accessToken) payload.accessToken = form.accessToken;
    if (form.accountId) payload.accountId = form.accountId;

    if (conn) {
      updateMutation.mutate({ id: conn.id, data: payload });
    } else {
      createMutation.mutate({ platformId, ...payload });
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <TierGate requiredTier="Pro" currentTier={branding?.tier}>
    <div>
      <h1 className="text-2xl font-bold mb-6">{t('crm.platformConnections')}</h1>

      {msg && (
        <p className={`text-sm mb-4 ${msg.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
          {msg.text}
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {platforms?.map((platform: any) => {
          const conn = getConnection(platform.id);
          const icon = PLATFORM_ICONS[platform.slug] ?? '🌐';
          const isEditing = editingPlatformId === platform.id;

          return (
            <div key={platform.id} className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold">
                  {icon} {platform.name}
                </h3>
                {conn && (
                  <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">
                    {t('crm.connected')}
                  </span>
                )}
              </div>

              {platform.description && (
                <p className="text-sm text-gray-500 mb-4">{platform.description}</p>
              )}

              {conn && !isEditing && (
                <div className="flex flex-wrap gap-2 mt-3">
                  <button
                    onClick={() => toggleMutation.mutate({ id: conn.id, isEnabled: !conn.isEnabled })}
                    className={`text-xs px-3 py-1.5 rounded-lg transition ${
                      conn.isEnabled
                        ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                        : 'bg-green-100 text-green-800 hover:bg-green-200'
                    }`}
                  >
                    {conn.isEnabled ? t('crm.disable') : t('crm.enable')}
                  </button>
                  <button
                    onClick={() => handleEdit(platform.id)}
                    className="text-xs px-3 py-1.5 rounded-lg bg-blue-100 text-blue-800 hover:bg-blue-200 transition"
                  >
                    {t('cars.edit')}
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(t('crm.disconnect') + '?')) {
                        deleteMutation.mutate(conn.id);
                      }
                    }}
                    disabled={deleteMutation.isPending}
                    className="text-xs px-3 py-1.5 rounded-lg bg-red-100 text-red-800 hover:bg-red-200 transition disabled:opacity-50"
                  >
                    {t('crm.disconnect')}
                  </button>
                </div>
              )}

              {!conn && !isEditing && (
                <button
                  onClick={() => handleConnect(platform.id)}
                  className="mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm"
                >
                  {t('crm.connect')}
                </button>
              )}

              {isEditing && (
                <div className="mt-4 space-y-3 border-t pt-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">{t('crm.apiKey')}</label>
                    <input
                      type="password"
                      value={form.apiKey}
                      onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">{t('crm.apiSecret')}</label>
                    <input
                      type="password"
                      value={form.apiSecret}
                      onChange={(e) => setForm({ ...form, apiSecret: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">{t('crm.accessToken')}</label>
                    <input
                      type="password"
                      value={form.accessToken}
                      onChange={(e) => setForm({ ...form, accessToken: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">{t('crm.accountId')}</label>
                    <input
                      type="text"
                      value={form.accountId}
                      onChange={(e) => setForm({ ...form, accountId: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSave(platform.id)}
                      disabled={isSaving}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm disabled:opacity-50"
                    >
                      {t('common.save')}
                    </button>
                    <button
                      onClick={() => { setEditingPlatformId(null); setForm(emptyForm); }}
                      className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition text-sm"
                    >
                      {t('common.cancel')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
    </TierGate>
  );
}
