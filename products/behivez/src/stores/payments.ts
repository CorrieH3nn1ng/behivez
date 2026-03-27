import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'

export interface PlanDef {
  id: string
  name: string
  priceCents: number
  frequency: string
  features: string[]
}

export interface ProductPlans {
  product: string
  plans: PlanDef[]
}

export interface PaymentRecord {
  id: string
  product: string | null
  plan: string | null
  amountCents: number
  status: string
  createdAt: string
}

export const usePaymentsStore = defineStore('payments', () => {
  const products = ref<ProductPlans[]>([])
  const history = ref<PaymentRecord[]>([])
  const loading = ref(false)

  async function fetchPlans() {
    loading.value = true
    try {
      const { data } = await axios.get('/payments/plans')
      products.value = data
    } finally {
      loading.value = false
    }
  }

  async function checkout(product: string, plan: string): Promise<{ payFastUrl: string; formData: Record<string, string> }> {
    const { data } = await axios.post('/payments/checkout', { product, plan })
    return data
  }

  async function fetchHistory() {
    loading.value = true
    try {
      const { data } = await axios.get('/payments/history')
      history.value = data
    } finally {
      loading.value = false
    }
  }

  async function cancelSubscription(subscriptionId: string) {
    await axios.post('/payments/cancel', { subscriptionId })
  }

  return {
    products,
    history,
    loading,
    fetchPlans,
    checkout,
    fetchHistory,
    cancelSubscription,
  }
})
