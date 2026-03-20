import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { authApi, type AuthUser } from '@/services/api/auth.api';

export const useUserStore = defineStore('user', () => {
  const user = ref<AuthUser | null>(null);
  const accessToken = ref<string | null>(localStorage.getItem('pz_access_token'));
  const refreshTokenValue = ref<string | null>(localStorage.getItem('pz_refresh_token'));

  const isAuthenticated = computed(() => !!accessToken.value);
  const mustChangePassword = computed(() => !!user.value?.mustChangePassword);

  // Restore user from localStorage on init
  const saved = localStorage.getItem('pz_user');
  if (saved) {
    try { user.value = JSON.parse(saved); } catch { /* ignore */ }
  }

  function setAuth(tokens: { accessToken: string; refreshToken: string }, newUser: AuthUser) {
    accessToken.value = tokens.accessToken;
    refreshTokenValue.value = tokens.refreshToken;
    user.value = newUser;
    localStorage.setItem('pz_access_token', tokens.accessToken);
    localStorage.setItem('pz_refresh_token', tokens.refreshToken);
    localStorage.setItem('pz_user', JSON.stringify(newUser));
  }

  function clearAuth() {
    accessToken.value = null;
    refreshTokenValue.value = null;
    user.value = null;
    localStorage.removeItem('pz_access_token');
    localStorage.removeItem('pz_refresh_token');
    localStorage.removeItem('pz_user');
  }

  async function login(email: string, password: string) {
    const { data } = await authApi.login({ email, password });
    setAuth(
      { accessToken: data.accessToken, refreshToken: data.refreshToken },
      data.user,
    );
    return data.user;
  }

  async function register(name: string, email: string, password: string) {
    const { data } = await authApi.register({ name, email, password });
    setAuth(
      { accessToken: data.accessToken, refreshToken: data.refreshToken },
      data.user,
    );
    return data.user;
  }

  async function changePassword(currentPassword: string, newPassword: string) {
    if (!accessToken.value) throw new Error('Not authenticated');
    await authApi.changePassword(accessToken.value, { currentPassword, newPassword });
    if (user.value) {
      user.value.mustChangePassword = false;
      localStorage.setItem('pz_user', JSON.stringify(user.value));
    }
  }

  async function refreshAuth() {
    if (!refreshTokenValue.value) throw new Error('No refresh token');
    const { data } = await authApi.refresh(refreshTokenValue.value);
    accessToken.value = data.accessToken;
    refreshTokenValue.value = data.refreshToken;
    localStorage.setItem('pz_access_token', data.accessToken);
    localStorage.setItem('pz_refresh_token', data.refreshToken);
  }

  async function fetchUser() {
    if (!accessToken.value) return;
    try {
      const { data } = await authApi.getMe(accessToken.value);
      user.value = data;
      localStorage.setItem('pz_user', JSON.stringify(data));
    } catch {
      logout();
    }
  }

  async function logout() {
    try {
      if (refreshTokenValue.value) {
        await authApi.logout(refreshTokenValue.value);
      }
    } catch { /* ignore logout errors */ }
    clearAuth();
  }

  return {
    user,
    accessToken,
    refreshTokenValue,
    isAuthenticated,
    mustChangePassword,
    login,
    register,
    changePassword,
    refreshAuth,
    fetchUser,
    logout,
    clearAuth,
  };
});
