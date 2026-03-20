import apiClient from './client';
import type { Client } from '@/types';

export const clientsApi = {
  list() {
    return apiClient.get<{ data: Client[] }>('/clients');
  },

  get(id: string) {
    return apiClient.get<{ data: Client }>(`/clients/${id}`);
  },

  create(data: Partial<Client>) {
    return apiClient.post<{ data: Client }>('/clients', data);
  },

  update(id: string, data: Partial<Client>) {
    return apiClient.put<{ data: Client }>(`/clients/${id}`, data);
  },

  delete(id: string) {
    return apiClient.delete(`/clients/${id}`);
  },
};
