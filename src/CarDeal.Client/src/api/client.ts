import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://localhost:7001/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    // Surface tier-required errors so components can react
    if (error.response?.status === 403 && error.response?.data?.error === 'tier_required') {
      error.tierInfo = {
        requiredTier: error.response.data.requiredTier,
        currentTier: error.response.data.currentTier,
      };
    }
    return Promise.reject(error);
  }
);

export default apiClient;
