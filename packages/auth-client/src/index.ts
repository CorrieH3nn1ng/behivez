import axios, { AxiosInstance } from 'axios';
import type {
  AuthClientConfig,
  AuthResponse,
  AuthTokens,
  AuthUser,
} from './types.js';

export type { AuthUser, AuthTokens, AuthResponse, AuthClientConfig, SubscriptionInfo } from './types.js';

export function createAuthClient(config: AuthClientConfig) {
  const api: AxiosInstance = axios.create({
    baseURL: config.baseUrl,
    headers: { 'Content-Type': 'application/json' },
  });

  // Attach access token to every request
  api.interceptors.request.use((req) => {
    const tokens = config.getStoredTokens?.();
    if (tokens?.accessToken) {
      req.headers.Authorization = `Bearer ${tokens.accessToken}`;
    }
    return req;
  });

  // Auto-refresh on 401
  api.interceptors.response.use(
    (res) => res,
    async (error) => {
      const original = error.config;
      if (
        error.response?.status === 401 &&
        !original._retry &&
        original.url !== '/auth/refresh' &&
        original.url !== '/auth/login'
      ) {
        original._retry = true;
        const tokens = config.getStoredTokens?.();
        if (tokens?.refreshToken) {
          try {
            const { data } = await api.post<AuthTokens>('/auth/refresh', {
              refreshToken: tokens.refreshToken,
            });
            config.onTokenRefreshed?.(data);
            original.headers.Authorization = `Bearer ${data.accessToken}`;
            return api(original);
          } catch {
            // Refresh failed — caller should handle logout
          }
        }
      }
      return Promise.reject(error);
    }
  );

  return {
    async register(name: string, email: string, password: string, product?: string): Promise<AuthResponse> {
      const { data } = await api.post<AuthResponse>('/auth/register', { name, email, password, product });
      return data;
    },

    async login(email: string, password: string): Promise<AuthResponse> {
      const { data } = await api.post<AuthResponse>('/auth/login', { email, password });
      return data;
    },

    async forgotPassword(email: string): Promise<void> {
      await api.post('/auth/forgot-password', { email });
    },

    async resetPassword(token: string, password: string): Promise<void> {
      await api.post('/auth/reset-password', { token, password });
    },

    async changePassword(currentPassword: string, newPassword: string): Promise<void> {
      await api.post('/auth/change-password', { currentPassword, newPassword });
    },

    async refresh(refreshToken: string): Promise<AuthTokens> {
      const { data } = await api.post<AuthTokens>('/auth/refresh', { refreshToken });
      return data;
    },

    async logout(refreshToken: string): Promise<void> {
      await api.post('/auth/logout', { refreshToken });
    },

    async me(): Promise<AuthUser> {
      const { data } = await api.get<AuthUser>('/auth/me');
      return data;
    },
  };
}
