import { ref } from 'vue'
import { backendApi } from 'src/boot/axios'

interface PayFastFields {
  merchant_id: string
  merchant_key: string
  return_url: string
  cancel_url: string
  notify_url: string
  name_first: string
  email_address: string
  m_payment_id: string
  amount: string
  item_name: string
  item_description: string
  signature: string
}

export function usePayment() {
  const loading = ref(false)

  async function initiatePayment(paperId: number, mode: string, email: string, name: string, tokenCode?: string) {
    loading.value = true
    try {
      const payload: Record<string, unknown> = { paper_id: paperId, mode, email, name }
      if (tokenCode) payload.token_code = tokenCode
      const { data } = await backendApi.post('/payments/initiate', payload)
      return data as { fields: PayFastFields; payfast_url: string }
    } finally {
      loading.value = false
    }
  }

  async function initiateTokenPayment(email: string, couponCode?: string) {
    loading.value = true
    try {
      const payload: Record<string, string> = { email, purchase_type: 'token' }
      if (couponCode) payload.coupon_code = couponCode
      const { data } = await backendApi.post('/tokens/purchase', payload)
      return data as {
        token_code: string
        fields?: PayFastFields
        payfast_url?: string
        free?: boolean
      }
    } finally {
      loading.value = false
    }
  }

  function submitToPayFast(fields: PayFastFields, payfastUrl: string) {
    const form = document.createElement('form')
    form.method = 'POST'
    form.action = payfastUrl

    for (const [key, value] of Object.entries(fields)) {
      const input = document.createElement('input')
      input.type = 'hidden'
      input.name = key
      input.value = value
      form.appendChild(input)
    }

    document.body.appendChild(form)
    form.submit()
  }

  return { loading, initiatePayment, initiateTokenPayment, submitToPayFast }
}
