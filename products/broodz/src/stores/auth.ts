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

const AUTH_URL = '/auth'

const authApi = axios.create({
  baseURL: AUTH_URL,
  timeout: 15000,
})

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const accessToken = ref<string | null>(
    process.env.CLIENT ? localStorage.getItem('bz_access_token') : null
  )
  const refreshTokenValue = ref<string | null>(
    process.env.CLIENT ? localStorage.getItem('bz_refresh_token') : null
  )

  const isLoggedIn = computed(() => !!accessToken.value)
  const mustChangePassword = computed(() => !!user.value?.mustChangePassword)

  // Restore user from localStorage (client only)
  if (process.env.CLIENT) {
    const savedUser = localStorage.getItem('bz_user')
    if (savedUser) {
      try { user.value = JSON.parse(savedUser) } catch { /* ignore */ }
    }

    // Check if saved token is expired — if so, clear auth
    if (accessToken.value) {
      try {
        const parts = accessToken.value.split('.')
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]))
          if (payload.exp && payload.exp * 1000 < Date.now()) {
            // Token expired — try refresh or clear
            if (refreshTokenValue.value) {
              // Attempt refresh on next tick (async)
              setTimeout(async () => {
                try {
                  await refreshAuth()
                } catch {
                  clearAuth()
                }
              }, 0)
            } else {
              clearAuth()
            }
          }
        }
      } catch {
        clearAuth()
      }
    }
  }

  function setAuth(tokens: AuthTokens, newUser: User) {
    accessToken.value = tokens.accessToken
    refreshTokenValue.value = tokens.refreshToken
    user.value = newUser
    if (process.env.CLIENT) {
      localStorage.setItem('bz_access_token', tokens.accessToken)
      localStorage.setItem('bz_refresh_token', tokens.refreshToken)
      localStorage.setItem('bz_user', JSON.stringify(newUser))
    }
  }

  function clearAuth() {
    accessToken.value = null
    refreshTokenValue.value = null
    user.value = null
    if (process.env.CLIENT) {
      localStorage.removeItem('bz_access_token')
      localStorage.removeItem('bz_refresh_token')
      localStorage.removeItem('bz_user')
    }
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
    const { data } = await authApi.post('/register', { name, email, password, product: 'broodz' })
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
    if (user.value) {
      user.value.mustChangePassword = false
      if (process.env.CLIENT) {
        localStorage.setItem('bz_user', JSON.stringify(user.value))
      }
    }
  }

  async function refreshAuth() {
    if (!refreshTokenValue.value) throw new Error('No refresh token')
    const { data } = await authApi.post('/refresh', { refreshToken: refreshTokenValue.value })
    accessToken.value = data.accessToken
    refreshTokenValue.value = data.refreshToken
    if (process.env.CLIENT) {
      localStorage.setItem('bz_access_token', data.accessToken)
      localStorage.setItem('bz_refresh_token', data.refreshToken)
    }
  }

  async function logout() {
    try {
      if (refreshTokenValue.value) {
        await authApi.post('/logout', { refreshToken: refreshTokenValue.value })
      }
    } catch { /* ignore logout errors */ }
    clearAuth()
  }

  return {
    user,
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
