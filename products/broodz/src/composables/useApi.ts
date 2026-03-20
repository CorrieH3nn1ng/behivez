import { api } from 'src/boot/axios'
import type { AxiosRequestConfig } from 'axios'

export function useApi() {
  async function get<T = unknown>(url: string, config?: AxiosRequestConfig) {
    const { data } = await api.get<T>(url, config)
    return data
  }

  async function post<T = unknown>(url: string, payload?: unknown, config?: AxiosRequestConfig) {
    const { data } = await api.post<T>(url, payload, config)
    return data
  }

  async function upload<T = unknown>(url: string, formData: FormData, onProgress?: (pct: number) => void) {
    const { data } = await api.post<T>(url, formData, {
      onUploadProgress: (e) => {
        if (onProgress && e.total) {
          onProgress(Math.round((e.loaded * 100) / e.total))
        }
      },
    })
    return data
  }

  return { get, post, upload }
}
