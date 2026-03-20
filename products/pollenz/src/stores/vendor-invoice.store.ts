import { defineStore } from 'pinia';
import { ref } from 'vue';
import { vendorInvoicesApi } from '@/services/api/vendor-invoices.api';
import type { VendorInvoice } from '@/types';

export const useVendorInvoiceStore = defineStore('vendorInvoice', () => {
  const vendorInvoices = ref<VendorInvoice[]>([]);
  const loading = ref(false);

  async function fetchVendorInvoices() {
    loading.value = true;
    try {
      const res = await vendorInvoicesApi.list();
      vendorInvoices.value = res.data.data;
    } finally {
      loading.value = false;
    }
  }

  async function uploadVendorInvoice(file: File, category = 'business') {
    const res = await vendorInvoicesApi.upload(file, category);
    vendorInvoices.value.unshift(res.data.data);
    return res.data;
  }

  async function updateVendorInvoice(id: string, data: Partial<VendorInvoice>) {
    const res = await vendorInvoicesApi.update(id, data);
    const idx = vendorInvoices.value.findIndex(v => v.id === id);
    if (idx !== -1) vendorInvoices.value[idx] = res.data.data;
    return res.data.data;
  }

  async function reExtractVendorInvoice(id: string) {
    const res = await vendorInvoicesApi.reExtract(id);
    const idx = vendorInvoices.value.findIndex(v => v.id === id);
    if (idx !== -1) vendorInvoices.value[idx] = res.data.data;
    return res.data;
  }

  async function deleteVendorInvoice(id: string) {
    await vendorInvoicesApi.delete(id);
    vendorInvoices.value = vendorInvoices.value.filter(v => v.id !== id);
  }

  return {
    vendorInvoices, loading,
    fetchVendorInvoices, uploadVendorInvoice, updateVendorInvoice,
    reExtractVendorInvoice, deleteVendorInvoice,
  };
});
