<template>
  <q-page class="q-pa-lg">
    <div class="row items-center q-mb-md">
      <h4 class="text-h5 text-weight-bold q-mt-none q-mb-none col">Services</h4>
      <q-btn color="brown-8" no-caps icon="add" label="Add Service" @click="openNew" />
    </div>

    <div v-if="loading" class="flex flex-center q-pa-xl">
      <q-spinner-gears size="48px" color="brown-8" />
    </div>

    <div v-else-if="!services.length" class="text-center q-pa-xl text-grey-6">
      <q-icon name="handyman" size="48px" class="q-mb-md" />
      <p class="text-h6">No services yet</p>
      <p>Add what you offer — consultations, packages, hourly rates, etc.</p>
    </div>

    <q-list v-else bordered separator class="rounded-borders">
      <q-item v-for="(svc, idx) in services" :key="svc.id">
        <q-item-section avatar>
          <div class="column items-center">
            <q-btn flat dense round icon="arrow_upward" size="xs" :disable="idx === 0" @click="reorder(svc.id, idx - 1)" />
            <q-btn flat dense round icon="arrow_downward" size="xs" :disable="idx === services.length - 1" @click="reorder(svc.id, idx + 1)" />
          </div>
        </q-item-section>
        <q-item-section>
          <q-item-label class="text-weight-bold">{{ svc.name }}</q-item-label>
          <q-item-label caption>{{ svc.description }}</q-item-label>
          <q-item-label caption>
            <span v-if="svc.price_label">{{ svc.price_label }}</span>
            <span v-else-if="svc.price != null">R{{ Number(svc.price).toFixed(0) }}</span>
            <span v-if="svc.duration" class="q-ml-sm">· {{ svc.duration }}</span>
          </q-item-label>
        </q-item-section>
        <q-item-section side>
          <div class="row q-gutter-xs">
            <q-btn flat dense icon="edit" @click="openEdit(svc)" />
            <q-btn flat dense icon="delete" color="negative" @click="handleDelete(svc.id)" />
          </div>
        </q-item-section>
      </q-item>
    </q-list>

    <!-- Service Form Dialog -->
    <service-form
      v-model="dialogOpen"
      :service="editingService"
      @saved="onSaved"
    />
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from 'src/boot/axios'
import { Notify, Dialog } from 'quasar'
import ServiceForm from 'src/components/ServiceForm.vue'
import type { Service } from 'src/stores/talent'

const loading = ref(true)
const services = ref<Service[]>([])
const dialogOpen = ref(false)
const editingService = ref<Service | null>(null)

async function loadServices() {
  loading.value = true
  try {
    const { data } = await api.get('/bz-talent-mine')
    services.value = data.services || []
  } catch {
    // ignore
  } finally {
    loading.value = false
  }
}

onMounted(loadServices)

function openNew() {
  editingService.value = null
  dialogOpen.value = true
}

function openEdit(svc: Service) {
  editingService.value = { ...svc }
  dialogOpen.value = true
}

function onSaved() {
  dialogOpen.value = false
  loadServices()
}

async function handleDelete(id: number) {
  Dialog.create({
    title: 'Delete Service',
    message: 'Are you sure? This cannot be undone.',
    cancel: true,
  }).onOk(async () => {
    try {
      await api.post('/bz-service-delete', { id })
      services.value = services.value.filter(s => s.id !== id)
      Notify.create({ type: 'positive', message: 'Service deleted' })
    } catch {
      Notify.create({ type: 'negative', message: 'Failed to delete' })
    }
  })
}

async function reorder(id: number, newIndex: number) {
  try {
    await api.post('/bz-service-reorder', { id, sort_order: newIndex })
    await loadServices()
  } catch {
    Notify.create({ type: 'negative', message: 'Failed to reorder' })
  }
}
</script>
