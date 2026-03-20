<template>
  <q-page class="q-pa-md">
    <div class="text-h5 text-primary text-weight-bold q-mb-md">Dashboard</div>

    <div v-if="admin.loading && !admin.stats" class="text-center q-pa-xl">
      <q-spinner-dots size="40px" color="primary" />
    </div>

    <!-- Stats Cards -->
    <div class="row q-col-gutter-md q-mb-lg" v-if="admin.stats">
      <div class="col-6 col-sm-4 col-md-3">
        <q-card class="bee-card">
          <q-card-section>
            <div class="text-grey-7 text-caption">Total Users</div>
            <div class="text-h3 text-primary">{{ admin.stats.totalUsers }}</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-6 col-sm-4 col-md-3" v-for="(count, role) in admin.stats.usersByRole" :key="role">
        <q-card class="bee-card">
          <q-card-section>
            <div class="text-grey-7 text-caption">{{ role }}</div>
            <div class="text-h3 text-primary">{{ count }}</div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Subscriptions by Product -->
    <div class="q-mb-lg" v-if="admin.stats?.subscriptionsByProduct">
      <div class="text-subtitle1 text-weight-bold text-grey-8 q-mb-sm">Subscriptions by Product</div>
      <div class="row q-col-gutter-md">
        <div class="col-6 col-sm-4 col-md-2" v-for="(count, product) in admin.stats.subscriptionsByProduct" :key="product">
          <q-card class="bee-card">
            <q-card-section class="text-center">
              <div class="text-weight-medium text-capitalize">{{ product }}</div>
              <div class="text-h4 text-primary">{{ count }}</div>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </div>

    <!-- Health Panel -->
    <div class="text-subtitle1 text-weight-bold text-grey-8 q-mb-sm">Product Health</div>
    <div class="row q-col-gutter-md q-mb-lg">
      <div class="col-12 col-sm-6 col-md-4" v-for="check in admin.healthChecks" :key="check.name">
        <q-card :class="healthCardClass(check.status)">
          <q-card-section>
            <div class="row items-center justify-between q-mb-xs">
              <div class="text-weight-bold text-body1">{{ check.name }}</div>
              <q-badge :color="healthColor(check.status)" :label="check.status.toUpperCase()" />
            </div>
            <div class="text-caption text-grey-7">{{ check.url }}</div>
            <div class="text-caption q-mt-xs" v-if="check.responseTime != null">
              <q-icon name="speed" size="14px" class="q-mr-xs" />
              {{ check.responseTime }}ms
              <span class="q-ml-sm">HTTP {{ check.statusCode }}</span>
            </div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12" v-if="!admin.healthChecks.length && !admin.healthLoading">
        <q-banner class="bg-grey-2 text-grey-7 rounded-borders">No health data available</q-banner>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useAdminStore } from 'stores/admin'

const admin = useAdminStore()

let healthInterval: ReturnType<typeof setInterval> | null = null

function healthColor(status: string) {
  if (status === 'up') return 'green'
  if (status === 'degraded') return 'orange'
  return 'red'
}

function healthCardClass(status: string) {
  if (status === 'up') return 'bg-green-1'
  if (status === 'degraded') return 'bg-orange-1'
  return 'bg-red-1'
}

onMounted(() => {
  admin.fetchStats()
  admin.fetchHealth()
  healthInterval = setInterval(() => admin.fetchHealth(), 30000)
})

onUnmounted(() => {
  if (healthInterval) clearInterval(healthInterval)
})
</script>
