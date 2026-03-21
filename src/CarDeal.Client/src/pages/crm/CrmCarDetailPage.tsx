import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { crmApi } from '../../api/crm';

// ── Schemas ──

const financialsSchema = z.object({
  purchasePrice: z.coerce.number().optional(),
  salePrice: z.coerce.number().optional(),
  notes: z.string().optional(),
});
type FinancialsForm = z.infer<typeof financialsSchema>;

const expenseSchema = z.object({
  type: z.string().min(1),
  amount: z.coerce.number().positive(),
  description: z.string().optional(),
  date: z.string().optional(),
});
type ExpenseForm = z.infer<typeof expenseSchema>;

function formatCurrency(value?: number) {
  if (value == null) return '—';
  return `$${value.toLocaleString()}`;
}

const EXPENSE_TYPES = ['Repair', 'Marketing', 'Transport', 'Inspection', 'Other'];

export default function CrmCarDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const carId = Number(id);
  const queryClient = useQueryClient();
  const [financialsMsg, setFinancialsMsg] = useState('');
  const [expenseMsg, setExpenseMsg] = useState('');
  const [noteMsg, setNoteMsg] = useState('');
  const [noteContent, setNoteContent] = useState('');

  // ── Queries ──

  const { data: car, isLoading } = useQuery({
    queryKey: ['crmCar', carId],
    queryFn: () => crmApi.getCarById(carId),
    enabled: !!carId,
  });

  const { data: expenses } = useQuery({
    queryKey: ['crmExpenses', carId],
    queryFn: () => crmApi.getExpenses(carId),
    enabled: !!carId,
  });

  const { data: notes } = useQuery({
    queryKey: ['crmNotes', carId],
    queryFn: () => crmApi.getNotes(carId),
    enabled: !!carId,
  });

  // ── Financials form ──

  const financialsForm = useForm<FinancialsForm>({
    resolver: zodResolver(financialsSchema),
    values: {
      purchasePrice: car?.financials?.purchasePrice ?? undefined,
      salePrice: car?.financials?.salePrice ?? undefined,
      notes: car?.financials?.notes ?? '',
    },
  });

  const financialsMutation = useMutation({
    mutationFn: (data: FinancialsForm) => crmApi.updateFinancials(carId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crmCar', carId] });
      queryClient.invalidateQueries({ queryKey: ['crmInventory'] });
      setFinancialsMsg(t('crm.financialsSaved'));
      setTimeout(() => setFinancialsMsg(''), 3000);
    },
  });

  // ── Expense form ──

  const expenseForm = useForm<ExpenseForm>({
    resolver: zodResolver(expenseSchema),
    defaultValues: { type: 'Repair', amount: 0, description: '', date: '' },
  });

  const addExpenseMutation = useMutation({
    mutationFn: (data: ExpenseForm) => crmApi.addExpense(carId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crmExpenses', carId] });
      queryClient.invalidateQueries({ queryKey: ['crmCar', carId] });
      queryClient.invalidateQueries({ queryKey: ['crmInventory'] });
      expenseForm.reset({ type: 'Repair', amount: 0, description: '', date: '' });
      setExpenseMsg(t('crm.expenseAdded'));
      setTimeout(() => setExpenseMsg(''), 3000);
    },
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: (expenseId: number) => crmApi.deleteExpense(carId, expenseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crmExpenses', carId] });
      queryClient.invalidateQueries({ queryKey: ['crmCar', carId] });
      queryClient.invalidateQueries({ queryKey: ['crmInventory'] });
      setExpenseMsg(t('crm.expenseDeleted'));
      setTimeout(() => setExpenseMsg(''), 3000);
    },
  });

  // ── Note mutation ──

  const addNoteMutation = useMutation({
    mutationFn: () => crmApi.addNote(carId, { content: noteContent }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crmNotes', carId] });
      setNoteContent('');
      setNoteMsg(t('crm.noteAdded'));
      setTimeout(() => setNoteMsg(''), 3000);
    },
  });

  if (isLoading) return <div className="text-center py-12 text-gray-500">{t('common.loading')}</div>;
  if (!car) return <div className="text-center py-12 text-gray-500">{t('cars.carNotFound')}</div>;

  const purchasePrice = car.financials?.purchasePrice;
  const salePrice = car.financials?.salePrice;
  const totalExpenses = car.totalExpenses;
  const profit =
    purchasePrice != null && salePrice != null
      ? salePrice - purchasePrice - totalExpenses
      : null;

  const primaryImage = car.images.find((img) => img.isPrimary) ?? car.images[0];

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
      <Link to="/crm/inventory" className="text-blue-600 hover:underline text-sm mb-4 inline-block">
        ← {t('crm.inventory')}
      </Link>

      {/* ── Car Info ── */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-6">
          {primaryImage ? (
            <img src={primaryImage.blobUrl} alt="" className="w-full md:w-64 h-48 object-cover rounded-lg" />
          ) : (
            <div className="w-full md:w-64 h-48 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400">
              No image
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-2xl font-bold mb-2">
              {car.year} {car.make} {car.model}
            </h1>
            <div className="flex flex-wrap gap-2 mb-3">
              <span className={`text-xs px-2 py-1 rounded-full ${statusColors[car.status] || 'bg-gray-100'}`}>
                {t(`carStatus.${car.status}`, car.status)}
              </span>
              <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                {t(`listingType.${car.listingType}`, car.listingType)}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
              <p>{t('cars.mileage')}: {car.mileage.toLocaleString()} {t('common.mi')}</p>
              {car.color && <p>{t('cars.color')}: {car.color}</p>}
              {car.condition && <p>{t('cars.condition')}: {car.condition}</p>}
              {car.askingPrice != null && <p>{t('cars.askingPrice')}: ${car.askingPrice.toLocaleString()}</p>}
            </div>
            {/* Thumbnails */}
            {car.images.length > 1 && (
              <div className="flex gap-2 mt-3 overflow-x-auto">
                {car.images.map((img) => (
                  <img
                    key={img.id}
                    src={img.blobUrl}
                    alt=""
                    className="w-16 h-12 object-cover rounded border"
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Financials + Profit ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Financials Form */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">{t('crm.financials')}</h2>
          <form onSubmit={financialsForm.handleSubmit((data) => financialsMutation.mutate(data))} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('crm.purchasePrice')}</label>
              <input
                type="number"
                step="0.01"
                {...financialsForm.register('purchasePrice')}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('crm.salePrice')}</label>
              <input
                type="number"
                step="0.01"
                {...financialsForm.register('salePrice')}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('crm.notes')}</label>
              <textarea
                {...financialsForm.register('notes')}
                rows={2}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={financialsMutation.isPending}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm disabled:opacity-50"
            >
              {t('crm.saveFinancials')}
            </button>
            {financialsMsg && <p className="text-green-600 text-sm mt-1">{financialsMsg}</p>}
          </form>
        </div>

        {/* Profit Summary */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">{t('crm.profit')}</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-600">{t('crm.salePrice')}</span>
              <span className="font-medium">{formatCurrency(salePrice)}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-600">– {t('crm.purchasePrice')}</span>
              <span className="font-medium">{formatCurrency(purchasePrice)}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-600">– {t('crm.expenses')}</span>
              <span className="font-medium">{formatCurrency(totalExpenses)}</span>
            </div>
            <div className="flex justify-between pt-2">
              <span className="font-semibold">{t('crm.profit')}</span>
              <span className={`text-xl font-bold ${
                profit == null ? '' : profit >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {profit != null ? formatCurrency(profit) : '—'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Expenses ── */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">{t('crm.expenses')}</h2>
        {expenseMsg && <p className="text-green-600 text-sm mb-3">{expenseMsg}</p>}

        <div className="overflow-x-auto mb-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-3 font-medium">{t('crm.expenseType')}</th>
                <th className="pb-3 font-medium text-right">{t('crm.amount')}</th>
                <th className="pb-3 font-medium">{t('crm.description')}</th>
                <th className="pb-3 font-medium">{t('crm.date')}</th>
                <th className="pb-3 font-medium">{t('crm.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {expenses && expenses.length > 0 ? (
                expenses.map((expense) => (
                  <tr key={expense.id} className="border-b last:border-0">
                    <td className="py-3">{t(`crm.${expense.type.toLowerCase()}`, expense.type)}</td>
                    <td className="py-3 text-right font-medium">{formatCurrency(expense.amount)}</td>
                    <td className="py-3 text-gray-600">{expense.description || '—'}</td>
                    <td className="py-3 text-gray-500">{new Date(expense.date).toLocaleDateString()}</td>
                    <td className="py-3">
                      <button
                        onClick={() => deleteExpenseMutation.mutate(expense.id)}
                        className="text-red-600 hover:underline text-sm"
                        disabled={deleteExpenseMutation.isPending}
                      >
                        {t('common.delete')}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-gray-500">{t('crm.noExpenses')}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Add Expense Form */}
        <form
          onSubmit={expenseForm.handleSubmit((data) => addExpenseMutation.mutate(data))}
          className="flex flex-wrap gap-3 items-end border-t pt-4"
        >
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">{t('crm.expenseType')}</label>
            <select
              {...expenseForm.register('type')}
              className="border rounded-lg px-3 py-2 text-sm"
            >
              {EXPENSE_TYPES.map((type) => (
                <option key={type} value={type}>{t(`crm.${type.toLowerCase()}`, type)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">{t('crm.amount')}</label>
            <input
              type="number"
              step="0.01"
              {...expenseForm.register('amount')}
              className="border rounded-lg px-3 py-2 text-sm w-28"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">{t('crm.description')}</label>
            <input
              type="text"
              {...expenseForm.register('description')}
              className="border rounded-lg px-3 py-2 text-sm w-48"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">{t('crm.date')}</label>
            <input
              type="date"
              {...expenseForm.register('date')}
              className="border rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={addExpenseMutation.isPending}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm disabled:opacity-50"
          >
            {t('crm.addExpense')}
          </button>
        </form>
      </div>

      {/* ── Notes ── */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">{t('crm.notes')}</h2>
        {noteMsg && <p className="text-green-600 text-sm mb-3">{noteMsg}</p>}

        {notes && notes.length > 0 ? (
          <div className="space-y-4 mb-4">
            {notes.map((note) => (
              <div key={note.id} className="border-l-4 border-blue-400 pl-4 py-2">
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                  <span className="font-medium text-gray-700">{note.authorName}</span>
                  <span>·</span>
                  <span>{new Date(note.createdAt).toLocaleString()}</span>
                </div>
                <p className="text-sm text-gray-800 whitespace-pre-wrap">{note.content}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm mb-4">{t('crm.noNotes')}</p>
        )}

        <div className="border-t pt-4">
          <textarea
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            rows={3}
            placeholder={t('crm.notePlaceholder')}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-2"
          />
          <button
            onClick={() => addNoteMutation.mutate()}
            disabled={!noteContent.trim() || addNoteMutation.isPending}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm disabled:opacity-50"
          >
            {t('crm.addNote')}
          </button>
        </div>
      </div>
    </div>
  );
}
