import { defineStore } from 'pinia';
import { api } from 'boot/axios';
import type { PlanType } from 'src/types';

export interface User {
  id: string;
  email: string;
  name: string;
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
    isAuthenticated: !!localStorage.getItem('accessToken'),
    isLoading: false,
  }),

  getters: {
    fullName: (state) => state.user?.name || '',
    isFleetPlan: (state) => state.user?.plan === 'fleet',
    isDemoMode: () => localStorage.getItem('accessToken') === 'demo-token',
  },

  actions: {
    enterDemoMode() {
      const demoUser: User = {
        id: 'demo-001',
        email: 'demo@swarmz.co.za',
        name: 'Demo User',
        plan: 'fleet',
        fleetName: 'Demo Fleet',
      };
      localStorage.setItem('accessToken', 'demo-token');
      this.user = demoUser;
      this.isAuthenticated = true;
      return { success: true };
    },

    async register(name: string, email: string, password: string, plan: PlanType) {
      this.isLoading = true;
      try {
        const response = await api.post('/auth/register', { name, email, password, plan });
        const { accessToken, refreshToken, user } = response.data;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        this.user = user;
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
        const response = await api.post('/auth/login', { email, password });
        const { accessToken, refreshToken, user } = response.data;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        this.user = user;
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
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          await api.post('/auth/logout', { refreshToken });
        }
      } catch {
        // Ignore
      } finally {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        this.user = null;
        this.isAuthenticated = false;
      }
    },

    async fetchUser() {
      if (!localStorage.getItem('accessToken')) return;
      if (this.isDemoMode) {
        this.enterDemoMode();
        return;
      }
      this.isLoading = true;
      try {
        const response = await api.get('/auth/me');
        this.user = response.data;
        this.isAuthenticated = true;
      } catch {
        this.user = null;
        this.isAuthenticated = false;
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      } finally {
        this.isLoading = false;
      }
    },
  },
});
