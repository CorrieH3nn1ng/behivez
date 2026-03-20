import { defineStore } from 'pinia';
import { ref } from 'vue';
import { invoicesApi } from '@/services/api/invoices.api';
import type { Invoice, InvoiceSummary } from '@/types';

export const useInvoiceStore = defineStore('invoice', () => {
  const invoices = ref<Invoice[]>([]);
  const summary = ref<InvoiceSummary>({ total_invoiced: 0, total_paid: 0, total_outstanding: 0, count: 0 });
  const loading = ref(false);

  // Holds the uploaded file temporarily between InvoicesPage (upload) and InvoiceEditPage (save)
  const pendingUploadFile = ref<File | null>(null);

  async function fetchInvoices(params?: { status?: string; client_id?: string }) {
    loading.value = true;
    try {
      const res = await invoicesApi.list(params);
      invoices.value = res.data.data;
      summary.value = res.data.summary;
    } finally {
      loading.value = false;
    }
  }

  async function getInvoice(id: string) {
    const res = await invoicesApi.get(id);
    return res.data.data;
  }

  async function createInvoice(data: Parameters<typeof invoicesApi.create>[0]) {
    const res = await invoicesApi.create(data);
    invoices.value.unshift(res.data.data);
    return res.data.data;
  }

  async function updateInvoice(id: string, data: Record<string, unknown>) {
    const res = await invoicesApi.update(id, data);
    const idx = invoices.value.findIndex(i => i.id === id);
    if (idx !== -1) invoices.value[idx] = res.data.data;
    return res.data.data;
  }

  async function deleteInvoice(id: string) {
    await invoicesApi.delete(id);
    invoices.value = invoices.value.filter(i => i.id !== id);
  }

  async function markSent(id: string) {
    const res = await invoicesApi.markSent(id);
    const idx = invoices.value.findIndex(i => i.id === id);
    if (idx !== -1) invoices.value[idx] = res.data.data;
    return res.data.data;
  }

  async function markPaid(id: string, paid_date: string) {
    const res = await invoicesApi.markPaid(id, paid_date);
    const idx = invoices.value.findIndex(i => i.id === id);
    if (idx !== -1) invoices.value[idx] = res.data.data;
    return res.data.data;
  }

  async function cancelInvoice(id: string) {
    const res = await invoicesApi.cancel(id);
    const idx = invoices.value.findIndex(i => i.id === id);
    if (idx !== -1) invoices.value[idx] = res.data.data;
    return res.data.data;
  }

  return {
    invoices, summary, loading, pendingUploadFile,
    fetchInvoices, getInvoice, createInvoice, updateInvoice, deleteInvoice,
    markSent, markPaid, cancelInvoice,
  };
});
