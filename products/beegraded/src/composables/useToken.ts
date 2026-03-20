import { useApi } from './useApi'
import { useTokenStore, type TokenData } from 'src/stores/token'

export function useToken() {
  const { get, post } = useApi()
  const tokenStore = useTokenStore()

  async function validateToken(code: string): Promise<TokenData | null> {
    tokenStore.loading = true
    try {
      const data = await get<TokenData>(`/bg-token-validate?code=${encodeURIComponent(code)}`)
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
    return post<{
      token_code: string
      fields?: Record<string, string>
      payfast_url?: string
      free?: boolean
    }>('/bg-token-purchase', payload)
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
