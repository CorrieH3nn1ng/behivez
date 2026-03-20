<template>
  <q-page padding>
    <div class="text-h5 text-weight-bold q-mb-xs">Receipts</div>
    <div class="text-subtitle2 text-grey-7 q-mb-md">{{ vehicle?.registration }} &middot; {{ vehicle?.make }} {{ vehicle?.model }}</div>

    <div v-if="receipts.length" class="row q-col-gutter-sm">
      <div v-for="entry in receipts" :key="entry.id" class="col-6 col-sm-4 col-md-3">
        <q-card flat bordered class="cursor-pointer" @click="viewReceipt(entry)">
          <q-card-section class="q-pa-sm text-center">
            <q-icon name="receipt_long" size="40px" color="grey-4" />
            <div class="text-caption text-weight-medium q-mt-xs">{{ entry.vendor || statusLabel(entry.status) }}</div>
            <div class="text-caption text-primary text-weight-bold">R{{ (entry.costAmount || 0).toLocaleString() }}</div>
            <div class="text-caption text-grey-5">{{ formatDate(entry.timestamp) }}</div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <div v-else class="text-center q-pa-xl">
      <q-icon name="receipt_long" size="48px" color="grey-4" />
      <div class="text-subtitle1 text-grey-5 q-mt-md">No receipts yet</div>
      <div class="text-caption text-grey-6">Scan a receipt when changing vehicle status</div>
    </div>

    <!-- Receipt detail dialog -->
    <q-dialog v-model="showDialog">
      <q-card style="width: 400px; max-width: 90vw;">
        <q-card-section class="row items-center">
          <div class="text-h6">Receipt Details</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>
        <q-card-section v-if="selectedEntry">
          <div class="text-subtitle2">{{ selectedEntry.vendor || 'Unknown vendor' }}</div>
          <div class="text-caption text-grey-6">{{ formatDate(selectedEntry.timestamp) }}</div>
          <q-separator class="q-my-sm" />
          <div class="text-h6 text-primary">R{{ (selectedEntry.costAmount || 0).toLocaleString() }}</div>
          <div v-if="selectedEntry.notes" class="text-body2 q-mt-sm">{{ selectedEntry.notes }}</div>
          <div class="text-caption text-grey-5 q-mt-sm">{{ selectedEntry.receiptPhotos.length }} photo(s) attached</div>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { useVehiclesStore } from 'stores/vehicles';
import { useStatusLogStore } from 'stores/statusLog';
import { STATUS_CONFIG } from 'src/types';
import type { VehicleStatus, StatusLogEntry } from 'src/types';

const props = defineProps<{ id: string }>();
const vehiclesStore = useVehiclesStore();
const statusLogStore = useStatusLogStore();

const vehicle = computed(() => vehiclesStore.getVehicleById(props.id));
const receipts = computed(() => statusLogStore.receiptsForVehicle(props.id));
const showDialog = ref(false);
const selectedEntry = ref<StatusLogEntry | null>(null);

const statusLabel = (s: VehicleStatus) => STATUS_CONFIG[s].label;
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' });
}
function viewReceipt(entry: StatusLogEntry) {
  selectedEntry.value = entry;
  showDialog.value = true;
}

onMounted(() => {
  if (!vehiclesStore.vehicles.length) vehiclesStore.fetchVehicles();
  if (!statusLogStore.entries.length) statusLogStore.fetchEntries();
});
</script>
