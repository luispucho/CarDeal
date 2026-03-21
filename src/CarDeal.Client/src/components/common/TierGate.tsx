import { useTranslation } from 'react-i18next';

interface Props {
  requiredTier: string;
  currentTier?: string;
  children: React.ReactNode;
}

export default function TierGate({ requiredTier, currentTier, children }: Props) {
  const { t } = useTranslation();
  const tierOrder = ['Basic', 'Pro', 'Enterprise'];
  const currentIdx = tierOrder.indexOf(currentTier || 'Basic');
  const requiredIdx = tierOrder.indexOf(requiredTier);

  if (currentIdx >= requiredIdx) return <>{children}</>;

  return (
    <div className="text-center py-16 px-4">
      <div className="text-8xl mb-6">🚗🔧</div>
      <h1 className="text-3xl font-bold text-gray-700 mb-3">{t('tierGate.title')}</h1>
      <p className="text-lg text-gray-500 mb-2 max-w-md mx-auto">{t('tierGate.message')}</p>
      <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 px-5 py-3 rounded-xl text-sm mb-6 mt-4">
        <span className="font-semibold">{t('tierGate.currentTier')}: {currentTier || 'Basic'}</span>
        <span>→</span>
        <span className="font-semibold">{t('tierGate.requiredTier')}: {requiredTier}</span>
      </div>
      <p className="text-sm text-gray-400">{t('tierGate.contact')}</p>
    </div>
  );
}
