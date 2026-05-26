import { ref, computed } from 'vue'
import { backendApi } from 'src/boot/axios'

export interface Subscription {
  plan: 'free' | 'per_subject' | 'three_subjects' | 'all_subjects'
  subjects: string[]
  status: string
  expires_at: string | null
}

const subscription = ref<Subscription>({ plan: 'free', subjects: [], status: 'free', expires_at: null })
const loaded = ref(false)

export function useSubscription() {
  async function loadSubscription() {
    try {
      const { data } = await backendApi.get('/subscription')
      subscription.value = data
    } catch {
      subscription.value = { plan: 'free', subjects: [], status: 'free', expires_at: null }
    } finally {
      loaded.value = true
    }
  }

  const isPaid = computed(() => subscription.value.plan !== 'free')

  function canAccess(subjectCode: string): boolean {
    const plan = subscription.value.plan
    if (plan === 'all_subjects') return true
    if (plan === 'free') return false
    if (plan === 'per_subject' || plan === 'three_subjects') {
      return subscription.value.subjects.includes(subjectCode)
    }
    return false
  }

  return { subscription, loaded, loadSubscription, isPaid, canAccess }
}
