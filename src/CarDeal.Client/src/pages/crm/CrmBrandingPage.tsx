import { useState, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { crmApi } from '../../api/crm';
import TierGate from '../../components/common/TierGate';

// ── Types ──

interface ColorForm {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  textColor: string;
  backgroundColor: string;
}

interface BrandingForm {
  dealerName: string;
  tagline: string;
}

interface DomainForm {
  customDomain: string;
}

const DEFAULT_SECTIONS = ['hero', 'featuredSection', 'inventorySection', 'aboutSection', 'contactSection'];

// ── Page ──

export default function CrmBrandingPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showMsg = (text: string, type: 'success' | 'error') => {
    setMsg({ text, type });
    setTimeout(() => setMsg(null), 3000);
  };

  const { data: branding, isLoading } = useQuery({
    queryKey: ['branding'],
    queryFn: crmApi.getBranding,
  });

  // ── Color Section ──
  const colorForm = useForm<ColorForm>();

  const colorValues = colorForm.watch();

  const resetColors = useCallback(() => {
    if (branding) {
      colorForm.reset({
        primaryColor: branding.primaryColor || '#3B82F6',
        secondaryColor: branding.secondaryColor || '#6B7280',
        accentColor: branding.accentColor || '#F59E0B',
        textColor: branding.textColor || '#111827',
        backgroundColor: branding.backgroundColor || '#FFFFFF',
      });
    }
  }, [branding, colorForm]);

  // Reset colors when branding loads
  if (branding && !colorForm.formState.isDirty && !colorForm.formState.isSubmitted) {
    resetColors();
  }

  const colorMutation = useMutation({
    mutationFn: (data: ColorForm) => crmApi.updateBranding(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branding'] });
      showMsg(t('crm.brandingSaved'), 'success');
    },
    onError: () => showMsg('Error', 'error'),
  });

  // ── Branding Section ──
  const brandingFormHook = useForm<BrandingForm>();

  if (branding && !brandingFormHook.formState.isDirty && !brandingFormHook.formState.isSubmitted) {
    brandingFormHook.reset({
      dealerName: branding.dealerName || '',
      tagline: branding.tagline || '',
    });
  }

  const brandingMutation = useMutation({
    mutationFn: (data: BrandingForm) => crmApi.updateBranding(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branding'] });
      showMsg(t('crm.brandingSaved'), 'success');
    },
    onError: () => showMsg('Error', 'error'),
  });

  const logoUploadMutation = useMutation({
    mutationFn: (file: File) => crmApi.uploadLogo(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branding'] });
      showMsg(t('crm.logoUploaded'), 'success');
    },
    onError: () => showMsg('Error', 'error'),
  });

  const logoDeleteMutation = useMutation({
    mutationFn: () => crmApi.deleteLogo(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branding'] });
      showMsg(t('crm.logoRemoved'), 'success');
    },
    onError: () => showMsg('Error', 'error'),
  });

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) logoUploadMutation.mutate(file);
  };

  // ── Layout Section ──
  const [sections, setSections] = useState<string[]>([]);
  const [layoutInitialized, setLayoutInitialized] = useState(false);

  if (branding && !layoutInitialized) {
    const saved = branding.landingLayoutJson;
    let parsed: string[] | null = null;
    if (saved) {
      try {
        parsed = JSON.parse(saved);
      } catch { /* ignore */ }
    }
    setSections(Array.isArray(parsed) ? parsed : DEFAULT_SECTIONS);
    setLayoutInitialized(true);
  }

  const moveSection = (idx: number, direction: 'up' | 'down') => {
    const newSections = [...sections];
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= newSections.length) return;
    [newSections[idx], newSections[targetIdx]] = [newSections[targetIdx], newSections[idx]];
    setSections(newSections);
  };

  const layoutMutation = useMutation({
    mutationFn: () => crmApi.updateBranding({ landingLayoutJson: JSON.stringify(sections) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branding'] });
      showMsg(t('crm.layoutSaved'), 'success');
    },
    onError: () => showMsg('Error', 'error'),
  });

  // ── Domain Section ──
  const domainForm = useForm<DomainForm>();

  if (branding && !domainForm.formState.isDirty && !domainForm.formState.isSubmitted) {
    domainForm.reset({ customDomain: branding.customDomain || '' });
  }

  const domainMutation = useMutation({
    mutationFn: (data: DomainForm) => crmApi.updateBranding(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branding'] });
      showMsg(t('crm.brandingSaved'), 'success');
    },
    onError: () => showMsg('Error', 'error'),
  });

  if (isLoading) return <div className="text-center py-12 text-gray-500">{t('common.loading')}</div>;

  const tier = branding?.tier as string | undefined;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">🎨 {t('crm.branding')}</h1>

      {msg && (
        <p className={`text-sm ${msg.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>{msg.text}</p>
      )}

      {/* ── Color Section ── */}
      <section className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">{t('crm.brandColors')}</h2>
        <form onSubmit={colorForm.handleSubmit((data) => colorMutation.mutate(data))} className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {([
              ['primaryColor', t('crm.primaryColor')],
              ['secondaryColor', t('crm.secondaryColor')],
              ['accentColor', t('crm.accentColor')],
              ['textColor', t('crm.textColor')],
              ['backgroundColor', t('crm.backgroundColor')],
            ] as const).map(([field, label]) => (
              <div key={field}>
                <label className="block text-sm font-medium text-gray-600 mb-1">{label}</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    {...colorForm.register(field)}
                    className="w-10 h-10 rounded cursor-pointer border-0 p-0"
                  />
                  <span className="text-xs text-gray-400 font-mono">
                    {colorValues[field] || ''}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Live preview */}
          <div className="mt-4">
            <p className="text-sm text-gray-500 mb-2">{t('crm.preview')}</p>
            <div className="flex rounded-lg overflow-hidden h-8">
              <div className="flex-1" style={{ backgroundColor: colorValues.primaryColor }} />
              <div className="flex-1" style={{ backgroundColor: colorValues.secondaryColor }} />
              <div className="flex-1" style={{ backgroundColor: colorValues.accentColor }} />
              <div className="flex-1" style={{ backgroundColor: colorValues.textColor }} />
              <div className="flex-1 border" style={{ backgroundColor: colorValues.backgroundColor }} />
            </div>
          </div>

          <button
            type="submit"
            disabled={colorMutation.isPending}
            className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition text-sm disabled:opacity-50"
          >
            {t('common.save')}
          </button>
        </form>
      </section>

      {/* ── Branding Section ── */}
      <section className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">{t('crm.logo')} & {t('crm.dealerName')}</h2>

        {/* Logo */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-600 mb-2">{t('crm.logo')}</label>
          {branding?.logoUrl && (
            <img src={branding.logoUrl} alt="Logo" className="h-20 mb-3 rounded" />
          )}
          <div className="flex gap-2">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={logoUploadMutation.isPending}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm disabled:opacity-50"
            >
              {t('crm.uploadLogo')}
            </button>
            {branding?.logoUrl && (
              <button
                type="button"
                onClick={() => logoDeleteMutation.mutate()}
                disabled={logoDeleteMutation.isPending}
                className="bg-red-100 text-red-700 px-4 py-2 rounded-lg hover:bg-red-200 transition text-sm disabled:opacity-50"
              >
                {t('crm.removeLogo')}
              </button>
            )}
          </div>
        </div>

        <form onSubmit={brandingFormHook.handleSubmit((data) => brandingMutation.mutate(data))} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">{t('crm.dealerName')}</label>
            <input
              {...brandingFormHook.register('dealerName')}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">{t('crm.tagline')}</label>
            <input
              {...brandingFormHook.register('tagline')}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={brandingMutation.isPending}
            className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition text-sm disabled:opacity-50"
          >
            {t('common.save')}
          </button>
        </form>
      </section>

      {/* ── Layout Section (Pro+) ── */}
      <section className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">{t('crm.landingLayout')}</h2>
        <TierGate requiredTier="Pro" currentTier={tier}>
          <p className="text-sm text-gray-500 mb-4">{t('crm.dragToReorder')}</p>
          <ul className="space-y-2 mb-4">
            {sections.map((section, idx) => (
              <li
                key={section}
                className="flex items-center justify-between bg-gray-50 border rounded-lg px-4 py-3"
              >
                <span className="flex items-center gap-3">
                  <span className="text-gray-400 cursor-grab">☰</span>
                  <span className="text-sm font-medium">{t(`crm.${section}`)}</span>
                </span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => moveSection(idx, 'up')}
                    disabled={idx === 0}
                    className="px-2 py-1 text-xs rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-30 transition"
                    title={t('crm.moveUp')}
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    onClick={() => moveSection(idx, 'down')}
                    disabled={idx === sections.length - 1}
                    className="px-2 py-1 text-xs rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-30 transition"
                    title={t('crm.moveDown')}
                  >
                    ▼
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => layoutMutation.mutate()}
            disabled={layoutMutation.isPending}
            className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition text-sm disabled:opacity-50"
          >
            {t('common.save')}
          </button>
        </TierGate>
      </section>

      {/* ── Custom Domain (Enterprise) ── */}
      <section className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">{t('crm.customDomain')}</h2>
        <TierGate requiredTier="Enterprise" currentTier={tier}>
          <form onSubmit={domainForm.handleSubmit((data) => domainMutation.mutate(data))} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">{t('crm.customDomain')}</label>
              <input
                {...domainForm.register('customDomain')}
                placeholder="www.mydealer.com"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={domainMutation.isPending}
              className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition text-sm disabled:opacity-50"
            >
              {t('common.save')}
            </button>
          </form>
        </TierGate>
      </section>
    </div>
  );
}
