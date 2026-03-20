import apiClient from './client';
import type { VendorInvoice } from '@/types';

export const vendorInvoicesApi = {
  list() {
    return apiClient.get<{ data: VendorInvoice[] }>('/vendor-invoices');
  },

  get(id: string) {
    return apiClient.get<{ data: VendorInvoice }>(`/vendor-invoices/${id}`);
  },

  upload(file: File, category = 'business') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);
    return apiClient.post<{ data: VendorInvoice; extraction: Record<string, unknown> }>(
      '/vendor-invoices/upload',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
  },

  update(id: string, data: Partial<VendorInvoice>) {
    return apiClient.put<{ data: VendorInvoice }>(`/vendor-invoices/${id}`, data);
  },

  reExtract(id: string) {
    return apiClient.post<{ data: VendorInvoice; extraction: Record<string, unknown> }>(
      `/vendor-invoices/${id}/re-extract`
    );
  },

  delete(id: string) {
    return apiClient.delete(`/vendor-invoices/${id}`);
  },

  aiStatus() {
    return apiClient.get<{ configured: boolean }>('/vendor-invoices/ai-status');
  },
};
