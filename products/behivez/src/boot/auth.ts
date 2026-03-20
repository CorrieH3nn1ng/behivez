import { boot } from 'quasar/wrappers'
import axios from 'axios'

export default boot(() => {
  // Axios interceptor: attach JWT from localStorage to /admin/* and /auth/* requests
  axios.interceptors.request.use((config) => {
    const token = localStorage.getItem('bh_access_token')
    if (token && (config.url?.startsWith('/admin') || config.url?.startsWith('/auth'))) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  })

  // Axios interceptor: on 401, try refresh then retry
  axios.interceptors.response.use(
    (res) => res,
    async (error) => {
      const original = error.config
      const refreshToken = localStorage.getItem('bh_refresh_token')
      if (error.response?.status === 401 && !original._retry && refreshToken) {
        original._retry = true
        try {
          const { data } = await axios.post('/auth/refresh', { refreshToken })
          localStorage.setItem('bh_access_token', data.accessToken)
          localStorage.setItem('bh_refresh_token', data.refreshToken)
          original.headers.Authorization = `Bearer ${data.accessToken}`
          return axios(original)
        } catch {
          localStorage.removeItem('bh_access_token')
          localStorage.removeItem('bh_refresh_token')
          localStorage.removeItem('bh_user')
          window.location.hash = '#/admin/login'
        }
      }
      return Promise.reject(error)
    },
  )
})
