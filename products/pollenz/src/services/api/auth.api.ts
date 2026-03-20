import axios from 'axios';

// Auth API — calls the shared BeHivez auth-api via nginx proxy
// In production: https://pollenz.co.za/auth/*
// In dev: /auth/* (proxy or direct)
const authClient = axios.create({
  baseURL: '/auth',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  mustChangePassword?: boolean;
  products?: string[];
  // Pollenz-specific fields (loaded from Laravel backend, not from auth API)
  profile_type?: 'freelancer' | 'salary' | null;
  created_at?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export const authApi = {
  login(data: { email: string; password: string }) {
    return authClient.post<AuthResponse>('/login', data);
  },

  register(data: { name: string; email: string; password: string }) {
    return authClient.post<AuthResponse>('/register', { ...data, product: 'pollenz' });
  },

  refresh(refreshToken: string) {
    return authClient.post<{ accessToken: string; refreshToken: string }>('/refresh', { refreshToken });
  },

  logout(refreshToken: string) {
    return authClient.post('/logout', { refreshToken });
  },

  getMe(accessToken: string) {
    return authClient.get<AuthUser>('/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  },

  changePassword(accessToken: string, data: { currentPassword: string; newPassword: string }) {
    return authClient.post('/change-password', data, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  },

  forgotPassword(email: string) {
    return authClient.post('/forgot-password', { email });
  },

  resetPassword(data: { token: string; newPassword: string }) {
    return authClient.post('/reset-password', data);
  },
};
