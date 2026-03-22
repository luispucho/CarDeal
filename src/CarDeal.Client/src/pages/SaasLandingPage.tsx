import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { publicApi } from '../api/public';
import { clearCurrentTenant } from '../utils/tenantCookie';

const FEATURES = [
  { icon: '🏪', key: 'multiDealer' },
  { icon: '📊', key: 'integratedCrm' },
  { icon: '🌐', key: 'crossDealer' },
  { icon: '📡', key: 'externalPub' },
  { icon: '💰', key: 'investorTracking' },
  { icon: '🎨', key: 'customBranding' },
];

const BASIC_FEATURES = ['brandColors', 'logo', 'inventory'];
const PRO_FEATURES = ['crm', 'employees', 'externalPub', 'advancedStats', 'layoutEditor', 'investors'];
const ENTERPRISE_FEATURES = ['aiAssistant', 'aiSalesAgent', 'aiAnalytics', 'customDomain', 'prioritySupport'];

export default function SaasLandingPage() {
  const { t } = useTranslation();

  // Clear tenant cookie when visiting the SaaS landing page
  useEffect(() => {
    clearCurrentTenant();
  }, []);

  const { data: tenants } = useQuery({
    queryKey: ['publicTenants'],
    queryFn: publicApi.getTenants,
  });

  return (
    <div className="-mx-4 sm:-mx-6 lg:-mx-8 -mt-8">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-indigo-950 via-purple-900 to-indigo-800 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-1/4 w-96 h-96 bg-purple-400 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-1/3 w-80 h-80 bg-indigo-400 rounded-full blur-3xl" />
          <div className="absolute top-1/2 right-10 w-64 h-64 bg-pink-400 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-28 md:py-40 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold text-white leading-tight tracking-tight mb-6">
            {t('saas.heroTitle')}
          </h1>
          <p className="text-lg sm:text-xl text-purple-100/80 max-w-3xl mx-auto mb-12 leading-relaxed">
            {t('saas.heroSubtitle')}
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to="/register"
              className="inline-flex items-center justify-center bg-white text-indigo-700 px-10 py-4 rounded-xl text-lg font-bold shadow-lg shadow-white/20 hover:shadow-white/30 transition-all duration-200 hover:-translate-y-0.5"
            >
              {t('saas.getStarted')}
            </Link>
            <a
              href="#demo-dealers"
              className="inline-flex items-center justify-center border-2 border-white/30 text-white px-10 py-4 rounded-xl text-lg font-bold hover:bg-white/10 transition-all duration-200 hover:-translate-y-0.5"
            >
              {t('saas.viewDemo')}
            </a>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
              {t('saas.features')}
            </h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">
              {t('saas.featuresSubtitle')}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {FEATURES.map((f) => (
              <div
                key={f.key}
                className="bg-gray-50 rounded-2xl p-8 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 border border-gray-100"
              >
                <div className="text-4xl mb-4">{f.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {t(`saas.${f.key}`)}
                </h3>
                <p className="text-gray-500 leading-relaxed">
                  {t(`saas.${f.key}Desc`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 text-center mb-16">
            {t('saas.howItWorks')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[1, 2, 3].map((step) => (
              <div key={step} className="relative text-center group">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-indigo-100 text-indigo-700 text-2xl font-extrabold mb-5 group-hover:scale-110 transition-transform duration-200">
                  {step}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {t(`saas.step${step}`)}
                </h3>
                <p className="text-gray-500 leading-relaxed max-w-xs mx-auto">
                  {t(`saas.step${step}Desc`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
              {t('saas.pricing')}
            </h2>
            <p className="text-gray-500 text-lg">{t('saas.pricingSubtitle')}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Basic */}
            <div className="bg-gray-50 rounded-2xl border border-gray-200 p-8 flex flex-col">
              <h3 className="text-xl font-bold text-gray-900 mb-1">{t('saas.basic')}</h3>
              <p className="text-3xl font-extrabold text-gray-900 mb-6">{t('saas.basicPrice')}</p>
              <ul className="space-y-3 flex-1 mb-8">
                {BASIC_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="text-green-500 mt-0.5">✓</span>
                    {t(`saas.feature_${f}`, f)}
                  </li>
                ))}
              </ul>
              <Link
                to="/register"
                className="block text-center bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-300 transition"
              >
                {t('saas.choosePlan')}
              </Link>
            </div>

            {/* Pro */}
            <div className="bg-indigo-50 rounded-2xl border-2 border-indigo-500 p-8 flex flex-col relative shadow-lg">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                Popular
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">{t('saas.pro')}</h3>
              <p className="text-3xl font-extrabold text-gray-900 mb-1">
                {t('saas.proPrice')}
                <span className="text-base font-normal text-gray-500 ml-1">/{t('saas.perMonth')}</span>
              </p>
              <p className="text-xs text-gray-400 mb-6">Everything in Basic, plus:</p>
              <ul className="space-y-3 flex-1 mb-8">
                {PRO_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="text-indigo-500 mt-0.5">✓</span>
                    {t(`saas.feature_${f}`, f)}
                  </li>
                ))}
              </ul>
              <Link
                to="/register"
                className="block text-center bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition shadow-md"
              >
                {t('saas.choosePlan')}
              </Link>
            </div>

            {/* Enterprise */}
            <div className="bg-gray-50 rounded-2xl border border-gray-200 p-8 flex flex-col">
              <h3 className="text-xl font-bold text-gray-900 mb-1">{t('saas.enterprise')}</h3>
              <p className="text-3xl font-extrabold text-gray-900 mb-1">
                {t('saas.enterprisePrice')}
                <span className="text-base font-normal text-gray-500 ml-1">/{t('saas.perMonth')}</span>
              </p>
              <p className="text-xs text-gray-400 mb-6">Everything in Pro, plus:</p>
              <ul className="space-y-3 flex-1 mb-8">
                {ENTERPRISE_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="text-green-500 mt-0.5">✓</span>
                    {t(`saas.feature_${f}`, f)}
                  </li>
                ))}
              </ul>
              <Link
                to="/register"
                className="block text-center bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-300 transition"
              >
                {t('saas.choosePlan')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Dealers */}
      <section id="demo-dealers" className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
              {t('saas.demoDealers')}
            </h2>
            <p className="text-gray-500 text-lg">{t('saas.demoDealersSubtitle')}</p>
          </div>
          {tenants && tenants.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {tenants.map((tenant) => (
                <Link
                  key={tenant.id}
                  to={`/${tenant.slug}`}
                  className="bg-white rounded-2xl border border-gray-200 p-8 text-center hover:shadow-lg hover:-translate-y-1 transition-all duration-200 group"
                >
                  {tenant.logoUrl ? (
                    <img src={tenant.logoUrl} alt={tenant.name} className="w-16 h-16 rounded-xl mx-auto mb-4 object-cover" />
                  ) : (
                    <div className="w-16 h-16 rounded-xl mx-auto mb-4 bg-indigo-100 flex items-center justify-center text-2xl">
                      🏪
                    </div>
                  )}
                  <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-indigo-600 transition">
                    {tenant.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {tenant.carCount} {t('saas.carsAvailable')}
                  </p>
                  <span className="inline-block mt-4 text-sm font-semibold text-indigo-600 group-hover:underline">
                    {t('saas.viewDealer')} →
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-400">{t('common.loading')}</p>
          )}
        </div>
      </section>

      {/* Footer CTA */}
      <section className="bg-gradient-to-r from-indigo-900 to-purple-800 py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
            {t('saas.readyToGrow')}
          </h2>
          <p className="text-indigo-200 text-lg mb-10 max-w-xl mx-auto">
            {t('saas.readySubtitle')}
          </p>
          <Link
            to="/register"
            className="inline-flex items-center justify-center bg-white text-indigo-700 px-10 py-4 rounded-xl text-lg font-bold shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5"
          >
            {t('saas.getStarted')}
          </Link>
        </div>
      </section>
    </div>
  );
}
