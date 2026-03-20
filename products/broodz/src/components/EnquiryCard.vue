<template>
  <q-card flat bordered class="q-pa-md" style="border-radius: 12px;">
    <div class="row items-start q-gutter-sm">
      <q-avatar size="40px" color="brown-2" text-color="brown-8">
        {{ enquiry.visitor_name.charAt(0).toUpperCase() }}
      </q-avatar>
      <div class="col">
        <div class="row items-center q-gutter-sm">
          <span class="text-subtitle2 text-weight-bold">{{ enquiry.visitor_name }}</span>
          <q-badge :color="statusColor" :label="enquiry.status" />
          <q-space />
          <span class="text-caption text-grey-6">{{ formatDate(enquiry.created_at) }}</span>
        </div>
        <div class="text-caption text-grey-7 q-mb-xs">
          {{ enquiry.visitor_email }}
          <span v-if="enquiry.visitor_phone"> · {{ enquiry.visitor_phone }}</span>
        </div>
        <p class="text-body2 q-mb-sm" style="white-space: pre-line;">{{ enquiry.message }}</p>
        <div class="row q-gutter-xs">
          <q-btn v-if="enquiry.status === 'new'" flat dense no-caps size="sm" label="Mark Read" icon="done" @click="changeStatus('read')" />
          <q-btn v-if="enquiry.status !== 'replied'" flat dense no-caps size="sm" label="Mark Replied" icon="reply" @click="changeStatus('replied')" />
          <q-btn v-if="enquiry.status !== 'archived'" flat dense no-caps size="sm" label="Archive" icon="archive" @click="changeStatus('archived')" />
          <q-space />
          <q-btn flat dense round size="sm" icon="email" :href="'mailto:' + enquiry.visitor_email" />
          <q-btn v-if="enquiry.visitor_phone" flat dense round size="sm" icon="phone" :href="'tel:' + enquiry.visitor_phone" />
        </div>
      </div>
    </div>
  </q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { api } from 'src/boot/axios'
import { Notify } from 'quasar'

interface Enquiry {
  id: number
  visitor_name: string
  visitor_email: string
  visitor_phone: string | null
  message: string
  status: 'new' | 'read' | 'replied' | 'archived'
  created_at: string
}

const props = defineProps<{ enquiry: Enquiry }>()
const emit = defineEmits<{ statusChanged: [id: number, status: string] }>()

const statusColor = computed(() => {
  const map: Record<string, string> = { new: 'blue', read: 'grey', replied: 'positive', archived: 'brown-4' }
  return map[props.enquiry.status] || 'grey'
})

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })
}

async function changeStatus(status: string) {
  try {
    await api.post('/bz-enquiry-status', { id: props.enquiry.id, status })
    emit('statusChanged', props.enquiry.id, status)
  } catch {
    Notify.create({ type: 'negative', message: 'Failed to update status' })
  }
}
</script>
