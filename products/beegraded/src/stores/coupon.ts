import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { backendApi } from 'src/boot/axios'

const STORAGE_KEY = 'bg_coupon'

interface CouponData {
  code: string
  discount_percent: number
  affiliate_name: string
}

export const useCouponStore = defineStore('coupon', () => {
  const code = ref('')
  const discount_percent = ref(0)
  const affiliate_name = ref('')
  const isValid = ref(false)

  // Load from localStorage on init
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved) {
    try {
      const parsed: CouponData = JSON.parse(saved)
      code.value = parsed.code
      discount_percent.value = parsed.discount_percent
      affiliate_name.value = parsed.affiliate_name
      isValid.value = true
    } catch { /* ignore corrupt data */ }
  }

  const isFreePass = computed(() => isValid.value && discount_percent.value === 100)

  function persist() {
    const data: CouponData = {
      code: code.value,
      discount_percent: discount_percent.value,
      affiliate_name: affiliate_name.value,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }

  async function validateCoupon(inputCode: string) {
    const { data } = await backendApi.get<{
      valid: boolean
      discount_percent: number
      affiliate_name: string
      message?: string
    }>(`/coupons/validate?code=${encodeURIComponent(inputCode)}`)

    if (data.valid) {
      code.value = inputCode
      discount_percent.value = data.discount_percent
      affiliate_name.value = data.affiliate_name
      isValid.value = true
      persist()
    }
    return data
  }

  function clearCoupon() {
    code.value = ''
    discount_percent.value = 0
    affiliate_name.value = ''
    isValid.value = false
    localStorage.removeItem(STORAGE_KEY)
  }

  return {
    code,
    discount_percent,
    affiliate_name,
    isValid,
    isFreePass,
    validateCoupon,
    clearCoupon,
    persist,
  }
})
