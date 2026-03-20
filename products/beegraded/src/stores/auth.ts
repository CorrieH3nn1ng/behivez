import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'

interface User {
  id: string
  email: string
  name: string
  role: string
  mustChangePassword?: boolean
  products?: string[]
}

interface AuthTokens {
  accessToken: string
  refreshToken: string
}

const AUTH_URL = import.meta.env.VITE_AUTH_URL || '/auth'

const authApi = axios.create({
  baseURL: AUTH_URL,
  timeout: 15000,
})

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const accessToken = ref<string | null>(localStorage.getItem('bg_access_token'))
  const refreshTokenValue = ref<string | null>(localStorage.getItem('bg_refresh_token'))

  const isLoggedIn = computed(() => !!accessToken.value)
  const mustChangePassword = computed(() => !!user.value?.mustChangePassword)

  // Restore user from localStorage
  const savedUser = localStorage.getItem('bg_user')
  if (savedUser) {
    try { user.value = JSON.parse(savedUser) } catch { /* ignore */ }
  }

  function setAuth(tokens: AuthTokens, newUser: User) {
    accessToken.value = tokens.accessToken
    refreshTokenValue.value = tokens.refreshToken
    user.value = newUser
    localStorage.setItem('bg_access_token', tokens.accessToken)
    localStorage.setItem('bg_refresh_token', tokens.refreshToken)
    localStorage.setItem('bg_user', JSON.stringify(newUser))
    // Keep bg_token for backward compat with webhook API calls
    localStorage.setItem('bg_token', tokens.accessToken)
  }

  function clearAuth() {
    accessToken.value = null
    refreshTokenValue.value = null
    user.value = null
    localStorage.removeItem('bg_access_token')
    localStorage.removeItem('bg_refresh_token')
    localStorage.removeItem('bg_user')
    localStorage.removeItem('bg_token')
  }

  async function login(email: string, password: string) {
    const { data } = await authApi.post('/login', { email, password })
    setAuth(
      { accessToken: data.accessToken, refreshToken: data.refreshToken },
      data.user,
    )
    return data.user as User
  }

  async function register(name: string, email: string, password: string) {
    const { data } = await authApi.post('/register', { name, email, password, product: 'beegraded' })
    setAuth(
      { accessToken: data.accessToken, refreshToken: data.refreshToken },
      data.user,
    )
    return data.user as User
  }

  async function changePassword(currentPassword: string, newPassword: string) {
    await authApi.post('/change-password', { currentPassword, newPassword }, {
      headers: { Authorization: `Bearer ${accessToken.value}` },
    })
    // Clear flag locally
    if (user.value) {
      user.value.mustChangePassword = false
      localStorage.setItem('bg_user', JSON.stringify(user.value))
    }
  }

  async function refreshAuth() {
    if (!refreshTokenValue.value) throw new Error('No refresh token')
    const { data } = await authApi.post('/refresh', { refreshToken: refreshTokenValue.value })
    accessToken.value = data.accessToken
    refreshTokenValue.value = data.refreshToken
    localStorage.setItem('bg_access_token', data.accessToken)
    localStorage.setItem('bg_refresh_token', data.refreshToken)
    localStorage.setItem('bg_token', data.accessToken)
  }

  async function logout() {
    try {
      if (refreshTokenValue.value) {
        await authApi.post('/logout', { refreshToken: refreshTokenValue.value })
      }
    } catch { /* ignore logout errors */ }
    clearAuth()
  }

  // Legacy compat
  const token = accessToken

  return {
    user,
    token,
    accessToken,
    isLoggedIn,
    mustChangePassword,
    login,
    register,
    changePassword,
    refreshAuth,
    logout,
    setAuth,
    clearAuth,
  }
})
