import apiClient from './client';
import type { BusinessProfile } from '@/types';

export const businessProfileApi = {
  get() {
    return apiClient.get<{ data: BusinessProfile }>('/business-profile');
  },

  update(data: Partial<BusinessProfile>) {
    return apiClient.put<{ data: BusinessProfile }>('/business-profile', data);
  },

  uploadLogo(file: File) {
    const formData = new FormData();
    formData.append('logo', file);
    return apiClient.post<{ data: BusinessProfile }>('/business-profile/logo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
