import { backendApi } from 'src/boot/axios'
import { useTokenStore, type TokenData } from 'src/stores/token'

export function useToken() {
  const tokenStore = useTokenStore()

  async function validateToken(code: string): Promise<TokenData | null> {
    tokenStore.loading = true
    try {
      const { data } = await backendApi.get<TokenData>(`/tokens/validate?code=${encodeURIComponent(code)}`)
      if (data && data.code) {
        tokenStore.setToken(code, data)
        return data
      }
      return null
    } catch {
      return null
    } finally {
      tokenStore.loading = false
    }
  }

  async function purchaseToken(email: string, couponCode?: string) {
    const payload: Record<string, string> = { email }
    if (couponCode) payload.coupon_code = couponCode
    const { data } = await backendApi.post<{
      token_code: string
      fields?: Record<string, string>
      payfast_url?: string
      free?: boolean
    }>('/tokens/purchase', payload)
    return data
  }

  async function refreshToken(code: string): Promise<TokenData | null> {
    return validateToken(code)
  }

  return {
    validateToken,
    purchaseToken,
    refreshToken,
  }
}
