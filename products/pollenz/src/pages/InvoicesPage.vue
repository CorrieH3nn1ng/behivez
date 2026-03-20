<template>
  <q-page padding>
    <div class="row items-center q-mb-md">
      <div class="text-h5 col">Income</div>
      <div class="q-gutter-sm">
        <q-btn color="secondary" icon="upload_file" label="Upload Invoice" @click="triggerUpload" unelevated />
        <q-btn color="primary" icon="add" label="New Invoice" to="/income/new-invoice" unelevated />
      </div>
    </div>

    <!-- Hidden file input -->
    <input ref="fileInput" type="file" accept=".pdf,.jpg,.jpeg,.png" style="display: none" @change="handleFileUpload" />

    <!-- Category toggle -->
    <q-btn-toggle
      v-model="categoryFilter"
      toggle-color="primary"
      class="q-mb-md"
      :options="[
        { label: 'All', value: 'all' },
        { label: 'Business', value: 'business' },
        { label: 'Private', value: 'private' },
      ]"
      unelevated
      spread
      no-caps
    />

    <!-- Status filter tabs -->
    <q-tabs v-model="statusFilter" dense class="q-mb-md" align="left" active-color="primary" indicator-color="primary">
      <q-tab name="all" label="All" />
      <q-tab name="draft" label="Draft" />
      <q-tab name="sent" label="Sent" />
      <q-tab name="paid" label="Paid" />
      <q-tab name="overdue" label="Overdue" />
    </q-tabs>

    <q-card>
      <q-list separator>
        <q-item v-for="inv in filteredInvoices" :key="inv.id" clickable @click="$router.push(`/income/${inv.id}`)">
          <q-item-section>
            <q-item-label class="text-weight-medium">{{ inv.invoice_number }}</q-item-label>
            <q-item-label caption>{{ inv.client?.name }}</q-item-label>
            <q-item-label caption>{{ inv.invoice_date }} | Due: {{ inv.due_date }}</q-item-label>
          </q-item-section>
          <q-item-section side top>
            <div class="q-gutter-xs q-mb-xs">
              <q-badge :color="statusColor(inv.status)" :label="inv.status" />
              <q-badge :color="inv.category === 'business' ? 'teal' : 'purple'" :label="inv.category" />
            </div>
            <div class="text-weight-bold">R {{ formatMoney(inv.total) }}</div>
          </q-item-section>
        </q-item>
        <q-item v-if="!filteredInvoices.length && !loading">
          <q-item-section class="text-grey-5 text-center q-pa-lg">
            No income entries found
          </q-item-section>
        </q-item>
      </q-list>
    </q-card>

    <q-inner-loading :showing="loading" />
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useInvoiceStore } from '@/stores/invoice.store';
import { invoicesApi } from '@/services/api/invoices.api';
import type { InvoiceStatus } from '@/types';

const router = useRouter();
const $q = useQuasar();
const invoiceStore = useInvoiceStore();
const statusFilter = ref('all');
const categoryFilter = ref('all');
const fileInput = ref<HTMLInputElement | null>(null);

const loading = computed(() => invoiceStore.loading);
const filteredInvoices = computed(() => {
  let list = invoiceStore.invoices;
  if (categoryFilter.value !== 'all') {
    list = list.filter(i => i.category === categoryFilter.value);
  }
  if (statusFilter.value !== 'all') {
    list = list.filter(i => i.status === statusFilter.value);
  }
  return list;
});

function formatMoney(amount: number): string {
  return (amount || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function statusColor(status: InvoiceStatus): string {
  const map: Record<InvoiceStatus, string> = { draft: 'grey', sent: 'blue', paid: 'green', overdue: 'red', cancelled: 'grey-5' };
  return map[status] || 'grey';
}

function triggerUpload() {
  fileInput.value?.click();
}

async function handleFileUpload(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  input.value = '';

  $q.loading.show({ message: 'AI is extracting invoice data...' });
  try {
    // Send to n8n webhook for AI extraction (not Laravel)
    const res = await invoicesApi.extractViaN8n(file);
    $q.loading.hide();

    const extracted = res.data?.data || {};

    if (res.data?.success) {
      $q.notify({ type: 'positive', message: `AI extracted data (${(extracted as Record<string, unknown>).confidence || 0}% confidence)` });
    } else {
      $q.notify({ type: 'warning', message: 'AI extraction unavailable - please fill in manually' });
    }

    // Keep the original file in the store so InvoiceEditPage can upload it to Laravel on save
    invoiceStore.pendingUploadFile = file;

    // Store extracted data in sessionStorage for the edit page to pick up
    sessionStorage.setItem('invoice_extraction', JSON.stringify({ extracted }));
    router.push('/income/new-invoice?from=upload');
  } catch {
    $q.loading.hide();
    $q.notify({ type: 'negative', message: 'Failed to extract invoice data' });
  }
}

onMounted(() => invoiceStore.fetchInvoices());
</script>
