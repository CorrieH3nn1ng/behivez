<template>
  <div>
    <div class="text-subtitle2 q-mb-sm">Activity Timeline</div>

    <q-timeline v-if="entries.length" color="primary">
      <q-timeline-entry
        v-for="entry in entries"
        :key="entry.id"
        :color="statusColor(entry.status)"
        :icon="statusIcon(entry.status)"
      >
        <template v-slot:title>
          <div class="row items-center">
            <span class="text-weight-medium">{{ statusLabel(entry.status) }}</span>
            <q-badge v-if="entry.costAmount" color="amber-8" class="q-ml-sm" text-color="white">
              R{{ entry.costAmount.toLocaleString() }}
            </q-badge>
            <q-icon
              v-if="entry.receiptPhotos.length"
              name="receipt_long"
              size="16px"
              class="q-ml-sm text-grey-6"
            />
          </div>
        </template>
        <template v-slot:subtitle>
          {{ formatDate(entry.timestamp) }}
          <span v-if="entry.vendor"> &middot; {{ entry.vendor }}</span>
        </template>
        <div v-if="entry.notes" class="text-caption text-grey-7">{{ entry.notes }}</div>
        <div v-if="entry.odometer" class="text-caption text-grey-5">Odo: {{ entry.odometer.toLocaleString() }} km</div>
      </q-timeline-entry>
    </q-timeline>

    <div v-else class="text-caption text-grey-5 text-center q-pa-lg">
      No activity yet
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useStatusLogStore } from 'stores/statusLog';
import { STATUS_CONFIG } from 'src/types';
import type { VehicleStatus } from 'src/types';

const props = defineProps<{ vehicleId: string }>();
const statusLogStore = useStatusLogStore();

const entries = computed(() => statusLogStore.entriesForVehicle(props.vehicleId));

const statusColor = (s: VehicleStatus) => STATUS_CONFIG[s].color;
const statusIcon = (s: VehicleStatus) => STATUS_CONFIG[s].icon;
const statusLabel = (s: VehicleStatus) => STATUS_CONFIG[s].label;

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
</script>
