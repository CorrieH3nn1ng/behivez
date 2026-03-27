<template>
  <q-page class="honeycomb-bg">
    <div class="page-container" style="max-width: 640px;">
      <div class="row items-center q-mb-lg">
        <div>
          <h2 class="text-h5 text-weight-bold q-mb-none">
            <q-icon name="token" color="amber" class="q-mr-sm" />
            My Tokens
          </h2>
          <p class="text-grey-7 q-mb-none" style="font-size: 14px;">Purchase and manage evaluation tokens.</p>
        </div>
        <q-space />
        <q-btn class="btn-bee" no-caps label="Buy Token" icon="add" @click="showBuyDialog = true" />
      </div>

      <!-- Loading -->
      <div v-if="loading" class="text-center q-pa-xl">
        <q-spinner-gears size="48px" color="amber" />
      </div>

      <!-- Empty state -->
      <div v-else-if="tokens.length === 0" class="text-center q-pa-xl">
        <q-icon name="token" size="64px" color="grey-4" />
        <p class="text-grey-5 q-mt-md text-h6">No tokens yet</p>
        <p class="text-grey-6">Purchase tokens to use rubric-based evaluations.</p>
        <q-btn class="btn-bee q-mt-md" no-caps label="Buy Your First Token" icon="token" @click="showBuyDialog = true" />
      </div>

      <!-- Token list -->
      <div v-else class="q-gutter-md">
        <q-card v-for="t in tokens" :key="t.id" flat class="bee-card q-pa-md">
          <div class="row items-center">
            <div>
              <div class="text-weight-bold">{{ t.code }}</div>
              <div class="text-caption text-grey-6">
                {{ t.status }} &middot; Expires {{ formatDate(t.expires_at) }}
              </div>
            </div>
            <q-space />
            <q-badge :color="statusColor(t.status)" :label="t.status" class="q-mr-sm" />
            <q-btn flat dense no-caps color="amber-8" icon="open_in_new" label="Open" :to="`/t/${t.code}`" size="sm" />
          </div>
        </q-card>
      </div>

      <!-- Buy dialog -->
      <q-dialog v-model="showBuyDialog">
        <q-card style="min-width: 400px;">
          <q-card-section>
            <div class="text-h6">Buy Evaluation Token</div>
          </q-card-section>
          <q-card-section>
            <p class="text-grey-7">Each token includes rubric PDF upload + draft + final + comparison for R25.</p>
            <q-input v-model="buyQuantity" outlined type="number" min="1" max="10" label="Quantity" class="q-mb-md" />
            <div class="text-weight-bold text-h6 text-amber-8">Total: R{{ (buyQuantity * 25).toFixed(2) }}</div>
          </q-card-section>
          <q-card-actions align="right">
            <q-btn flat no-caps label="Cancel" v-close-popup />
            <q-btn class="btn-bee" no-caps label="Purchase" @click="handleBulkBuy" :loading="buying" />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { backendApi } from 'src/boot/axios'
import { Notify } from 'quasar'

const loading = ref(true)
const tokens = ref<any[]>([])
const showBuyDialog = ref(false)
const buyQuantity = ref(1)
const buying = ref(false)

onMounted(async () => {
  try {
    const { data } = await backendApi.get<any[]>('/tokens/user')
    tokens.value = data || []
  } catch { /* empty */ } finally {
    loading.value = false
  }
})

function statusColor(status: string) {
  if (status === 'expired') return 'negative'
  if (status === 'final_evaluated') return 'positive'
  if (status === 'active') return 'amber'
  return 'blue'
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-ZA')
}

async function handleBulkBuy() {
  buying.value = true
  try {
    // Redirect to buy-token page for now — bulk purchase is a future enhancement
    Notify.create({ type: 'info', message: 'Redirecting to purchase page...' })
    window.location.href = '/buy-token'
  } finally {
    buying.value = false
  }
}
</script>
