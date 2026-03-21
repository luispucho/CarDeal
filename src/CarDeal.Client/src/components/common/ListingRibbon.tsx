import { useTranslation } from 'react-i18next';

const ribbonStyles: Record<string, { bg: string; text: string }> = {
  Consigned: { bg: 'bg-gray-600', text: 'text-white' },
  Inventory: { bg: 'bg-blue-600', text: 'text-white' },
  CertifiedInventory: { bg: 'bg-amber-500', text: 'text-white' },
  TrustedPartner: { bg: 'bg-gray-400', text: 'text-white' },
};

interface Props {
  listingType: string;
}

export default function ListingRibbon({ listingType }: Props) {
  const { t } = useTranslation();
  const style = ribbonStyles[listingType];
  if (!style) return null;

  return (
    <div className={`absolute top-3 -left-2 ${style.bg} ${style.text} text-xs font-bold px-3 py-1 shadow-md z-10`}
         style={{ clipPath: 'polygon(0 0, 100% 0, 95% 50%, 100% 100%, 0 100%)' }}>
      {t(`listingType.${listingType}`)}
    </div>
  );
}
