import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

export default function HomePage() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();

  return (
    <div className="text-center py-16">
      <h1 className="text-5xl font-bold text-gray-900 mb-6">
        {t('home.heroTitle')} <span className="text-blue-600">{t('home.heroHighlight')}</span>
      </h1>
      <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
        {t('home.heroDescription')}
      </p>
      <div className="flex justify-center space-x-4">
        {isAuthenticated ? (
          <>
            <Link
              to="/submit-car"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition"
            >
              {t('home.submitYourCar')}
            </Link>
            <Link
              to="/my-cars"
              className="border border-blue-600 text-blue-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-50 transition"
            >
              {t('home.mySubmissions')}
            </Link>
          </>
        ) : (
          <>
            <Link
              to="/register"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition"
            >
              {t('home.getStarted')}
            </Link>
            <Link
              to="/login"
              className="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-gray-50 transition"
            >
              {t('home.signIn')}
            </Link>
          </>
        )}
      </div>

      <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
        <div className="p-6 bg-white rounded-xl shadow-sm">
          <div className="text-3xl mb-3">📸</div>
          <h3 className="text-lg font-semibold mb-2">{t('home.uploadPhotos')}</h3>
          <p className="text-gray-600 text-sm">{t('home.uploadPhotosDesc')}</p>
        </div>
        <div className="p-6 bg-white rounded-xl shadow-sm">
          <div className="text-3xl mb-3">💰</div>
          <h3 className="text-lg font-semibold mb-2">{t('home.getAnOffer')}</h3>
          <p className="text-gray-600 text-sm">{t('home.getAnOfferDesc')}</p>
        </div>
        <div className="p-6 bg-white rounded-xl shadow-sm">
          <div className="text-3xl mb-3">🤝</div>
          <h3 className="text-lg font-semibold mb-2">{t('home.sellOrConsign')}</h3>
          <p className="text-gray-600 text-sm">{t('home.sellOrConsignDesc')}</p>
        </div>
      </div>
    </div>
  );
}
