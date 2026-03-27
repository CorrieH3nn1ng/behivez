<template>
  <q-page class="q-pa-xl" style="max-width: 900px; margin: 0 auto;">
    <div class="text-h4 text-weight-bold text-grey-9 q-mb-lg">My Subscriptions</div>

    <q-spinner-dots v-if="loading" size="48px" color="amber-8" class="q-mx-auto block q-my-xl" />

    <q-banner v-if="error" class="bg-red-1 text-red-8 q-mb-lg" rounded>
      {{ error }}
    </q-banner>

    <!-- Subscriptions -->
    <div v-if="!loading && subscriptions.length === 0" class="text-grey-6 text-center q-my-xl">
      <q-icon name="inbox" size="64px" color="grey-4" />
      <div class="q-mt-md">No subscriptions yet.</div>
      <q-btn label="View Pricing" color="amber-8" text-color="white" no-caps unelevated class="q-mt-md" to="/pricing" />
    </div>

    <div v-for="sub in subscriptions" :key="sub.product" class="q-mb-md">
      <q-card flat bordered class="sub-card">
        <q-card-section class="row items-center q-gutter-md">
          <q-icon :name="productIcons[sub.product] || 'hexagon'" size="36px" color="amber-8" />
          <div class="col">
            <div class="text-h6 text-weight-bold text-grey-9 text-capitalize">
              {{ productLabels[sub.product] || sub.product }}
            </div>
            <div class="text-caption text-grey-6">
              Plan: <strong class="text-grey-8 text-capitalize">{{ sub.plan }}</strong>
              <q-badge
                :color="sub.status === 'ACTIVE' ? 'green-7' : sub.status === 'TRIAL' ? 'blue-7' : 'red-7'"
                class="q-ml-sm"
              >
                {{ sub.status }}
              </q-badge>
            </div>
            <div v-if="sub.currentPeriodEnd" class="text-caption text-grey-5">
              Next billing: {{ formatDate(sub.currentPeriodEnd) }}
            </div>
          </div>
          <div class="q-gutter-sm">
            <q-btn
              v-if="sub.plan === 'free'"
              label="Upgrade"
              color="amber-8"
              text-color="white"
              size="sm"
              no-caps
              unelevated
              to="/pricing"
            />
            <q-btn
              v-if="sub.plan !== 'free' && sub.status === 'ACTIVE'"
              label="Cancel"
              color="red-7"
              text-color="white"
              size="sm"
              no-caps
              outline
              :loading="cancellingId === sub.id"
              @click="handleCancel(sub)"
            />
          </div>
        </q-card-section>
      </q-card>
    </div>

    <!-- Payment History -->
    <div class="text-h5 text-weight-bold text-grey-9 q-mt-xl q-mb-md">Payment History</div>

    <q-spinner-dots v-if="historyLoading" size="32px" color="amber-8" class="q-mx-auto block q-my-md" />

    <div v-if="!historyLoading && payments.length === 0" class="text-grey-6 text-center q-my-md">
      No payments yet.
    </div>

    <q-table
      v-if="payments.length > 0"
      :rows="payments"
      :columns="paymentColumns"
      row-key="id"
      flat
      bordered
      dense
      :rows-per-page-options="[10, 25]"
    />
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Notify } from 'quasar'
import { usePaymentsStore } from 'stores/payments'
import axios from 'axios'

interface Sub {
  id: string
  product: string
  plan: string
  status: string
  currentPeriodEnd?: string
}

const paymentsStore = usePaymentsStore()
const subscriptions = ref<Sub[]>([])
const payments = ref<any[]>([])
const loading = ref(true)
const historyLoading = ref(true)
const error = ref('')
const cancellingId = ref('')

const productLabels: Record<string, string> = {
  beegraded: 'BeeGraded',
  pollenz: 'Pollenz',
  swarmz: 'Swarmz',
  broodz: 'Broodz',
}

const productIcons: Record<string, string> = {
  beegraded: 'grading',
  pollenz: 'account_balance_wallet',
  swarmz: 'local_shipping',
  broodz: 'person_search',
}

const paymentColumns = [
  { name: 'date', label: 'Date', field: 'createdAt', align: 'left' as const, format: (v: string) => new Date(v).toLocaleDateString('en-ZA') },
  { name: 'product', label: 'Product', field: 'product', align: 'left' as const },
  { name: 'plan', label: 'Plan', field: 'plan', align: 'left' as const },
  { name: 'amount', label: 'Amount', field: 'amountCents', align: 'right' as const, format: (v: number) => `R${(v / 100).toFixed(2)}` },
  { name: 'status', label: 'Status', field: 'status', align: 'center' as const },
]

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' })
}

onMounted(async () => {
  try {
    const { data } = await axios.get('/auth/me')
    subscriptions.value = (data.subscriptions || []).map((s: any) => ({
      id: s.id || s.product,
      ...s,
    }))
  } catch {
    error.value = 'Failed to load subscriptions.'
  } finally {
    loading.value = false
  }

  try {
    await paymentsStore.fetchHistory()
    payments.value = paymentsStore.history
  } catch {
    // non-critical
  } finally {
    historyLoading.value = false
  }
})

async function handleCancel(sub: Sub) {
  cancellingId.value = sub.id
  try {
    await paymentsStore.cancelSubscription(sub.id)
    sub.status = 'CANCELLED'
    sub.plan = 'free'
    Notify.create({ type: 'positive', message: 'Subscription cancelled.' })
  } catch (err: any) {
    Notify.create({ type: 'negative', message: err?.response?.data?.message || 'Failed to cancel subscription.' })
  } finally {
    cancellingId.value = ''
  }
}
</script>

<style lang="scss" scoped>
.sub-card {
  background: #fffbeb;
  border-color: rgba(245, 158, 11, 0.2) !important;
}
</style>
