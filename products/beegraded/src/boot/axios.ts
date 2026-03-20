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

export default boot(({ app }) => {
  app.config.globalProperties.$axios = axios
  app.config.globalProperties.$api = api
})

export { api, backendApi }
