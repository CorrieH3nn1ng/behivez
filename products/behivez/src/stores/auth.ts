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

const AUTH_URL = '/auth'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const accessToken = ref<string | null>(localStorage.getItem('bh_access_token'))
  const refreshToken = ref<string | null>(localStorage.getItem('bh_refresh_token'))

  const isLoggedIn = computed(() => !!accessToken.value)
  const isAdmin = computed(() => {
    const role = user.value?.role
    return role === 'OWNER' || role === 'ADMIN'
  })

  // Restore user from localStorage
  const savedUser = localStorage.getItem('bh_user')
  if (savedUser) {
    try { user.value = JSON.parse(savedUser) } catch { /* ignore */ }
  }

  function setAuth(tokens: { accessToken: string; refreshToken: string }, newUser: User) {
    accessToken.value = tokens.accessToken
    refreshToken.value = tokens.refreshToken
    user.value = newUser
    localStorage.setItem('bh_access_token', tokens.accessToken)
    localStorage.setItem('bh_refresh_token', tokens.refreshToken)
    localStorage.setItem('bh_user', JSON.stringify(newUser))
  }

  function clearAuth() {
    accessToken.value = null
    refreshToken.value = null
    user.value = null
    localStorage.removeItem('bh_access_token')
    localStorage.removeItem('bh_refresh_token')
    localStorage.removeItem('bh_user')
  }

  async function login(email: string, password: string) {
    const { data } = await axios.post(`${AUTH_URL}/login`, { email, password })
    setAuth(
      { accessToken: data.accessToken, refreshToken: data.refreshToken },
      data.user,
    )
    return data.user as User
  }

  async function refreshAuth() {
    if (!refreshToken.value) throw new Error('No refresh token')
    const { data } = await axios.post(`${AUTH_URL}/refresh`, { refreshToken: refreshToken.value })
    accessToken.value = data.accessToken
    refreshToken.value = data.refreshToken
    localStorage.setItem('bh_access_token', data.accessToken)
    localStorage.setItem('bh_refresh_token', data.refreshToken)
  }

  async function register(name: string, email: string, password: string) {
    const { data } = await axios.post(`${AUTH_URL}/register`, { name, email, password })
    setAuth(
      { accessToken: data.accessToken, refreshToken: data.refreshToken },
      data.user,
    )
    return data.user as User
  }

  async function logout() {
    try {
      if (refreshToken.value) {
        await axios.post(`${AUTH_URL}/logout`, { refreshToken: refreshToken.value })
      }
    } catch { /* ignore */ }
    clearAuth()
  }

  return {
    user,
    accessToken,
    refreshToken,
    isLoggedIn,
    isAdmin,
    login,
    register,
    refreshAuth,
    logout,
  }
})
