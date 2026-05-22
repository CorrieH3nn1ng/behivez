import apiClient from './client';
import type { VendorRule } from '@/types';

export const vendorRulesApi = {
  list() {
    return apiClient.get<{ data: VendorRule[] }>('/vendor-rules');
  },

  save(data: {
    vendor_pattern: string;
    subcategory_id: string | null;
    default_nature: 'business' | 'private';
    match_type?: string;
  }) {
    return apiClient.post<{ data: VendorRule }>('/vendor-rules', data);
  },

  update(id: string, data: Partial<VendorRule>) {
    return apiClient.put<{ data: VendorRule }>(`/vendor-rules/${id}`, data);
  },

  delete(id: string) {
    return apiClient.delete(`/vendor-rules/${id}`);
  },
};
