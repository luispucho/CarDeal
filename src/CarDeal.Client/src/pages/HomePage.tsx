import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { publicApi, type PublicCar } from '../api/public';
import ListingRibbon from '../components/common/ListingRibbon';

export default function HomePage() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();

  const { data: featuredCars } = useQuery({
    queryKey: ['featuredCars'],
    queryFn: publicApi.getFeatured,
  });

  return (
    <div className="-mx-4 sm:-mx-6 lg:-mx-8 -mt-8">
      {/* ── Hero Section ── */}
      <section className="relative bg-gradient-to-br from-gray-900 via-blue-950 to-blue-900 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-indigo-400 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-36 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight tracking-tight mb-6">
            {t('home.heroTitle')}{' '}
            <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
              {t('home.heroHighlight')}
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-blue-100/80 max-w-2xl mx-auto mb-10 leading-relaxed">
            {t('home.heroSubtitle')}
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            {isAuthenticated ? (
              <>
                <Link
                  to="/submit-car"
                  className="inline-flex items-center justify-center bg-blue-500 hover:bg-blue-400 text-white px-8 py-4 rounded-xl text-lg font-bold shadow-lg shadow-blue-500/30 transition-all duration-200 hover:shadow-blue-400/40 hover:-translate-y-0.5"
                >
                  {t('home.submitYourCar')}
                </Link>
                <Link
                  to="/my-cars"
                  className="inline-flex items-center justify-center border-2 border-white/30 text-white px-8 py-4 rounded-xl text-lg font-bold hover:bg-white/10 transition-all duration-200 hover:-translate-y-0.5"
                >
                  {t('home.mySubmissions')}
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center bg-blue-500 hover:bg-blue-400 text-white px-8 py-4 rounded-xl text-lg font-bold shadow-lg shadow-blue-500/30 transition-all duration-200 hover:shadow-blue-400/40 hover:-translate-y-0.5"
                >
                  {t('home.getStarted')}
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center border-2 border-white/30 text-white px-8 py-4 rounded-xl text-lg font-bold hover:bg-white/10 transition-all duration-200 hover:-translate-y-0.5"
                >
                  {t('home.signIn')}
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── Trust / Stats Bar ── */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { icon: '⚡', label: t('home.statResponse24h') },
              { icon: '💎', label: t('home.statFairOffers') },
              { icon: '✅', label: t('home.statHassleFree') },
              { icon: '🔒', label: t('home.statSecure') },
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col items-center gap-1">
                <span className="text-2xl">{stat.icon}</span>
                <span className="text-sm font-semibold text-gray-700">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 text-center mb-4">
            {t('home.howItWorksTitle')}
          </h2>
          <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              { step: '01', icon: '📸', title: t('home.step1Title'), desc: t('home.step1Desc') },
              { step: '02', icon: '💰', title: t('home.step2Title'), desc: t('home.step2Desc') },
              { step: '03', icon: '🤝', title: t('home.step3Title'), desc: t('home.step3Desc') },
            ].map((item) => (
              <div key={item.step} className="relative text-center group">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-blue-100 text-4xl mb-5 group-hover:scale-110 transition-transform duration-200">
                  {item.icon}
                </div>
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-widest text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">
                  {t('home.stepLabel')} {item.step}
                </span>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-500 leading-relaxed max-w-xs mx-auto">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Vehicles ── */}
      {featuredCars && featuredCars.length > 0 && (
        <section className="bg-white py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3">
                {t('home.featuredTitle')}
              </h2>
              <p className="text-gray-500 text-lg">{t('home.featuredSubtitle')}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredCars.map((car: PublicCar) => {
                const primaryImage = car.images.find(i => i.isPrimary) ?? car.images[0];
                return (
                  <Link
                    key={car.id}
                    to={`/inventory/${car.id}`}
                    className="bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-200 group"
                  >
                    <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
                      <ListingRibbon listingType={car.listingType} />
                      {primaryImage ? (
                        <img
                          src={primaryImage.blobUrl}
                          alt={`${car.year} ${car.make} ${car.model}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-6xl text-gray-300">🚗</div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-gray-900 text-lg">
                        {car.year} {car.make} {car.model}
                      </h3>
                      <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                        <span>{car.mileage.toLocaleString()} {t('common.mi')}</span>
                        {car.condition && (
                          <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium">
                            {car.condition}
                          </span>
                        )}
                      </div>
                      {car.askingPrice != null && (
                        <p className="mt-3 text-xl font-bold text-green-600">${car.askingPrice.toLocaleString()}</p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
            <div className="text-center mt-10">
              <Link
                to="/inventory"
                className="inline-flex items-center justify-center bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all duration-200 shadow-lg hover:-translate-y-0.5"
              >
                {t('home.viewInventory')}
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── Advantages ── */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3">
              {t('home.advantagesTitle')}
            </h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">
              {t('home.advantagesSubtitle')}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: (
                  <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                ),
                title: t('home.adv1Title'),
                desc: t('home.adv1Desc'),
              },
              {
                icon: (
                  <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                  </svg>
                ),
                title: t('home.adv2Title'),
                desc: t('home.adv2Desc'),
              },
              {
                icon: (
                  <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
                  </svg>
                ),
                title: t('home.adv3Title'),
                desc: t('home.adv3Desc'),
              },
              {
                icon: (
                  <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
                  </svg>
                ),
                title: t('home.adv4Title'),
                desc: t('home.adv4Desc'),
              },
            ].map((adv) => (
              <div
                key={adv.title}
                className="bg-gray-50 rounded-2xl p-7 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 border border-gray-100"
              >
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-blue-100 mb-5">
                  {adv.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{adv.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{adv.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Feature Banner ── */}
      <section className="relative bg-gradient-to-r from-blue-900 to-blue-600 overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute -top-20 -right-20 w-96 h-96 border border-white rounded-full" />
          <div className="absolute -bottom-10 -left-10 w-72 h-72 border border-white rounded-full" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 flex flex-col md:flex-row items-center gap-10">
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-5 leading-tight">
              {t('home.featureTitle')}
            </h2>
            <p className="text-blue-100/80 text-lg leading-relaxed max-w-lg mb-8">
              {t('home.featureDesc')}
            </p>
            <Link
              to={isAuthenticated ? '/submit-car' : '/register'}
              className="inline-flex items-center justify-center bg-white text-blue-700 px-8 py-4 rounded-xl text-lg font-bold hover:bg-blue-50 transition-all duration-200 shadow-lg hover:-translate-y-0.5"
            >
              {t('home.featureCta')}
            </Link>
          </div>
          <div className="flex-shrink-0 hidden md:flex items-center justify-center w-64 h-64 rounded-full bg-white/10 backdrop-blur-sm">
            <span className="text-8xl">🚗</span>
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="bg-gray-900 py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
            {t('home.ctaTitle')}
          </h2>
          <p className="text-gray-400 text-lg mb-10 max-w-xl mx-auto">
            {t('home.ctaSubtitle')}
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            {isAuthenticated ? (
              <>
                <Link
                  to="/submit-car"
                  className="inline-flex items-center justify-center bg-blue-500 hover:bg-blue-400 text-white px-8 py-4 rounded-xl text-lg font-bold shadow-lg shadow-blue-500/25 transition-all duration-200 hover:-translate-y-0.5"
                >
                  {t('home.ctaPrimary')}
                </Link>
                <Link
                  to="/my-cars"
                  className="inline-flex items-center justify-center border-2 border-gray-600 text-gray-300 px-8 py-4 rounded-xl text-lg font-bold hover:border-gray-400 hover:text-white transition-all duration-200 hover:-translate-y-0.5"
                >
                  {t('home.ctaSecondary')}
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center bg-blue-500 hover:bg-blue-400 text-white px-8 py-4 rounded-xl text-lg font-bold shadow-lg shadow-blue-500/25 transition-all duration-200 hover:-translate-y-0.5"
                >
                  {t('home.ctaPrimary')}
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center border-2 border-gray-600 text-gray-300 px-8 py-4 rounded-xl text-lg font-bold hover:border-gray-400 hover:text-white transition-all duration-200 hover:-translate-y-0.5"
                >
                  {t('home.ctaSecondary')}
                </Link>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
