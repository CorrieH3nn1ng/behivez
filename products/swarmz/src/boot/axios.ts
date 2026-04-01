import { boot } from 'quasar/wrappers';
import axios, { AxiosInstance } from 'axios';

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $axios: AxiosInstance;
    $api: AxiosInstance;
  }
}

// Auth API — shared auth-api proxied by nginx at /auth/*
const authApi = axios.create({
  baseURL: import.meta.env.VITE_AUTH_URL || '/auth',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Product API — Swarmz Express backend proxied by nginx at /api/*
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — attach JWT to both APIs
function attachToken(config: any) {
  const token = localStorage.getItem('sz_access_token');
  if (token && token !== 'demo-token') {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}

api.interceptors.request.use(attachToken, (error) => Promise.reject(error));
authApi.interceptors.request.use(attachToken, (error) => Promise.reject(error));

// Track if we're already refreshing to prevent multiple simultaneous refreshes
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function onTokenRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

function addRefreshSubscriber(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function clearAuthAndRedirect() {
  localStorage.removeItem('sz_access_token');
  localStorage.removeItem('sz_refresh_token');
  localStorage.removeItem('sz_user');
  window.location.href = '/#/auth/login';
}

// Response interceptor for api — handle 401 with token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If no response at all (network error), reject immediately
    if (!error.response) {
      return Promise.reject(error);
    }

    // Only handle 401 and only retry once
    if (error.response.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    const refreshToken = localStorage.getItem('sz_refresh_token');
    if (!refreshToken) {
      clearAuthAndRedirect();
      return Promise.reject(error);
    }

    // If already refreshing, queue this request
    if (isRefreshing) {
      return new Promise((resolve) => {
        addRefreshSubscriber((newToken: string) => {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          resolve(api(originalRequest));
        });
      });
    }

    isRefreshing = true;

    try {
      // Use plain axios for refresh — NOT authApi — to avoid interceptor loops
      const response = await axios.post(
        (import.meta.env.VITE_AUTH_URL || '/auth') + '/refresh',
        { refreshToken },
        { timeout: 10000 }
      );

      const { accessToken, refreshToken: newRefreshToken } = response.data;
      localStorage.setItem('sz_access_token', accessToken);
      if (newRefreshToken) {
        localStorage.setItem('sz_refresh_token', newRefreshToken);
      }

      isRefreshing = false;
      onTokenRefreshed(accessToken);

      // Retry original request with new token
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      return api(originalRequest);
    } catch {
      isRefreshing = false;
      refreshSubscribers = [];
      clearAuthAndRedirect();
      return Promise.reject(error);
    }
  }
);

// authApi does NOT get a 401 interceptor — no circular refresh loops

export default boot(({ app }) => {
  app.config.globalProperties.$axios = axios;
  app.config.globalProperties.$api = api;
});

export { api, authApi };
