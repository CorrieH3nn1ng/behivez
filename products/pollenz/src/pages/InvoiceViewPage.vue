<template>
  <q-page padding>
    <div v-if="invoice">
      <div class="row items-center q-mb-md">
        <q-btn flat round icon="arrow_back" @click="$router.push('/income')" class="q-mr-sm" />
        <div class="text-h5 col">{{ invoice.invoice_number }}</div>
        <q-badge :color="statusColor(invoice.status)" :label="invoice.status" class="text-body1 q-pa-sm" />
      </div>

      <!-- Invoice Details -->
      <q-card class="q-mb-md">
        <q-card-section>
          <div class="row q-col-gutter-md">
            <div class="col-12 col-sm-6">
              <div class="text-subtitle2 text-grey-7">Client</div>
              <div class="text-body1 text-weight-medium">{{ invoice.client?.name }}</div>
              <div class="text-caption text-grey-6">{{ invoice.client?.contact_person }}</div>
              <div class="text-caption text-grey-6">{{ invoice.client?.email }}</div>
            </div>
            <div class="col-12 col-sm-6">
              <div class="text-subtitle2 text-grey-7">Dates</div>
              <div>Invoice: {{ invoice.invoice_date }}</div>
              <div>Due: {{ invoice.due_date }}</div>
              <div v-if="invoice.paid_date">Paid: {{ invoice.paid_date }}</div>
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- Line Items -->
      <q-card class="q-mb-md">
        <q-card-section>
          <div class="text-h6 q-mb-sm">Line Items</div>
          <q-markup-table flat bordered>
            <thead>
              <tr>
                <th class="text-left">Description</th>
                <th class="text-right">Qty</th>
                <th class="text-right">Unit Price</th>
                <th class="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in invoice.items" :key="item.id">
                <td>{{ item.description }}</td>
                <td class="text-right">{{ item.quantity }}</td>
                <td class="text-right">R {{ formatMoney(item.unit_price) }}</td>
                <td class="text-right">R {{ formatMoney(item.amount) }}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td colspan="3" class="text-right text-weight-medium">Subtotal</td>
                <td class="text-right">R {{ formatMoney(invoice.subtotal) }}</td>
              </tr>
              <tr v-if="invoice.tax_rate > 0">
                <td colspan="3" class="text-right">VAT ({{ invoice.tax_rate }}%)</td>
                <td class="text-right">R {{ formatMoney(invoice.tax_amount) }}</td>
              </tr>
              <tr>
                <td colspan="3" class="text-right text-weight-bold text-h6">Total</td>
                <td class="text-right text-weight-bold text-h6 text-primary">R {{ formatMoney(invoice.total) }}</td>
              </tr>
            </tfoot>
          </q-markup-table>
        </q-card-section>
      </q-card>

      <!-- Notes -->
      <q-card v-if="invoice.notes" class="q-mb-md">
        <q-card-section>
          <div class="text-subtitle2 text-grey-7">Notes</div>
          <div>{{ invoice.notes }}</div>
        </q-card-section>
      </q-card>

      <!-- Attached Documents -->
      <q-card v-if="invoice.documents && invoice.documents.length" class="q-mb-md">
        <q-card-section>
          <div class="text-h6 q-mb-sm">Attached Documents</div>
          <q-list separator>
            <q-item v-for="doc in invoice.documents" :key="doc.id" clickable>
              <q-item-section avatar>
                <q-icon name="picture_as_pdf" color="negative" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ doc.filename }}</q-item-label>
                <q-item-label caption>{{ formatFileSize(doc.size) }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <div class="q-gutter-xs">
                  <q-btn flat round size="sm" icon="visibility" @click="handlePreviewDoc(doc)" />
                  <q-btn flat round size="sm" icon="download" @click="handleDownloadDoc(doc)" />
                </div>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>
      </q-card>

      <!-- Actions -->
      <q-card>
        <q-card-section class="q-gutter-sm">
          <q-btn v-if="invoice.status === 'draft'" color="primary" icon="edit" label="Edit" @click="$router.push(`/income/${invoice.id}/edit`)" unelevated />
          <q-btn v-if="invoice.status === 'draft'" color="info" icon="send" label="Mark Sent" @click="handleMarkSent" unelevated />
          <q-btn v-if="['sent','overdue'].includes(invoice.status)" color="positive" icon="check" label="Mark Paid" @click="showPayDialog = true" unelevated />
          <q-btn v-if="invoice.status !== 'paid'" color="negative" icon="cancel" label="Cancel" @click="handleCancel" flat />
          <q-btn color="accent" icon="picture_as_pdf" label="Generate PDF" @click="handleDownloadPdf" unelevated />
          <q-btn color="secondary" icon="upload_file" label="Upload PDF" @click="showUploadPdf" unelevated />
          <q-btn v-if="invoice.status !== 'cancelled'" color="negative" icon="delete" label="Delete" @click="handleDelete" flat />
        </q-card-section>
      </q-card>
    </div>

    <q-inner-loading :showing="!invoice" />

    <!-- Hidden file input for PDF upload -->
    <input
      ref="pdfFileInput"
      type="file"
      accept=".pdf"
      style="display: none"
      @change="handleFileSelected"
    />

    <!-- Pay Dialog -->
    <q-dialog v-model="showPayDialog">
      <q-card style="min-width: 300px">
        <q-card-section class="text-h6">Mark as Paid</q-card-section>
        <q-card-section>
          <q-input v-model="paidDate" label="Payment Date" type="date" outlined dense />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn color="positive" label="Confirm" @click="handleMarkPaid" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useInvoiceStore } from '@/stores/invoice.store';
import { InvoicePdfService } from '@/services/pdf/InvoicePdfService';
import { businessProfileApi } from '@/services/api/business-profile.api';
import { invoicesApi } from '@/services/api/invoices.api';
import { documentsApi } from '@/services/api/documents.api';
import type { Invoice, InvoiceStatus, Document as DocType } from '@/types';

const route = useRoute();
const router = useRouter();
const $q = useQuasar();
const invoiceStore = useInvoiceStore();

const invoice = ref<Invoice | null>(null);
const showPayDialog = ref(false);
const paidDate = ref(new Date().toISOString().slice(0, 10));
const pdfFileInput = ref<HTMLInputElement | null>(null);

function formatMoney(amount: number): string {
  return (amount || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function statusColor(status: InvoiceStatus): string {
  const map: Record<InvoiceStatus, string> = { draft: 'grey', sent: 'blue', paid: 'green', overdue: 'red', cancelled: 'grey-5' };
  return map[status] || 'grey';
}

async function handleMarkSent() {
  if (!invoice.value) return;
  invoice.value = await invoiceStore.markSent(invoice.value.id);
  $q.notify({ type: 'positive', message: 'Invoice marked as sent' });
}

async function handleMarkPaid() {
  if (!invoice.value) return;
  invoice.value = await invoiceStore.markPaid(invoice.value.id, paidDate.value);
  showPayDialog.value = false;
  $q.notify({ type: 'positive', message: 'Invoice marked as paid' });
}

async function handleCancel() {
  if (!invoice.value) return;
  $q.dialog({ title: 'Cancel Invoice', message: 'Are you sure?', cancel: true }).onOk(async () => {
    invoice.value = await invoiceStore.cancelInvoice(invoice.value!.id);
    $q.notify({ type: 'info', message: 'Invoice cancelled' });
  });
}

async function handleDelete() {
  if (!invoice.value) return;
  $q.dialog({ title: 'Delete Invoice', message: 'This cannot be undone.', cancel: true }).onOk(async () => {
    await invoiceStore.deleteInvoice(invoice.value!.id);
    $q.notify({ type: 'positive', message: 'Invoice deleted' });
    router.push('/income');
  });
}

async function handleDownloadPdf() {
  if (!invoice.value) return;
  try {
    const profileRes = await businessProfileApi.get();
    const pdfService = new InvoicePdfService();
    const blob = pdfService.generate({ invoice: invoice.value, profile: profileRes.data.data });

    // Save to backend
    try {
      await invoicesApi.savePdf(invoice.value.id, blob);
    } catch { /* non-critical */ }

    // Download locally
    pdfService.download({ invoice: invoice.value, profile: profileRes.data.data });
  } catch {
    $q.notify({ type: 'negative', message: 'Failed to generate PDF' });
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function showUploadPdf() {
  pdfFileInput.value?.click();
}

async function handleFileSelected(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file || !invoice.value) return;
  input.value = '';

  try {
    $q.loading.show({ message: 'Uploading PDF...' });
    await invoicesApi.uploadPdf(invoice.value.id, file);
    // Reload invoice to get updated documents list
    invoice.value = await invoiceStore.getInvoice(invoice.value.id);
    $q.notify({ type: 'positive', message: 'PDF uploaded' });
  } catch {
    $q.notify({ type: 'negative', message: 'Failed to upload PDF' });
  } finally {
    $q.loading.hide();
  }
}

function handlePreviewDoc(doc: DocType) {
  window.open(documentsApi.previewUrl(doc.id), '_blank');
}

function handleDownloadDoc(doc: DocType) {
  documentsApi.download(doc.id, doc.filename);
}

onMounted(async () => {
  invoice.value = await invoiceStore.getInvoice(route.params.id as string);
});
</script>
