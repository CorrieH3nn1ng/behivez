import axios from 'axios';
import { authApi } from './auth.api';

// API client for Pollenz Laravel backend (financial data only)
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8001/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor: attach JWT access token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('pz_access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: on 401, attempt token refresh then retry
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
}> = [];

function processQueue(error: unknown) {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(undefined);
    }
  });
  failedQueue = [];
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      const refreshToken = localStorage.getItem('pz_refresh_token');

      if (!refreshToken) {
        // No refresh token — clear auth and redirect
        localStorage.removeItem('pz_access_token');
        localStorage.removeItem('pz_refresh_token');
        localStorage.removeItem('pz_user');
        window.location.href = '/login';
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Queue this request while refresh is in progress
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => {
          originalRequest.headers.Authorization = `Bearer ${localStorage.getItem('pz_access_token')}`;
          return apiClient(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await authApi.refresh(refreshToken);
        localStorage.setItem('pz_access_token', data.accessToken);
        localStorage.setItem('pz_refresh_token', data.refreshToken);
        processQueue(null);
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        localStorage.removeItem('pz_access_token');
        localStorage.removeItem('pz_refresh_token');
        localStorage.removeItem('pz_user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
