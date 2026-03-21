import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function HomePage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="text-center py-16">
      <h1 className="text-5xl font-bold text-gray-900 mb-6">
        Sell Your Car with <span className="text-blue-600">CarDeal</span>
      </h1>
      <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
        Submit your car details and photos, receive a fair offer or consign it with us.
        Fast, transparent, and hassle-free.
      </p>
      <div className="flex justify-center space-x-4">
        {isAuthenticated ? (
          <>
            <Link
              to="/submit-car"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition"
            >
              Submit Your Car
            </Link>
            <Link
              to="/my-cars"
              className="border border-blue-600 text-blue-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-50 transition"
            >
              My Submissions
            </Link>
          </>
        ) : (
          <>
            <Link
              to="/register"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition"
            >
              Get Started
            </Link>
            <Link
              to="/login"
              className="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-gray-50 transition"
            >
              Sign In
            </Link>
          </>
        )}
      </div>

      <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
        <div className="p-6 bg-white rounded-xl shadow-sm">
          <div className="text-3xl mb-3">📸</div>
          <h3 className="text-lg font-semibold mb-2">Upload Photos</h3>
          <p className="text-gray-600 text-sm">Share up to 10 photos of your vehicle from every angle</p>
        </div>
        <div className="p-6 bg-white rounded-xl shadow-sm">
          <div className="text-3xl mb-3">💰</div>
          <h3 className="text-lg font-semibold mb-2">Get an Offer</h3>
          <p className="text-gray-600 text-sm">Receive a fair market offer within 24 hours</p>
        </div>
        <div className="p-6 bg-white rounded-xl shadow-sm">
          <div className="text-3xl mb-3">🤝</div>
          <h3 className="text-lg font-semibold mb-2">Sell or Consign</h3>
          <p className="text-gray-600 text-sm">Accept the offer or consign your car with us for the best price</p>
        </div>
      </div>
    </div>
  );
}
