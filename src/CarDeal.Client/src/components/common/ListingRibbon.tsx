import { useTranslation } from 'react-i18next';

const ribbonStyles: Record<string, { bg: string; text: string }> = {
  Consigned: { bg: 'bg-gray-600', text: 'text-white' },
  Inventory: { bg: 'bg-blue-600', text: 'text-white' },
  CertifiedInventory: { bg: 'bg-amber-500', text: 'text-white' },
  TrustedPartner: { bg: 'bg-gray-400', text: 'text-white' },
};

interface Props {
  listingType: string;
  tenantId?: number | null;
  viewerTenantId?: number | null;
}

export default function ListingRibbon({ listingType, tenantId, viewerTenantId }: Props) {
  const { t } = useTranslation();

  let effectiveType = listingType;
  if (
    tenantId != null &&
    viewerTenantId != null &&
    tenantId !== viewerTenantId &&
    (listingType === 'Inventory' || listingType === 'CertifiedInventory')
  ) {
    effectiveType = 'TrustedPartner';
  }

  const style = ribbonStyles[effectiveType];
  if (!style) return null;

  return (
    <div className={`absolute top-3 right-3 ${style.bg} ${style.text} text-xs font-bold px-3 py-1 rounded-full shadow-sm z-10`}>
      {t(`listingType.${effectiveType}`)}
    </div>
  );
}
