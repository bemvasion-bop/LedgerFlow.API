import axios from 'axios';
import { API_ENDPOINT } from '../config/api.config';

const api = axios.create({
  baseURL: API_ENDPOINT,
});

// Helper to get token from either storage
const getStoredToken = (): string | null => {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
};

// Helper to clear all auth data from both storages
const clearAuthStorage = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('role');
  localStorage.removeItem('user');
  localStorage.removeItem('expiresAt');
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('role');
  sessionStorage.removeItem('user');
  sessionStorage.removeItem('expiresAt');
};

// Attach JWT to every request from localStorage OR sessionStorage
api.interceptors.request.use(
  (config) => {
    const token = getStoredToken();
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      } as any;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// On 401: clear storage and redirect to login.
// Only redirect if we actually had a token (session expired, not a failed login)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const hadToken = !!getStoredToken();
      
      // Only clear and redirect if:
      // 1. We had a token (session expired)
      // 2. This is NOT a login attempt
      const isLoginAttempt = error.config?.url?.includes('/auth/login');
      
      if (hadToken && !isLoginAttempt) {
        clearAuthStorage();
        delete api.defaults.headers.common['Authorization'];
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
