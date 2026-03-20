<template>
  <q-page class="q-pa-lg">
    <h4 class="text-h5 text-weight-bold q-mb-md q-mt-none">Enquiries</h4>

    <div v-if="loading" class="flex flex-center q-pa-xl">
      <q-spinner-gears size="48px" color="brown-8" />
    </div>

    <div v-else-if="!enquiries.length" class="text-center q-pa-xl text-grey-6">
      <q-icon name="mail" size="48px" class="q-mb-md" />
      <p class="text-h6">No enquiries yet</p>
      <p>When visitors contact you through your storefront, their messages will appear here.</p>
    </div>

    <div v-else class="q-gutter-md" style="max-width: 800px;">
      <enquiry-card
        v-for="enq in enquiries"
        :key="enq.id"
        :enquiry="enq"
        @status-changed="onStatusChanged"
      />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from 'src/boot/axios'
import EnquiryCard from 'src/components/EnquiryCard.vue'

interface Enquiry {
  id: number
  talent_id: number
  visitor_name: string
  visitor_email: string
  visitor_phone: string | null
  message: string
  status: 'new' | 'read' | 'replied' | 'archived'
  created_at: string
}

const loading = ref(true)
const enquiries = ref<Enquiry[]>([])

async function loadEnquiries() {
  loading.value = true
  try {
    const { data } = await api.get('/bz-enquiry-list')
    enquiries.value = data
  } catch {
    // ignore
  } finally {
    loading.value = false
  }
}

onMounted(loadEnquiries)

function onStatusChanged(id: number, status: string) {
  const enq = enquiries.value.find(e => e.id === id)
  if (enq) enq.status = status as Enquiry['status']
}
</script>
