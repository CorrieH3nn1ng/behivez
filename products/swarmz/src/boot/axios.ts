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
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}

api.interceptors.request.use(attachToken, (error) => Promise.reject(error));
authApi.interceptors.request.use(attachToken, (error) => Promise.reject(error));

// Response interceptor — handle 401 with token refresh
async function handle401(error: any) {
  const originalRequest = error.config;

  if (error.response?.status === 401 && !originalRequest._retry) {
    originalRequest._retry = true;

    try {
      const refreshToken = localStorage.getItem('sz_refresh_token');
      if (!refreshToken) throw new Error('No refresh token');

      const response = await authApi.post('/refresh', { refreshToken });
      const { accessToken } = response.data;
      localStorage.setItem('sz_access_token', accessToken);

      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      return api(originalRequest);
    } catch {
      localStorage.removeItem('sz_access_token');
      localStorage.removeItem('sz_refresh_token');
      localStorage.removeItem('sz_user');
      window.location.href = '/#/auth/login';
      return Promise.reject(error);
    }
  }

  return Promise.reject(error);
}

api.interceptors.response.use((r) => r, handle401);
authApi.interceptors.response.use((r) => r, handle401);

export default boot(({ app }) => {
  app.config.globalProperties.$axios = axios;
  app.config.globalProperties.$api = api;
});

export { api, authApi };
