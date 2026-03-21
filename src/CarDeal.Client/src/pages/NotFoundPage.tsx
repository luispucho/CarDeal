import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function NotFoundPage() {
  const { t } = useTranslation();

  return (
    <div className="text-center py-20">
      <h1 className="text-6xl font-bold text-gray-300 mb-4">{t('notFound.title')}</h1>
      <p className="text-xl text-gray-600 mb-6">{t('notFound.message')}</p>
      <Link to="/" className="text-blue-600 hover:underline">{t('notFound.goHome')}</Link>
    </div>
  );
}
