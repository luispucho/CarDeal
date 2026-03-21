import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/common/Layout';
import ProtectedRoute from './components/common/ProtectedRoute';
import HomePage from './pages/HomePage';
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
import InventoryPage from './pages/InventoryPage';
import PublicCarDetailPage from './pages/PublicCarDetailPage';
import NotFoundPage from './pages/NotFoundPage';

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
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/inventory" element={<InventoryPage />} />
              <Route path="/inventory/:id" element={<PublicCarDetailPage />} />
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
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
