import { defineStore } from 'pinia';
import { api } from 'boot/axios';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'MANAGER' | 'STAFF';
  branchId: string;
  branchName: string;
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
    fullName: (state) => state.user ? `${state.user.firstName} ${state.user.lastName}` : '',
    isAdmin: (state) => state.user?.role === 'ADMIN',
    isManager: (state) => state.user?.role === 'MANAGER' || state.user?.role === 'ADMIN',
  },

  actions: {
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
      } catch (error: any) {
        return {
          success: false,
          error: error.response?.data?.message || 'Login failed'
        };
      } finally {
        this.isLoading = false;
      }
    },

    enterDemoMode() {
      const demoUser: User = {
        id: 'demo-001',
        email: 'demo@swarmz.co.za',
        firstName: 'Demo',
        lastName: 'Manager',
        role: 'ADMIN',
        branchId: 'branch-main',
        branchName: 'Main Branch',
      };
      localStorage.setItem('accessToken', 'demo-token');
      this.user = demoUser;
      this.isAuthenticated = true;
      return { success: true };
    },

    async logout() {
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          await api.post('/auth/logout', { refreshToken });
        }
      } catch {
        // Ignore logout errors
      } finally {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        this.user = null;
        this.isAuthenticated = false;
      }
    },

    async fetchUser() {
      if (!localStorage.getItem('accessToken')) return;

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
