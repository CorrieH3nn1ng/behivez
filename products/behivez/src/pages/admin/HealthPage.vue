<template>
  <q-page class="q-pa-md">
    <div class="row items-center justify-between q-mb-md">
      <div class="text-h5 text-primary text-weight-bold">Product Health</div>
      <div class="row items-center q-gutter-sm">
        <q-toggle v-model="autoRefresh" label="Auto-refresh" color="primary" />
        <q-btn outline color="primary" icon="refresh" label="Refresh" no-caps :loading="admin.healthLoading" @click="admin.fetchHealth()" />
      </div>
    </div>

    <div class="row q-col-gutter-md">
      <div class="col-12 col-sm-6 col-md-4" v-for="check in admin.healthChecks" :key="check.name">
        <q-card :class="cardClass(check.status)" style="border-radius: 16px;">
          <q-card-section>
            <div class="row items-center justify-between q-mb-sm">
              <div class="text-h6">{{ check.name }}</div>
              <q-badge :color="statusColor(check.status)" :label="check.status.toUpperCase()" text-color="white" />
            </div>
            <div class="text-body2 text-grey-7">{{ check.url }}</div>
            <div class="q-mt-sm" v-if="check.responseTime != null">
              <q-icon name="speed" size="16px" class="q-mr-xs" />
              <span class="text-body2 text-weight-medium">{{ check.responseTime }}ms</span>
              <span class="q-ml-md text-body2">HTTP {{ check.statusCode }}</span>
            </div>
            <div class="q-mt-sm" v-else>
              <span class="text-body2 text-grey-5">No response data</span>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <div v-if="!admin.healthChecks.length && !admin.healthLoading" class="text-center q-pa-xl text-grey-5">
      <q-icon name="cloud_off" size="48px" class="q-mb-sm" />
      <div>No health data available</div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useAdminStore } from 'stores/admin'

const admin = useAdminStore()
const autoRefresh = ref(true)
let interval: ReturnType<typeof setInterval> | null = null

function statusColor(status: string) {
  if (status === 'up') return 'green'
  if (status === 'degraded') return 'orange'
  return 'red'
}

function cardClass(status: string) {
  if (status === 'up') return 'bg-green-1'
  if (status === 'degraded') return 'bg-orange-1'
  return 'bg-red-1'
}

function startInterval() {
  stopInterval()
  interval = setInterval(() => admin.fetchHealth(), 30000)
}

function stopInterval() {
  if (interval) { clearInterval(interval); interval = null }
}

watch(autoRefresh, (v) => v ? startInterval() : stopInterval())

onMounted(() => {
  admin.fetchHealth()
  if (autoRefresh.value) startInterval()
})

onUnmounted(() => stopInterval())
</script>
