import axios from 'axios';
import apiClient from './client';
import type { Invoice, InvoiceSummary } from '@/types';

export const invoicesApi = {
  list(params?: { status?: string; client_id?: string }) {
    return apiClient.get<{ data: Invoice[]; summary: InvoiceSummary }>('/invoices', { params });
  },

  get(id: string) {
    return apiClient.get<{ data: Invoice }>(`/invoices/${id}`);
  },

  create(data: {
    client_id: string;
    invoice_date: string;
    due_date: string;
    tax_rate?: number;
    title?: string;
    notes?: string;
    items: { description: string; quantity: number; unit?: string; unit_price: number }[];
  }) {
    return apiClient.post<{ data: Invoice }>('/invoices', data);
  },

  update(id: string, data: Record<string, unknown>) {
    return apiClient.put<{ data: Invoice }>(`/invoices/${id}`, data);
  },

  delete(id: string) {
    return apiClient.delete(`/invoices/${id}`);
  },

  markSent(id: string) {
    return apiClient.post<{ data: Invoice }>(`/invoices/${id}/send`);
  },

  markPaid(id: string, paid_date: string) {
    return apiClient.post<{ data: Invoice }>(`/invoices/${id}/pay`, { paid_date });
  },

  cancel(id: string) {
    return apiClient.post<{ data: Invoice }>(`/invoices/${id}/cancel`);
  },

  previewNumber(client_id: string, invoice_date: string) {
    return apiClient.get<{ invoice_number: string; sequence_number: number }>(
      '/invoices/preview-number',
      { params: { client_id, invoice_date } }
    );
  },

  savePdf(id: string, pdfBlob: Blob) {
    const formData = new FormData();
    formData.append('pdf', pdfBlob, 'invoice.pdf');
    return apiClient.post(`/invoices/${id}/pdf`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  uploadPdf(id: string, file: File) {
    const formData = new FormData();
    formData.append('pdf', file);
    return apiClient.post<{ data: { document: import('@/types').Document } }>(`/invoices/${id}/pdf`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  /** Send file to n8n webhook for AI extraction via native Gemini Analyze Document node */
  extractViaN8n(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    const n8nBase = import.meta.env.VITE_N8N_URL || '/n8n';
    return axios.post<{ success: boolean; data: Record<string, unknown> | null; error?: string }>(
      `${n8nBase}/webhook/extract-invoice`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000,
      },
    );
  },
};
