import { defineStore } from 'pinia';
import { authApi } from 'boot/axios';
import type { PlanType } from 'src/types';

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  plan: PlanType;
  fleetName?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    isAuthenticated: !!localStorage.getItem('sz_access_token'),
    isLoading: false,
  }),

  getters: {
    fullName: (state) => state.user?.name || '',
    isFleetPlan: (state) => state.user?.plan === 'fleet',
    isDemoMode: () => localStorage.getItem('sz_access_token') === 'demo-token',
  },

  actions: {
    enterDemoMode() {
      const demoUser: User = {
        id: 'demo-001',
        email: 'demo@swarmz.co.za',
        name: 'Demo User',
        role: 'USER',
        plan: 'fleet',
        fleetName: 'Demo Fleet',
      };
      localStorage.setItem('sz_access_token', 'demo-token');
      localStorage.setItem('sz_user', JSON.stringify(demoUser));
      this.user = demoUser;
      this.isAuthenticated = true;
      return { success: true };
    },

    async register(name: string, email: string, password: string, plan: PlanType) {
      this.isLoading = true;
      try {
        const response = await authApi.post('/register', {
          name, email, password, product: 'swarmz',
        });
        const { accessToken, refreshToken, user } = response.data;
        localStorage.setItem('sz_access_token', accessToken);
        localStorage.setItem('sz_refresh_token', refreshToken);
        localStorage.setItem('sz_user', JSON.stringify({ ...user, plan }));
        this.user = { ...user, plan };
        this.isAuthenticated = true;
        return { success: true };
      } catch (error: unknown) {
        const err = error as { response?: { data?: { message?: string } } };
        return { success: false, error: err.response?.data?.message || 'Registration failed' };
      } finally {
        this.isLoading = false;
      }
    },

    async login(email: string, password: string) {
      this.isLoading = true;
      try {
        const response = await authApi.post('/login', { email, password });
        const { accessToken, refreshToken, user } = response.data;
        localStorage.setItem('sz_access_token', accessToken);
        localStorage.setItem('sz_refresh_token', refreshToken);
        localStorage.setItem('sz_user', JSON.stringify(user));
        this.user = { ...user, plan: user.plan || 'solo' };
        this.isAuthenticated = true;
        return { success: true };
      } catch (error: unknown) {
        const err = error as { response?: { data?: { message?: string } } };
        return { success: false, error: err.response?.data?.message || 'Login failed' };
      } finally {
        this.isLoading = false;
      }
    },

    async logout() {
      try {
        const refreshToken = localStorage.getItem('sz_refresh_token');
        if (refreshToken) {
          await authApi.post('/logout', { refreshToken });
        }
      } catch {
        // Ignore
      } finally {
        localStorage.removeItem('sz_access_token');
        localStorage.removeItem('sz_refresh_token');
        localStorage.removeItem('sz_user');
        this.user = null;
        this.isAuthenticated = false;
      }
    },

    async fetchUser() {
      if (!localStorage.getItem('sz_access_token')) return;
      if (this.isDemoMode) {
        this.enterDemoMode();
        return;
      }
      this.isLoading = true;
      try {
        const response = await authApi.get('/me');
        this.user = { ...response.data, plan: response.data.plan || 'solo' };
        this.isAuthenticated = true;
        localStorage.setItem('sz_user', JSON.stringify(this.user));
      } catch {
        this.user = null;
        this.isAuthenticated = false;
        localStorage.removeItem('sz_access_token');
        localStorage.removeItem('sz_refresh_token');
        localStorage.removeItem('sz_user');
      } finally {
        this.isLoading = false;
      }
    },

    loadFromStorage() {
      const stored = localStorage.getItem('sz_user');
      if (stored) {
        try {
          this.user = JSON.parse(stored);
          this.isAuthenticated = true;
        } catch {
          // Ignore
        }
      }
    },
  },
});
