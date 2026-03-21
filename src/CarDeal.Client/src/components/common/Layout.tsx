import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { messagesApi } from '../../api/messages';

export default function Layout() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

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
              <Link to="/" className="text-xl font-bold text-blue-600">
                🚗 CarDeal
              </Link>
              {isAuthenticated && (
                <>
                  <Link to="/my-cars" className="text-gray-700 hover:text-blue-600 transition">
                    My Cars
                  </Link>
                  <Link to="/submit-car" className="text-gray-700 hover:text-blue-600 transition">
                    Submit a Car
                  </Link>
                  <Link to="/inbox" className="text-gray-700 hover:text-blue-600 transition relative">
                    Messages
                    {(unreadCount ?? 0) > 0 && (
                      <span className="absolute -top-2 -right-4 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {unreadCount}
                      </span>
                    )}
                  </Link>
                  {isAdmin && (
                    <Link to="/admin" className="text-gray-700 hover:text-blue-600 transition font-medium">
                      ⚙ Admin
                    </Link>
                  )}
                </>
              )}
            </div>
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <>
                  <span className="text-sm text-gray-600">
                    {user?.fullName} {isAdmin && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">Admin</span>}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="text-sm text-red-600 hover:text-red-800 transition"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="text-gray-700 hover:text-blue-600 transition">
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm"
                  >
                    Register
                  </Link>
                </>
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
