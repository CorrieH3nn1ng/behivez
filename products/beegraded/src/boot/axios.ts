import { boot } from 'quasar/wrappers'
import axios, { type AxiosInstance } from 'axios'

declare module 'vue' {
  interface ComponentCustomProperties {
    $axios: AxiosInstance
    $api: AxiosInstance
  }
}

// Webhook API for n8n endpoints (paper upload, evaluate, etc.)
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5678/webhook',
  timeout: 300000, // 5 min — dual AI (Claude + Gemini) can take a while
})

// Backend API for Express/Prisma endpoints (evaluations, papers, etc.)
const backendApi = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL || '/api',
  timeout: 30000,
})

// Attach JWT access token to both API instances
function attachToken(config: any) {
  const token = localStorage.getItem('bg_access_token') || localStorage.getItem('bg_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
}

api.interceptors.request.use(attachToken)
backendApi.interceptors.request.use(attachToken)

// Handle 401 — try refresh token, redirect to login if that fails
let isRefreshing = false
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: any) => void }> = []

function processQueue(error: any, token: string | null) {
  failedQueue.forEach(prom => {
    if (token) prom.resolve(token)
    else prom.reject(error)
  })
  failedQueue = []
}

function handle401(error: any) {
  const originalRequest = error.config
  if (!originalRequest || originalRequest._retry) {
    // Already retried — go to login
    clearAndRedirect()
    return Promise.reject(error)
  }

  if (isRefreshing) {
    // Queue this request until refresh completes
    return new Promise((resolve, reject) => {
      failedQueue.push({ resolve, reject })
    }).then(token => {
      originalRequest.headers.Authorization = `Bearer ${token}`
      return axios(originalRequest)
    })
  }

  originalRequest._retry = true
  isRefreshing = true

  const refreshToken = localStorage.getItem('bg_refresh_token')
  if (!refreshToken) {
    isRefreshing = false
    clearAndRedirect()
    return Promise.reject(error)
  }

  return axios.post('/auth/refresh', { refreshToken })
    .then(({ data }) => {
      const newToken = data.accessToken
      localStorage.setItem('bg_access_token', newToken)
      localStorage.setItem('bg_token', newToken)
      if (data.refreshToken) {
        localStorage.setItem('bg_refresh_token', data.refreshToken)
      }
      processQueue(null, newToken)
      originalRequest.headers.Authorization = `Bearer ${newToken}`
      return axios(originalRequest)
    })
    .catch(refreshError => {
      processQueue(refreshError, null)
      clearAndRedirect()
      return Promise.reject(refreshError)
    })
    .finally(() => {
      isRefreshing = false
    })
}

function clearAndRedirect() {
  localStorage.removeItem('bg_access_token')
  localStorage.removeItem('bg_refresh_token')
  localStorage.removeItem('bg_user')
  localStorage.removeItem('bg_token')
  // Only redirect if on a protected page
  if (window.location.hash.includes('/workspace')) {
    window.location.hash = '#/get-started'
  }
}

// Add 401 interceptor to both API instances
api.interceptors.response.use(res => res, error => {
  if (error.response?.status === 401) return handle401(error)
  return Promise.reject(error)
})

backendApi.interceptors.response.use(res => res, error => {
  if (error.response?.status === 401) return handle401(error)
  return Promise.reject(error)
})

export default boot(({ app }) => {
  app.config.globalProperties.$axios = axios
  app.config.globalProperties.$api = api
})

export { api, backendApi }
