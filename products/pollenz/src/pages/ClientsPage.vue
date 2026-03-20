<template>
  <q-page padding>
    <div class="row items-center q-mb-md">
      <div class="text-h5 col">Clients</div>
      <q-btn color="primary" icon="add" label="Add Client" @click="showDialog = true" unelevated />
    </div>

    <q-card>
      <q-list separator>
        <q-item v-for="client in clients" :key="client.id">
          <q-item-section avatar>
            <q-avatar color="primary" text-color="white">{{ client.client_code }}</q-avatar>
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ client.name }}</q-item-label>
            <q-item-label caption>
              {{ client.contact_person || '' }}
              {{ client.email ? `- ${client.email}` : '' }}
            </q-item-label>
          </q-item-section>
          <q-item-section side>
            <div class="q-gutter-xs">
              <q-btn flat round size="sm" icon="edit" @click="editClient(client)" />
              <q-btn flat round size="sm" icon="delete" color="negative" @click="confirmDelete(client)" />
            </div>
          </q-item-section>
        </q-item>
        <q-item v-if="!clients.length && !loading">
          <q-item-section class="text-grey-5 text-center q-pa-lg">
            No clients yet. Add your first client to start invoicing.
          </q-item-section>
        </q-item>
      </q-list>
    </q-card>

    <!-- Add/Edit Dialog -->
    <q-dialog v-model="showDialog" persistent maximized transition-show="slide-up" transition-hide="slide-down">
      <q-card>
        <q-toolbar class="bg-primary text-white">
          <q-btn flat round icon="close" @click="closeDialog" />
          <q-toolbar-title>{{ editingClient ? 'Edit Client' : 'New Client' }}</q-toolbar-title>
          <q-btn flat label="Save" @click="saveClient" :loading="saving" />
        </q-toolbar>

        <q-card-section class="q-pa-md">
          <q-form class="q-gutter-md">
            <q-input v-model="form.name" label="Business/Client Name" outlined dense :rules="[v => !!v || 'Required']" />
            <q-input v-model="form.client_code" label="Client Code (3 letters)" outlined dense
              maxlength="3" :rules="[v => /^[A-Z0-9]{3}$/.test(v) || '3 uppercase alphanumeric chars']"
              :disable="!!editingClient"
              @update:model-value="v => form.client_code = v.toUpperCase()" />
            <q-input v-model="form.contact_person" label="Contact Person" outlined dense />
            <q-input v-model="form.email" label="Email" type="email" outlined dense />
            <q-input v-model="form.phone" label="Phone" outlined dense />
            <q-input v-model="form.address" label="Address" type="textarea" outlined dense autogrow />
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { useClientStore } from '@/stores/client.store';
import type { Client } from '@/types';

const $q = useQuasar();
const clientStore = useClientStore();

const clients = computed(() => clientStore.clients);
const loading = computed(() => clientStore.loading);
const showDialog = ref(false);
const saving = ref(false);
const editingClient = ref<Client | null>(null);

const form = ref({
  name: '',
  client_code: '',
  contact_person: '',
  email: '',
  phone: '',
  address: '',
});

function editClient(client: Client) {
  editingClient.value = client;
  form.value = {
    name: client.name,
    client_code: client.client_code,
    contact_person: client.contact_person || '',
    email: client.email || '',
    phone: client.phone || '',
    address: client.address || '',
  };
  showDialog.value = true;
}

function closeDialog() {
  showDialog.value = false;
  editingClient.value = null;
  form.value = { name: '', client_code: '', contact_person: '', email: '', phone: '', address: '' };
}

async function saveClient() {
  if (!form.value.name || !form.value.client_code) return;
  saving.value = true;
  try {
    if (editingClient.value) {
      await clientStore.updateClient(editingClient.value.id, form.value);
      $q.notify({ type: 'positive', message: 'Client updated' });
    } else {
      await clientStore.createClient(form.value);
      $q.notify({ type: 'positive', message: 'Client created' });
    }
    closeDialog();
  } catch (err: unknown) {
    const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to save client';
    $q.notify({ type: 'negative', message });
  } finally {
    saving.value = false;
  }
}

function confirmDelete(client: Client) {
  $q.dialog({
    title: 'Delete Client',
    message: `Delete "${client.name}"? This cannot be undone.`,
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    try {
      await clientStore.deleteClient(client.id);
      $q.notify({ type: 'positive', message: 'Client deleted' });
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Cannot delete client';
      $q.notify({ type: 'negative', message });
    }
  });
}

onMounted(() => clientStore.fetchClients());
</script>
