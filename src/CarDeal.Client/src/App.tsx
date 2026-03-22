import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/common/Layout';
import ProtectedRoute from './components/common/ProtectedRoute';
import SaasLandingPage from './pages/SaasLandingPage';
import TenantLandingPage from './pages/TenantLandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import MyCarsPage from './pages/MyCarsPage';
import SubmitCarPage from './pages/SubmitCarPage';
import CarDetailPage from './pages/CarDetailPage';
import InboxPage from './pages/InboxPage';
import ProfilePage from './pages/ProfilePage';
import DashboardPage from './pages/admin/DashboardPage';
import CarReviewPage from './pages/admin/CarReviewPage';
import MakeOfferPage from './pages/admin/MakeOfferPage';
import ConsignmentsPage from './pages/admin/ConsignmentsPage';
import TenantsPage from './pages/admin/TenantsPage';
import InventoryPage from './pages/InventoryPage';
import ComparePage from './pages/ComparePage';
import PublicCarDetailPage from './pages/PublicCarDetailPage';
import NotFoundPage from './pages/NotFoundPage';
import CrmDashboardPage from './pages/crm/CrmDashboardPage';
import CrmInventoryPage from './pages/crm/CrmInventoryPage';
import CrmCarDetailPage from './pages/crm/CrmCarDetailPage';
import CrmEmployeesPage from './pages/crm/CrmEmployeesPage';
import CrmConnectionsPage from './pages/crm/CrmConnectionsPage';
import CrmBrandingPage from './pages/crm/CrmBrandingPage';
import CrmInvestorsPage from './pages/crm/CrmInvestorsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              {/* Root redirects to SaaS landing */}
              <Route path="/" element={<Navigate to="/0" replace />} />
              <Route path="/0" element={<SaasLandingPage />} />

              {/* Non-tenant routes (must come before /:tenantIdOrSlug catch-all) */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/inventory" element={<InventoryPage />} />
              <Route path="/inventory/:id" element={<PublicCarDetailPage />} />
              <Route path="/compare" element={<ComparePage />} />
              <Route
                path="/my-cars"
                element={<ProtectedRoute><MyCarsPage /></ProtectedRoute>}
              />
              <Route
                path="/submit-car"
                element={<ProtectedRoute><SubmitCarPage /></ProtectedRoute>}
              />
              <Route
                path="/cars/:id"
                element={<ProtectedRoute><CarDetailPage /></ProtectedRoute>}
              />
              <Route
                path="/inbox"
                element={<ProtectedRoute><InboxPage /></ProtectedRoute>}
              />
              <Route
                path="/profile"
                element={<ProtectedRoute><ProfilePage /></ProtectedRoute>}
              />
              <Route
                path="/admin"
                element={<ProtectedRoute requireAdmin><DashboardPage /></ProtectedRoute>}
              />
              <Route
                path="/admin/cars/:id"
                element={<ProtectedRoute requireAdmin><CarReviewPage /></ProtectedRoute>}
              />
              <Route
                path="/admin/cars/:id/offer"
                element={<ProtectedRoute requireAdmin><MakeOfferPage /></ProtectedRoute>}
              />
              <Route
                path="/admin/consignments"
                element={<ProtectedRoute requireAdmin><ConsignmentsPage /></ProtectedRoute>}
              />
              <Route
                path="/admin/tenants"
                element={<ProtectedRoute requireAdmin><TenantsPage /></ProtectedRoute>}
              />
              <Route
                path="/crm"
                element={<ProtectedRoute><CrmDashboardPage /></ProtectedRoute>}
              />
              <Route
                path="/crm/inventory"
                element={<ProtectedRoute><CrmInventoryPage /></ProtectedRoute>}
              />
              <Route
                path="/crm/inventory/:id"
                element={<ProtectedRoute><CrmCarDetailPage /></ProtectedRoute>}
              />
              <Route
                path="/crm/employees"
                element={<ProtectedRoute><CrmEmployeesPage /></ProtectedRoute>}
              />
              <Route
                path="/crm/connections"
                element={<ProtectedRoute><CrmConnectionsPage /></ProtectedRoute>}
              />
              <Route
                path="/crm/branding"
                element={<ProtectedRoute><CrmBrandingPage /></ProtectedRoute>}
              />
              <Route
                path="/crm/investors"
                element={<ProtectedRoute><CrmInvestorsPage /></ProtectedRoute>}
              />

              {/* Tenant-scoped routes (catch-all — must come after specific routes) */}
              <Route path="/:tenantIdOrSlug" element={<TenantLandingPage />} />
              <Route path="/:tenantIdOrSlug/inventory" element={<InventoryPage />} />
              <Route path="/:tenantIdOrSlug/inventory/:id" element={<PublicCarDetailPage />} />

              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
