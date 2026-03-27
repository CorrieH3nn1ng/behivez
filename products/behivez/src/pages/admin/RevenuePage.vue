<template>
  <q-page class="q-pa-lg">
    <div class="text-h4 text-weight-bold q-mb-lg">Revenue</div>

    <q-spinner-dots v-if="loading" size="48px" color="amber" class="q-mx-auto block q-my-xl" />

    <q-banner v-if="error" class="bg-red-1 text-red-8 q-mb-lg" rounded>
      {{ error }}
    </q-banner>

    <!-- Stats Cards -->
    <div v-if="rev" class="row q-gutter-md q-mb-xl">
      <div class="col-12 col-sm-4">
        <q-card flat bordered class="bg-amber-1">
          <q-card-section>
            <div class="text-caption text-grey-6">Monthly Recurring Revenue</div>
            <div class="text-h4 text-weight-bold text-amber-9">{{ formatRands(rev.mrr) }}</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-sm-4">
        <q-card flat bordered class="bg-green-1">
          <q-card-section>
            <div class="text-caption text-grey-6">Total Revenue</div>
            <div class="text-h4 text-weight-bold text-green-8">{{ formatRands(rev.totalRevenue) }}</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-sm-4">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-caption text-grey-6">Active Paid Subscribers</div>
            <div class="text-h4 text-weight-bold text-grey-9">{{ rev.activePaidCount }}</div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Revenue by Product -->
    <div v-if="rev && Object.keys(rev.mrrByProduct || {}).length > 0" class="q-mb-xl">
      <div class="text-h6 text-weight-bold text-grey-9 q-mb-md">MRR by Product</div>
      <div class="row q-gutter-md">
        <div v-for="(cents, product) in rev.mrrByProduct" :key="product" class="col-auto">
          <q-card flat bordered style="min-width: 160px;">
            <q-card-section class="text-center">
              <div class="text-subtitle2 text-grey-7 text-capitalize">{{ product }}</div>
              <div class="text-h5 text-weight-bold text-amber-9">{{ formatRands(cents as number) }}</div>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </div>

    <!-- Month Comparison -->
    <div v-if="rev" class="q-mb-xl">
      <div class="text-h6 text-weight-bold text-grey-9 q-mb-md">Monthly Comparison</div>
      <div class="row q-gutter-md">
        <div class="col-auto">
          <q-card flat bordered style="min-width: 180px;">
            <q-card-section class="text-center">
              <div class="text-caption text-grey-6">This Month</div>
              <div class="text-h5 text-weight-bold text-green-8">{{ formatRands(rev.revenueThisMonth) }}</div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-auto">
          <q-card flat bordered style="min-width: 180px;">
            <q-card-section class="text-center">
              <div class="text-caption text-grey-6">Last Month</div>
              <div class="text-h5 text-weight-bold text-grey-7">{{ formatRands(rev.revenueLastMonth) }}</div>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </div>

    <!-- Recent Payments -->
    <div class="q-mb-xl">
      <div class="text-h6 text-weight-bold text-grey-9 q-mb-md">Recent Payments</div>

      <q-table
        v-if="rev && rev.recentPayments?.length"
        :rows="rev.recentPayments"
        :columns="columns"
        row-key="id"
        flat
        bordered
        dense
        :pagination="{ rowsPerPage: 10 }"
      />

      <div v-else-if="!loading" class="text-grey-5 text-center q-my-md">
        No payments recorded yet.
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAdminStore } from 'stores/admin'

const admin = useAdminStore()
const rev = ref<any>(null)
const loading = ref(true)
const error = ref('')

const columns = [
  { name: 'date', label: 'Date', field: 'createdAt', align: 'left' as const, format: (v: string) => new Date(v).toLocaleDateString('en-ZA') },
  { name: 'user', label: 'User', field: 'userName', align: 'left' as const },
  { name: 'product', label: 'Product', field: 'product', align: 'left' as const },
  { name: 'plan', label: 'Plan', field: 'plan', align: 'left' as const },
  { name: 'amount', label: 'Amount', field: 'amountCents', align: 'right' as const, format: (v: number) => formatRands(v) },
]

function formatRands(cents: number): string {
  return `R${(cents / 100).toFixed(2)}`
}

onMounted(async () => {
  try {
    await admin.fetchRevenue()
    rev.value = admin.revenue
  } catch {
    error.value = 'Failed to load revenue data.'
  } finally {
    loading.value = false
  }
})
</script>
