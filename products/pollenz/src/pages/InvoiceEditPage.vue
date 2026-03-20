<template>
  <q-page padding>
    <div class="row items-center q-mb-md">
      <div class="text-h5 col">{{ isEdit ? 'Edit Invoice' : isFromUpload ? 'Review Extracted Invoice' : 'New Invoice' }}</div>
      <q-badge v-if="isFromUpload" color="secondary" label="AI Extracted" class="text-body2 q-pa-sm" />
    </div>

    <q-form @submit="handleSave">
      <q-card class="q-mb-md">
        <q-card-section>
          <div class="row q-col-gutter-md">
            <div class="col-12 col-sm-6">
              <q-select
                v-model="form.client_id"
                :options="clientOptions"
                option-value="value"
                option-label="label"
                emit-value
                map-options
                label="Client"
                outlined
                dense
                :rules="[v => !!v || 'Required']"
              />
            </div>
            <div class="col-12 col-sm-6">
              <q-input v-model="previewInvNumber" label="Invoice Number" outlined dense disable hint="Auto-generated" />
            </div>
            <div class="col-12 col-sm-4">
              <q-input v-model="form.invoice_date" label="Invoice Date" type="date" outlined dense :rules="[v => !!v || 'Required']" />
            </div>
            <div class="col-12 col-sm-4">
              <q-input v-model="form.due_date" label="Due Date" type="date" outlined dense :rules="[v => !!v || 'Required']" />
            </div>
            <div class="col-12 col-sm-4">
              <q-input v-model.number="form.tax_rate" label="VAT Rate (%)" type="number" step="0.01" outlined dense hint="0 if not VAT registered" />
            </div>
            <div class="col-12 col-sm-6">
              <q-input v-model="form.title" label="Title (optional)" outlined dense />
            </div>
            <div class="col-12 col-sm-6">
              <q-select
                v-model="form.category"
                :options="[{ label: 'Business', value: 'business' }, { label: 'Private', value: 'private' }]"
                label="Category"
                outlined
                dense
                emit-value
                map-options
              />
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- Line Items -->
      <q-card class="q-mb-md">
        <q-card-section>
          <div class="text-h6 q-mb-sm">Line Items</div>

          <div v-for="(item, idx) in form.items" :key="idx" class="row q-col-gutter-sm q-mb-sm items-start">
            <div class="col-12 col-sm-5">
              <q-input v-model="item.description" label="Description" outlined dense :rules="[v => !!v || 'Required']" />
            </div>
            <div class="col-4 col-sm-2">
              <q-input v-model.number="item.quantity" label="Qty" type="number" step="0.01" min="0.01" outlined dense />
            </div>
            <div class="col-4 col-sm-2">
              <q-input v-model.number="item.unit_price" label="Unit Price" type="number" step="0.01" min="0" outlined dense />
            </div>
            <div class="col-3 col-sm-2">
              <q-input :model-value="(item.quantity * item.unit_price).toFixed(2)" label="Amount" outlined dense disable />
            </div>
            <div class="col-1">
              <q-btn flat round size="sm" icon="delete" color="negative" @click="removeItem(idx)" :disable="form.items.length <= 1" />
            </div>
          </div>

          <q-btn flat color="primary" icon="add" label="Add Item" @click="addItem" class="q-mt-sm" />
        </q-card-section>
      </q-card>

      <!-- Totals -->
      <q-card class="q-mb-md">
        <q-card-section>
          <div class="row justify-end">
            <div style="width: 250px">
              <div class="row justify-between q-mb-xs">
                <span>Subtotal:</span>
                <span class="text-weight-medium">R {{ formatMoney(subtotal) }}</span>
              </div>
              <div v-if="form.tax_rate > 0" class="row justify-between q-mb-xs">
                <span>VAT ({{ form.tax_rate }}%):</span>
                <span>R {{ formatMoney(taxAmount) }}</span>
              </div>
              <q-separator class="q-my-sm" />
              <div class="row justify-between text-h6">
                <span>Total:</span>
                <span class="text-primary">R {{ formatMoney(total) }}</span>
              </div>
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- Notes -->
      <q-card class="q-mb-md">
        <q-card-section>
          <q-input v-model="form.notes" label="Notes" type="textarea" outlined dense autogrow />
        </q-card-section>
      </q-card>

      <!-- Actions -->
      <div class="row q-gutter-sm justify-end">
        <q-btn flat label="Cancel" @click="$router.back()" />
        <q-btn type="submit" color="primary" :label="isEdit ? 'Update' : 'Create Invoice'" :loading="saving" unelevated />
      </div>
    </q-form>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useInvoiceStore } from '@/stores/invoice.store';
import { useClientStore } from '@/stores/client.store';
import { invoicesApi } from '@/services/api/invoices.api';

const route = useRoute();
const router = useRouter();
const $q = useQuasar();
const invoiceStore = useInvoiceStore();
const clientStore = useClientStore();

const isEdit = computed(() => !!route.params.id);
const isFromUpload = computed(() => route.query.from === 'upload');
const saving = ref(false);
const previewInvNumber = ref('');

const form = ref({
  client_id: '',
  invoice_date: new Date().toISOString().slice(0, 10),
  due_date: '',
  tax_rate: 0,
  title: '',
  category: 'business' as 'business' | 'private',
  notes: '',
  items: [{ description: '', quantity: 1, unit: null as string | null, unit_price: 0 }],
});

const clientOptions = computed(() =>
  clientStore.clients.map(c => ({ value: c.id, label: `${c.name} (${c.client_code})` }))
);

const subtotal = computed(() => form.value.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0));
const taxAmount = computed(() => subtotal.value * (form.value.tax_rate / 100));
const total = computed(() => subtotal.value + taxAmount.value);

function formatMoney(amount: number): string {
  return amount.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function addItem() {
  form.value.items.push({ description: '', quantity: 1, unit: null, unit_price: 0 });
}

function removeItem(idx: number) {
  if (form.value.items.length > 1) form.value.items.splice(idx, 1);
}

// Preview invoice number when client/date changes
watch([() => form.value.client_id, () => form.value.invoice_date], async ([clientId, date]) => {
  if (clientId && date && !isEdit.value) {
    try {
      const res = await invoicesApi.previewNumber(clientId, date);
      previewInvNumber.value = res.data.invoice_number;
    } catch { previewInvNumber.value = ''; }
  }
}, { immediate: true });

async function handleSave() {
  saving.value = true;
  try {
    if (isEdit.value) {
      await invoiceStore.updateInvoice(route.params.id as string, {
        invoice_date: form.value.invoice_date,
        due_date: form.value.due_date,
        tax_rate: form.value.tax_rate,
        title: form.value.title || null,
        notes: form.value.notes || null,
        items: form.value.items,
      });
      $q.notify({ type: 'positive', message: 'Invoice updated' });
    } else {
      const invoice = await invoiceStore.createInvoice({
        client_id: form.value.client_id,
        invoice_date: form.value.invoice_date,
        due_date: form.value.due_date,
        tax_rate: form.value.tax_rate,
        title: form.value.title || undefined,
        notes: form.value.notes || undefined,
        items: form.value.items,
      });

      // Upload the original PDF to Laravel if this came from an upload extraction
      if (isFromUpload.value && invoiceStore.pendingUploadFile) {
        try {
          await invoicesApi.uploadPdf(invoice.id, invoiceStore.pendingUploadFile);
        } catch { /* non-critical - invoice created, PDF upload failed */ }
        invoiceStore.pendingUploadFile = null;
        sessionStorage.removeItem('invoice_extraction');
      }

      $q.notify({ type: 'positive', message: 'Invoice created' });
      router.push(`/income/${invoice.id}`);
      return;
    }
    router.back();
  } catch (err: unknown) {
    const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to save';
    $q.notify({ type: 'negative', message });
  } finally {
    saving.value = false;
  }
}

onMounted(async () => {
  await clientStore.fetchClients();

  // Set default due date (30 days from now)
  if (!form.value.due_date) {
    const due = new Date();
    due.setDate(due.getDate() + 30);
    form.value.due_date = due.toISOString().slice(0, 10);
  }

  // Load existing invoice for edit
  if (isEdit.value) {
    const invoice = await invoiceStore.getInvoice(route.params.id as string);
    form.value.client_id = invoice.client_id;
    form.value.invoice_date = invoice.invoice_date;
    form.value.due_date = invoice.due_date;
    form.value.tax_rate = invoice.tax_rate;
    form.value.title = invoice.title || '';
    form.value.notes = invoice.notes || '';
    form.value.items = invoice.items.map(i => ({
      ...i,
      unit: i.unit || null,
    }));
    previewInvNumber.value = invoice.invoice_number;
  }

  // Load AI-extracted data from upload
  if (isFromUpload.value) {
    const raw = sessionStorage.getItem('invoice_extraction');
    if (raw) {
      try {
        const { extracted } = JSON.parse(raw);

        // Pre-fill form with extracted data
        if (extracted) {
          if (extracted.invoice_date) form.value.invoice_date = extracted.invoice_date;
          if (extracted.due_date) form.value.due_date = extracted.due_date;
          if (extracted.tax_rate != null) form.value.tax_rate = Number(extracted.tax_rate);
          if (extracted.notes) form.value.notes = extracted.notes;

          // Try to match client by vendor_name (the issuer of the invoice is "us" for outgoing)
          // For uploaded invoices, vendor_name from AI is actually the business that sent it
          // So we look for client name match instead
          if (extracted.vendor_name) {
            form.value.title = extracted.vendor_name;
          }

          // Pre-fill line items
          if (extracted.line_items?.length) {
            form.value.items = extracted.line_items.map((item: { description: string; quantity: number; unit_price: number }) => ({
              description: item.description || '',
              quantity: item.quantity || 1,
              unit: null,
              unit_price: item.unit_price || 0,
            }));
          }
        }
      } catch { /* ignore parse errors */ }
    }
  }
});
</script>
