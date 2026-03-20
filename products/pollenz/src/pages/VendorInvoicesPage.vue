<template>
  <q-page padding>
    <div class="row items-center q-mb-md">
      <div class="text-h5 col">Expenses</div>
    </div>

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

    <!-- Upload Zone -->
    <q-card class="q-mb-md">
      <q-card-section>
        <div class="text-h6 q-mb-sm">Upload Expense</div>
        <div class="row q-col-gutter-md">
          <div class="col-12 col-sm-8">
            <q-file
              v-model="uploadFile"
              label="Drop PDF or image here"
              outlined
              accept=".pdf,.jpg,.jpeg,.png"
              max-file-size="10485760"
              :loading="uploading"
            >
              <template v-slot:prepend>
                <q-icon name="cloud_upload" />
              </template>
            </q-file>
          </div>
          <div class="col-12 col-sm-4">
            <q-select
              v-model="uploadCategory"
              :options="[{ label: 'Business', value: 'business' }, { label: 'Private', value: 'private' }]"
              label="Category"
              outlined
              emit-value
              map-options
            />
          </div>
        </div>
        <q-btn
          class="q-mt-sm"
          color="primary"
          label="Upload"
          icon="cloud_upload"
          :disable="!uploadFile"
          :loading="uploading"
          @click="handleUpload"
          unelevated
        />
        <div v-if="!aiConfigured" class="text-caption text-warning q-mt-sm">
          AI extraction not configured. Invoices will be uploaded without automatic data extraction.
        </div>
      </q-card-section>
    </q-card>

    <!-- Expense List -->
    <q-card>
      <q-list separator>
        <q-item v-for="vi in filteredExpenses" :key="vi.id">
          <q-item-section>
            <q-item-label class="text-weight-medium">{{ vi.vendor_name || 'Unknown Vendor' }}</q-item-label>
            <q-item-label caption>
              {{ vi.invoice_number || 'No number' }} | {{ vi.invoice_date ? vi.invoice_date.substring(0, 10) : 'No date' }}
            </q-item-label>
            <q-item-label caption v-if="vi.confidence !== null">
              AI Confidence: {{ vi.confidence }}%
            </q-item-label>
          </q-item-section>
          <q-item-section side top>
            <div class="q-gutter-xs q-mb-xs">
              <q-badge :color="viStatusColor(vi.status)" :label="vi.status" />
              <q-badge :color="vi.category === 'business' ? 'teal' : 'purple'" :label="vi.category" />
            </div>
            <div v-if="vi.total" class="text-weight-bold">R {{ formatMoney(vi.total) }}</div>
          </q-item-section>
          <q-item-section side>
            <div class="q-gutter-xs">
              <q-btn
                v-if="!vi.vendor_name && !vi.total"
                flat round size="sm" icon="auto_fix_high" color="amber-8"
                :loading="reExtracting === vi.id"
                @click="handleReExtract(vi)"
              >
                <q-tooltip>Re-extract data from document</q-tooltip>
              </q-btn>
              <q-btn flat round size="sm" icon="edit" @click="editVendorInvoice(vi)" />
              <q-btn flat round size="sm" icon="visibility" @click="previewDocument(vi)" />
              <q-btn flat round size="sm" icon="delete" color="negative" @click="confirmDelete(vi)" />
            </div>
          </q-item-section>
        </q-item>
        <q-item v-if="!filteredExpenses.length && !loading">
          <q-item-section class="text-grey-5 text-center q-pa-lg">
            No expenses found
          </q-item-section>
        </q-item>
      </q-list>
    </q-card>

    <q-inner-loading :showing="loading" />

    <!-- Edit Dialog -->
    <q-dialog v-model="showEditDialog" persistent maximized transition-show="slide-up" transition-hide="slide-down">
      <q-card v-if="editingInvoice">
        <q-toolbar class="bg-primary text-white">
          <q-btn flat round icon="close" @click="showEditDialog = false" />
          <q-toolbar-title>Review Expense</q-toolbar-title>
          <q-btn flat icon="auto_fix_high" label="Re-extract" @click="handleReExtract(editingInvoice!)" :loading="reExtracting === editingInvoice?.id" class="q-mr-sm" />
          <q-btn flat label="Save" @click="saveVendorInvoice" :loading="saving" />
        </q-toolbar>

        <q-card-section class="q-pa-md">
          <q-form class="q-gutter-md">
            <q-input v-model="editForm.vendor_name" label="Vendor Name" outlined dense />
            <q-input v-model="editForm.invoice_number" label="Invoice / Reference Number" outlined dense />
            <q-select
              v-model="editForm.category"
              :options="[{ label: 'Business', value: 'business' }, { label: 'Private', value: 'private' }]"
              label="Category"
              outlined
              dense
              emit-value
              map-options
            />
            <div class="row q-col-gutter-md">
              <div class="col-6">
                <q-input v-model="editForm.invoice_date" label="Date" type="date" outlined dense />
              </div>
              <div class="col-6">
                <q-input v-model="editForm.due_date" label="Due Date" type="date" outlined dense />
              </div>
            </div>
            <div class="row q-col-gutter-md">
              <div class="col-4">
                <q-input v-model.number="editForm.subtotal" label="Subtotal" type="number" step="0.01" outlined dense />
              </div>
              <div class="col-4">
                <q-input v-model.number="editForm.tax_amount" label="Tax Amount" type="number" step="0.01" outlined dense />
              </div>
              <div class="col-4">
                <q-input v-model.number="editForm.total" label="Total" type="number" step="0.01" outlined dense />
              </div>
            </div>
            <q-select v-model="editForm.status" :options="['pending','reviewed','approved','rejected']" label="Status" outlined dense />
            <q-input v-model="editForm.notes" label="Notes" type="textarea" outlined dense autogrow />
          </q-form>
        </q-card-section>

        <!-- Attached Document Preview -->
        <q-card-section v-if="editingInvoice.documents?.length">
          <div class="text-subtitle2 q-mb-sm">Attached Document</div>
          <q-btn
            outline color="primary" icon="visibility"
            :label="editingInvoice.documents[0].filename"
            @click="previewDocument(editingInvoice)"
            no-caps
          />
        </q-card-section>

        <!-- Extracted Line Items -->
        <q-card-section v-if="editingInvoice.line_items?.length">
          <div class="text-h6 q-mb-sm">Extracted Line Items</div>
          <q-markup-table flat bordered dense>
            <thead>
              <tr>
                <th class="text-left">Description</th>
                <th class="text-right">Qty</th>
                <th class="text-right">Unit Price</th>
                <th class="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, idx) in editingInvoice.line_items" :key="idx">
                <td>{{ item.description }}</td>
                <td class="text-right">{{ item.quantity }}</td>
                <td class="text-right">{{ item.unit_price }}</td>
                <td class="text-right">{{ item.amount }}</td>
              </tr>
            </tbody>
          </q-markup-table>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { useVendorInvoiceStore } from '@/stores/vendor-invoice.store';
import { vendorInvoicesApi } from '@/services/api/vendor-invoices.api';
import { documentsApi } from '@/services/api/documents.api';
import type { VendorInvoice, VendorInvoiceStatus, EntryCategory } from '@/types';

const $q = useQuasar();
const vendorStore = useVendorInvoiceStore();

const vendorInvoices = computed(() => vendorStore.vendorInvoices);
const loading = computed(() => vendorStore.loading);
const categoryFilter = ref('all');
const uploadFile = ref<File | null>(null);
const uploadCategory = ref<EntryCategory>('business');
const uploading = ref(false);
const aiConfigured = ref(true);
const showEditDialog = ref(false);
const editingInvoice = ref<VendorInvoice | null>(null);
const saving = ref(false);
const reExtracting = ref<string | null>(null);

const filteredExpenses = computed(() => {
  if (categoryFilter.value === 'all') return vendorInvoices.value;
  return vendorInvoices.value.filter(vi => vi.category === categoryFilter.value);
});

const editForm = ref({
  vendor_name: '',
  invoice_number: '',
  invoice_date: '',
  due_date: '',
  subtotal: 0,
  tax_amount: 0,
  total: 0,
  status: 'pending' as VendorInvoiceStatus,
  category: 'business' as EntryCategory,
  notes: '',
});

function formatMoney(amount: number): string {
  return (amount || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function viStatusColor(status: VendorInvoiceStatus): string {
  const map: Record<VendorInvoiceStatus, string> = { pending: 'warning', reviewed: 'blue', approved: 'green', rejected: 'red' };
  return map[status] || 'grey';
}

async function handleUpload() {
  if (!uploadFile.value) return;
  uploading.value = true;
  try {
    const result = await vendorStore.uploadVendorInvoice(uploadFile.value, uploadCategory.value);
    const extraction = result.extraction as { success?: boolean };
    if (extraction?.success) {
      $q.notify({ type: 'positive', message: 'Expense uploaded and data extracted!' });
    } else {
      $q.notify({ type: 'info', message: 'Expense uploaded. Review the extracted data.' });
    }
    uploadFile.value = null;
  } catch (err: unknown) {
    const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Upload failed';
    $q.notify({ type: 'negative', message });
  } finally {
    uploading.value = false;
  }
}

function editVendorInvoice(vi: VendorInvoice) {
  editingInvoice.value = vi;
  editForm.value = {
    vendor_name: vi.vendor_name || '',
    invoice_number: vi.invoice_number || '',
    invoice_date: vi.invoice_date || '',
    due_date: vi.due_date || '',
    subtotal: vi.subtotal || 0,
    tax_amount: vi.tax_amount || 0,
    total: vi.total || 0,
    status: vi.status,
    category: vi.category || 'business',
    notes: vi.notes || '',
  };
  showEditDialog.value = true;
}

async function saveVendorInvoice() {
  if (!editingInvoice.value) return;
  saving.value = true;
  try {
    await vendorStore.updateVendorInvoice(editingInvoice.value.id, editForm.value);
    showEditDialog.value = false;
    $q.notify({ type: 'positive', message: 'Expense updated' });
  } catch {
    $q.notify({ type: 'negative', message: 'Failed to update' });
  } finally {
    saving.value = false;
  }
}

function previewDocument(vi: VendorInvoice) {
  if (vi.documents?.length) {
    const doc = vi.documents[0];
    window.open(documentsApi.previewUrl(doc.id), '_blank');
  }
}

async function handleReExtract(vi: VendorInvoice) {
  reExtracting.value = vi.id;
  try {
    const result = await vendorStore.reExtractVendorInvoice(vi.id);
    const extraction = result.extraction as { success?: boolean };
    if (extraction?.success) {
      $q.notify({ type: 'positive', message: 'Data re-extracted successfully!' });
      // Refresh edit form if dialog is open
      if (showEditDialog.value && editingInvoice.value?.id === vi.id) {
        editVendorInvoice(result.data);
      }
    } else {
      $q.notify({ type: 'warning', message: result.message || 'Re-extraction returned no data' });
    }
  } catch (err: unknown) {
    const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Re-extraction failed';
    $q.notify({ type: 'negative', message });
  } finally {
    reExtracting.value = null;
  }
}

function confirmDelete(vi: VendorInvoice) {
  $q.dialog({
    title: 'Delete Expense',
    message: 'Delete this expense entry?',
    cancel: true,
  }).onOk(async () => {
    await vendorStore.deleteVendorInvoice(vi.id);
    $q.notify({ type: 'positive', message: 'Deleted' });
  });
}

onMounted(async () => {
  vendorStore.fetchVendorInvoices();
  try {
    const res = await vendorInvoicesApi.aiStatus();
    aiConfigured.value = res.data.configured;
  } catch { /* ignore */ }
});
</script>
