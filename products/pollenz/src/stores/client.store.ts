import { defineStore } from 'pinia';
import { ref } from 'vue';
import { clientsApi } from '@/services/api/clients.api';
import type { Client } from '@/types';

export const useClientStore = defineStore('client', () => {
  const clients = ref<Client[]>([]);
  const loading = ref(false);

  async function fetchClients() {
    loading.value = true;
    try {
      const res = await clientsApi.list();
      clients.value = res.data.data;
    } finally {
      loading.value = false;
    }
  }

  async function createClient(data: Partial<Client>) {
    const res = await clientsApi.create(data);
    clients.value.push(res.data.data);
    return res.data.data;
  }

  async function updateClient(id: string, data: Partial<Client>) {
    const res = await clientsApi.update(id, data);
    const idx = clients.value.findIndex(c => c.id === id);
    if (idx !== -1) clients.value[idx] = res.data.data;
    return res.data.data;
  }

  async function deleteClient(id: string) {
    await clientsApi.delete(id);
    clients.value = clients.value.filter(c => c.id !== id);
  }

  return { clients, loading, fetchClients, createClient, updateClient, deleteClient };
});
