import { boot } from 'quasar/wrappers'
import axios, { type AxiosInstance } from 'axios'

declare module 'vue' {
  interface ComponentCustomProperties {
    $axios: AxiosInstance
    $api: AxiosInstance
  }
}

// Broodz API (Express/Prisma server)
// Server-side: use internal URL; Client-side: use public URL via nginx proxy
const baseURL = process.env.SERVER
  ? (import.meta.env.VITE_SSR_API_URL || 'http://localhost:3200')
  : (import.meta.env.VITE_API_URL || 'http://localhost:3200')

const api = axios.create({
  baseURL,
  timeout: 180000,
})

// Attach JWT access token to webhook API calls (client only)
if (process.env.CLIENT) {
  api.interceptors.request.use((config) => {
    const token = localStorage.getItem('bz_access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  })
}

export default boot(({ app }) => {
  app.config.globalProperties.$axios = axios
  app.config.globalProperties.$api = api
})

export { api }
