import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { crmApi, type InvestorResponse } from '../../api/crm';

// ── Schemas ──

const investorSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  notes: z.string().optional(),
});
type InvestorForm = z.infer<typeof investorSchema>;

const contributionSchema = z.object({
  type: z.string().min(1),
  amount: z.coerce.number().positive(),
  description: z.string().optional(),
  carId: z.coerce.number().optional(),
});
type ContributionForm = z.infer<typeof contributionSchema>;

const editInvestorSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  notes: z.string().optional(),
});
type EditInvestorForm = z.infer<typeof editInvestorSchema>;

function formatCurrency(value?: number) {
  if (value == null) return '—';
  return `$${Math.abs(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const CONTRIBUTION_TYPES = ['Investment', 'Return', 'Profit', 'Withdrawal'];

const TYPE_COLORS: Record<string, string> = {
  Investment: 'bg-green-100 text-green-800',
  Return: 'bg-blue-100 text-blue-800',
  Profit: 'bg-purple-100 text-purple-800',
  Withdrawal: 'bg-red-100 text-red-800',
};

// ── Investor Detail ──

function InvestorDetail({
  investor,
  onClose,
}: {
  investor: InvestorResponse;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [msg, setMsg] = useState('');
  const [editing, setEditing] = useState(false);

  const { data: contributions } = useQuery({
    queryKey: ['contributions', investor.id],
    queryFn: () => crmApi.getContributions(investor.id),
  });

  const { data: cars } = useQuery({
    queryKey: ['crmInventory'],
    queryFn: () => crmApi.getInventory(),
  });

  const editForm = useForm<EditInvestorForm>({
    resolver: zodResolver(editInvestorSchema) as Resolver<EditInvestorForm>,
    values: {
      name: investor.name,
      email: investor.email ?? '',
      phone: investor.phone ?? '',
      notes: investor.notes ?? '',
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: EditInvestorForm) =>
      crmApi.updateInvestor(investor.id, {
        name: data.name,
        email: data.email || undefined,
        phone: data.phone || undefined,
        notes: data.notes || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investors'] });
      setEditing(false);
    },
  });

  const contributionForm = useForm<ContributionForm>({
    resolver: zodResolver(contributionSchema) as Resolver<ContributionForm>,
    defaultValues: { type: 'Investment', amount: 0, description: '' },
  });

  const addContributionMutation = useMutation({
    mutationFn: (data: ContributionForm) =>
      crmApi.addContribution(investor.id, {
        amount: data.amount,
        type: data.type,
        description: data.description || undefined,
        carId: data.carId || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contributions', investor.id] });
      queryClient.invalidateQueries({ queryKey: ['investors'] });
      contributionForm.reset({ type: 'Investment', amount: 0, description: '' });
      setMsg(t('crm.contributionAdded'));
      setTimeout(() => setMsg(''), 3000);
    },
  });

  // Running balance calculation
  let runningBalance = 0;
  const sortedContributions = [...(contributions ?? [])].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  const withBalance = sortedContributions.map((c) => {
    runningBalance += c.amount;
    return { ...c, runningBalance };
  });

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border-l-4 border-blue-500">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          {editing ? (
            <form
              onSubmit={editForm.handleSubmit((data) => updateMutation.mutate(data))}
              className="space-y-3"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  {...editForm.register('name')}
                  className="border rounded-lg px-3 py-2 text-sm"
                  placeholder={t('crm.investorName')}
                />
                <input
                  {...editForm.register('email')}
                  type="email"
                  className="border rounded-lg px-3 py-2 text-sm"
                  placeholder={t('common.email')}
                />
                <input
                  {...editForm.register('phone')}
                  className="border rounded-lg px-3 py-2 text-sm"
                  placeholder={t('common.phone')}
                />
                <input
                  {...editForm.register('notes')}
                  className="border rounded-lg px-3 py-2 text-sm"
                  placeholder={t('crm.notes')}
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
                >
                  {t('common.save')}
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="text-gray-600 px-3 py-1.5 rounded-lg text-sm hover:bg-gray-100"
                >
                  {t('common.cancel')}
                </button>
              </div>
            </form>
          ) : (
            <div>
              <h2 className="text-xl font-bold">{investor.name}</h2>
              <div className="text-sm text-gray-600 space-x-4 mt-1">
                {investor.email && <span>✉️ {investor.email}</span>}
                {investor.phone && <span>📱 {investor.phone}</span>}
              </div>
              {investor.notes && (
                <p className="text-sm text-gray-500 mt-1">{investor.notes}</p>
              )}
              <button
                onClick={() => setEditing(true)}
                className="text-blue-600 hover:underline text-sm mt-2"
              >
                ✏️ {t('cars.edit')}
              </button>
            </div>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 text-xl ml-4"
        >
          ✕
        </button>
      </div>

      {/* Balance summary */}
      <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="text-center">
          <p className="text-xs text-gray-500">{t('crm.totalInvested')}</p>
          <p className="text-lg font-bold text-green-600">
            💰 {formatCurrency(investor.totalInvested)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500">{t('crm.totalReturned')}</p>
          <p className="text-lg font-bold text-blue-600">
            💸 {formatCurrency(investor.totalReturned)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500">{t('crm.balance')}</p>
          <p className={`text-lg font-bold ${investor.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            📊 {investor.balance >= 0 ? '' : '-'}{formatCurrency(investor.balance)}
          </p>
        </div>
      </div>

      {/* Contributions table */}
      <h3 className="text-lg font-semibold mb-3">{t('crm.contributions')}</h3>
      {msg && <p className="text-green-600 text-sm mb-3">{msg}</p>}

      <div className="overflow-x-auto mb-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="pb-3 font-medium">{t('crm.date')}</th>
              <th className="pb-3 font-medium">{t('crm.contributionType')}</th>
              <th className="pb-3 font-medium text-right">{t('crm.amount')}</th>
              <th className="pb-3 font-medium">{t('crm.description')}</th>
              <th className="pb-3 font-medium">{t('crm.car')}</th>
              <th className="pb-3 font-medium text-right">{t('crm.balance')}</th>
            </tr>
          </thead>
          <tbody>
            {withBalance.length > 0 ? (
              withBalance.map((c) => (
                <tr key={c.id} className="border-b last:border-0">
                  <td className="py-3 text-gray-500">
                    {new Date(c.date).toLocaleDateString()}
                  </td>
                  <td className="py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${TYPE_COLORS[c.type] || 'bg-gray-100'}`}>
                      {t(`crm.${c.type.toLowerCase()}`, c.type)}
                    </span>
                  </td>
                  <td className={`py-3 text-right font-medium ${c.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {c.amount >= 0 ? '+' : ''}{formatCurrency(c.amount)}
                  </td>
                  <td className="py-3 text-gray-600">{c.description || '—'}</td>
                  <td className="py-3 text-gray-600">{c.carName || '—'}</td>
                  <td className={`py-3 text-right font-medium ${c.runningBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {c.runningBalance >= 0 ? '' : '-'}{formatCurrency(c.runningBalance)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="py-6 text-center text-gray-500">
                  {t('crm.noContributions')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Contribution Form */}
      <form
        onSubmit={contributionForm.handleSubmit((data) =>
          addContributionMutation.mutate(data)
        )}
        className="flex flex-wrap gap-3 items-end border-t pt-4"
      >
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            {t('crm.contributionType')}
          </label>
          <select
            {...contributionForm.register('type')}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            {CONTRIBUTION_TYPES.map((type) => (
              <option key={type} value={type}>
                {t(`crm.${type.toLowerCase()}`, type)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            {t('crm.amount')}
          </label>
          <input
            type="number"
            step="0.01"
            {...contributionForm.register('amount')}
            className="border rounded-lg px-3 py-2 text-sm w-28"
            placeholder="0.00"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            {t('crm.description')}
          </label>
          <input
            type="text"
            {...contributionForm.register('description')}
            className="border rounded-lg px-3 py-2 text-sm w-48"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            {t('crm.car')}
          </label>
          <select
            {...contributionForm.register('carId')}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            <option value="">—</option>
            {cars?.map((car) => (
              <option key={car.id} value={car.id}>
                {car.year} {car.make} {car.model}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          disabled={addContributionMutation.isPending}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm disabled:opacity-50"
        >
          {t('crm.addContribution')}
        </button>
      </form>
    </div>
  );
}

// ── Main Page ──

export default function CrmInvestorsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [msg, setMsg] = useState('');
  const [selectedInvestorId, setSelectedInvestorId] = useState<number | null>(null);

  const { data: investors, isLoading } = useQuery({
    queryKey: ['investors'],
    queryFn: crmApi.getInvestors,
  });

  const investorForm = useForm<InvestorForm>({
    resolver: zodResolver(investorSchema) as Resolver<InvestorForm>,
    defaultValues: { name: '', email: '', phone: '', notes: '' },
  });

  const createMutation = useMutation({
    mutationFn: (data: InvestorForm) =>
      crmApi.createInvestor({
        name: data.name,
        email: data.email || undefined,
        phone: data.phone || undefined,
        notes: data.notes || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investors'] });
      investorForm.reset({ name: '', email: '', phone: '', notes: '' });
      setMsg(t('crm.investorCreated'));
      setTimeout(() => setMsg(''), 3000);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => crmApi.deleteInvestor(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investors'] });
      setSelectedInvestorId(null);
      setMsg(t('crm.investorDeleted'));
      setTimeout(() => setMsg(''), 3000);
    },
  });

  if (isLoading)
    return (
      <div className="text-center py-12 text-gray-500">{t('common.loading')}</div>
    );

  const selectedInvestor = investors?.find((i) => i.id === selectedInvestorId);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">💰 {t('crm.investors')}</h1>

      {/* Add Investor Form */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold mb-3">{t('crm.addInvestor')}</h2>
        <form
          onSubmit={investorForm.handleSubmit((data) => createMutation.mutate(data))}
          className="flex flex-wrap gap-3 items-end"
        >
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              {t('crm.investorName')} *
            </label>
            <input
              {...investorForm.register('name')}
              className="border rounded-lg px-3 py-2 text-sm w-48"
              placeholder={t('crm.investorName')}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              {t('common.email')}
            </label>
            <input
              type="email"
              {...investorForm.register('email')}
              className="border rounded-lg px-3 py-2 text-sm w-48"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              {t('common.phone')}
            </label>
            <input
              {...investorForm.register('phone')}
              className="border rounded-lg px-3 py-2 text-sm w-40"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              {t('crm.notes')}
            </label>
            <input
              {...investorForm.register('notes')}
              className="border rounded-lg px-3 py-2 text-sm w-48"
            />
          </div>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm disabled:opacity-50"
          >
            {t('crm.addInvestor')}
          </button>
        </form>
        {msg && <p className="text-green-600 text-sm mt-2">{msg}</p>}
        {createMutation.isError && (
          <p className="text-red-600 text-sm mt-2">
            {(createMutation.error as Error)?.message || 'Error'}
          </p>
        )}
      </div>

      {/* Investor Detail (expanded) */}
      {selectedInvestor && (
        <InvestorDetail
          investor={selectedInvestor}
          onClose={() => setSelectedInvestorId(null)}
        />
      )}

      {/* Investor Cards */}
      {investors && investors.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {investors.map((investor) => (
            <div
              key={investor.id}
              className={`bg-white rounded-xl shadow-sm p-5 border transition ${
                selectedInvestorId === investor.id
                  ? 'border-blue-500 ring-2 ring-blue-200'
                  : 'border-transparent hover:shadow-md'
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-lg">{investor.name}</h3>
                  <div className="text-xs text-gray-500 space-y-0.5 mt-1">
                    {investor.email && <p>✉️ {investor.email}</p>}
                    {investor.phone && <p>📱 {investor.phone}</p>}
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (window.confirm(t('crm.confirmDeleteInvestor'))) {
                      deleteMutation.mutate(investor.id);
                    }
                  }}
                  className="text-red-400 hover:text-red-600 text-sm"
                  disabled={deleteMutation.isPending}
                >
                  🗑
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center mb-4">
                <div className="bg-green-50 rounded-lg p-2">
                  <p className="text-xs text-gray-500">💰 {t('crm.totalInvested')}</p>
                  <p className="text-sm font-bold text-green-600">
                    {formatCurrency(investor.totalInvested)}
                  </p>
                </div>
                <div className="bg-blue-50 rounded-lg p-2">
                  <p className="text-xs text-gray-500">💸 {t('crm.totalReturned')}</p>
                  <p className="text-sm font-bold text-blue-600">
                    {formatCurrency(investor.totalReturned)}
                  </p>
                </div>
                <div className={`rounded-lg p-2 ${investor.balance >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                  <p className="text-xs text-gray-500">📊 {t('crm.balance')}</p>
                  <p className={`text-sm font-bold ${investor.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {investor.balance >= 0 ? '' : '-'}{formatCurrency(investor.balance)}
                  </p>
                </div>
              </div>

              <button
                onClick={() =>
                  setSelectedInvestorId(
                    selectedInvestorId === investor.id ? null : investor.id
                  )
                }
                className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium py-2 rounded-lg hover:bg-blue-50 transition"
              >
                {selectedInvestorId === investor.id
                  ? '▲ ' + t('common.back')
                  : '▼ ' + t('crm.view') + ' ' + t('crm.contributions')}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center text-gray-500">
          {t('crm.noInvestors')}
        </div>
      )}
    </div>
  );
}
