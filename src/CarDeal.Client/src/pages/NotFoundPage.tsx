import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function NotFoundPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [navigate]);

  return (
    <div className="text-center py-16 px-4">
      <div className="text-8xl mb-6" role="img" aria-label="crashed car">
        🚗💥🚧
      </div>
      <h1 className="text-7xl font-bold text-gray-300 mb-2">{t('notFound.title')}</h1>
      <h2 className="text-2xl font-semibold text-gray-700 mb-3">{t('notFound.headline')}</h2>
      <p className="text-lg text-gray-500 mb-6 max-w-md mx-auto">{t('notFound.message')}</p>

      <div className="inline-flex items-center gap-2 bg-yellow-50 border border-yellow-200 text-yellow-800 px-5 py-3 rounded-xl text-sm mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.828a1 1 0 101.415-1.414L11 9.586V6z" clipRule="evenodd" />
        </svg>
        {t('notFound.redirecting', { seconds: countdown })}
      </div>

      <div>
        <button onClick={() => navigate('/')} className="text-blue-600 hover:underline font-medium">
          {t('notFound.goHome')}
        </button>
      </div>
    </div>
  );
}
