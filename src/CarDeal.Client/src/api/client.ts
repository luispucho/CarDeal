import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://cardeal-api.azurewebsites.net/api';

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
    // Only auto-redirect on 401 if we had a token (session expired), not on login attempts
    if (error.response?.status === 401) {
      const hadToken = localStorage.getItem('token');
      if (hadToken) {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
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
