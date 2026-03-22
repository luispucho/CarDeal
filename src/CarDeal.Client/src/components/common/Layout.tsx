import { useEffect } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { messagesApi } from '../../api/messages';
import { settingsApi } from '../../api/settings';
import { publicApi } from '../../api/public';
import { getCurrentTenant } from '../../utils/tenantCookie';

export default function Layout() {
  const { t, i18n } = useTranslation();
  const { user, isAuthenticated, isAdmin, isSuperAdmin, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    settingsApi.getLanguage().then(({ language }) => {
      i18n.changeLanguage(language);
      localStorage.setItem('siteLanguage', language);
    }).catch(() => {});
  }, [i18n]);

  const isTenantUser = !!user?.tenantId;
  const isTenantAdmin = isAdmin || isSuperAdmin;

  const cookieTenant = getCurrentTenant();

  // Fetch tenant branding when viewing a tenant's site
  const { data: tenantBranding } = useQuery({
    queryKey: ['tenantBrandingNav', cookieTenant],
    queryFn: async () => {
      const tenants = await publicApi.getTenants();
      const tenant = tenants.find((t: any) => t.id === cookieTenant || t.slug === String(cookieTenant));
      if (!tenant) return null;
      try {
        const branding = await publicApi.getBranding(tenant.slug);
        return { ...branding, slug: tenant.slug };
      } catch { return { tenantName: tenant.name, logoUrl: null, slug: tenant.slug } as any; }
    },
    enabled: !!cookieTenant,
    staleTime: 60000,
  });

  const tenantSlug = tenantBranding?.slug || cookieTenant;
  const inventoryLink = tenantSlug ? `/${tenantSlug}/inventory` : '/inventory';
  const sellLink = tenantSlug ? `/${tenantSlug}/sell` : '/0';
  const brandLink = tenantSlug ? `/${tenantSlug}` : '/0';

  const { data: unreadCount } = useQuery({
    queryKey: ['unreadCount'],
    queryFn: messagesApi.getUnreadCount,
    enabled: isAuthenticated,
    refetchInterval: 30000,
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link to={brandLink} className="flex items-center gap-2 text-xl font-bold text-blue-600">
                {tenantBranding?.logoUrl && (
                  <img src={tenantBranding.logoUrl} alt="" className="h-8 w-8 rounded object-cover" />
                )}
                {tenantBranding?.tenantName || t('nav.brand')}
              </Link>
              {cookieTenant && (
                <Link to={inventoryLink} className="text-gray-700 hover:text-blue-600 transition">
                  {isTenantUser ? t('nav.inventory') : t('nav.buyCar')}
                </Link>
              )}
              {cookieTenant && !isTenantUser && (
                <Link to={sellLink} className="text-gray-700 hover:text-blue-600 transition">
                  {t('nav.sellCar')}
                </Link>
              )}
              {isAuthenticated && (
                <>
                  {!isTenantUser && !isSuperAdmin && (
                    <>
                      <Link to="/my-cars" className="text-gray-700 hover:text-blue-600 transition">
                        {t('common.myCars')}
                      </Link>
                      <Link to="/submit-car" className="text-gray-700 hover:text-blue-600 transition">
                        {t('common.submitACar')}
                      </Link>
                    </>
                  )}
                  {!isSuperAdmin && (
                    <Link to="/inbox" className="text-gray-700 hover:text-blue-600 transition relative">
                      {t('common.messages')}
                      {(unreadCount ?? 0) > 0 && (
                        <span className="absolute -top-2 -right-4 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                          {unreadCount}
                        </span>
                      )}
                    </Link>
                  )}
                  {isAdmin && (
                    <Link to="/admin" className="text-gray-700 hover:text-blue-600 transition font-medium">
                      {t('nav.adminLink')}
                    </Link>
                  )}
                  {isSuperAdmin && (
                    <Link to="/admin/tenants" className="text-gray-700 hover:text-blue-600 transition font-medium">
                      🏪 {t('nav.dealers')}
                    </Link>
                  )}
                  {isTenantUser && (
                    <Link to="/crm" className="text-gray-700 hover:text-blue-600 transition font-medium">
                      📊 {t('nav.crm')}
                    </Link>
                  )}
                  {isTenantUser && (
                    <Link to="/crm/investors" className="text-gray-700 hover:text-blue-600 transition font-medium">
                      💰 {t('crm.investors')}
                    </Link>
                  )}
                  {isTenantUser && isTenantAdmin && (
                    <>
                      <Link to="/crm/employees" className="text-gray-700 hover:text-blue-600 transition font-medium">
                        👥 {t('crm.employees')}
                      </Link>
                      <Link to="/crm/connections" className="text-gray-700 hover:text-blue-600 transition font-medium">
                        🔗 {t('crm.connections')}
                      </Link>
                      <Link to="/crm/branding" className="text-gray-700 hover:text-blue-600 transition font-medium">
                        🎨 {t('crm.branding')}
                      </Link>
                    </>
                  )}
                </>
              )}
            </div>
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <>
                  <Link to="/profile" className="flex items-center space-x-2 text-sm text-gray-600 hover:text-blue-600 transition">
                    {user?.profilePictureUrl ? (
                      <img src={user.profilePictureUrl} alt="" className="w-7 h-7 rounded-full object-cover" />
                    ) : (
                      <span className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                        {user?.fullName?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                      </span>
                    )}
                    <span>{user?.fullName} {isAdmin && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">{t('nav.adminBadge')}</span>}</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="text-sm text-red-600 hover:text-red-800 transition"
                  >
                    {t('common.logout')}
                  </button>
                </>
              ) : (
                <Link to="/login" className="text-gray-700 hover:text-blue-600 transition">
                  {t('common.login')}
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
