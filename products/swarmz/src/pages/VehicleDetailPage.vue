<template>
  <q-page padding v-if="vehicle">
    <!-- Hero -->
    <q-card flat class="q-mb-md">
      <q-card-section horizontal>
        <q-card-section class="col-3 flex flex-center">
          <q-avatar size="80px" color="grey-3" text-color="grey-6">
            <img v-if="vehicle.photoUrl" :src="vehicle.photoUrl" />
            <q-icon v-else name="directions_car" size="40px" />
          </q-avatar>
        </q-card-section>
        <q-card-section class="col">
          <div class="text-h5 text-weight-bold">{{ vehicle.registration }}</div>
          <div class="text-subtitle1 text-grey-7">{{ vehicle.make }} {{ vehicle.model }} &middot; {{ vehicle.year }} &middot; {{ vehicle.color }}</div>
          <div class="q-mt-xs"><StatusBadge :status="vehicle.currentStatus" /></div>
          <div class="text-caption text-grey-5 q-mt-xs">Odometer: {{ vehicle.odometer.toLocaleString() }} km</div>
        </q-card-section>
      </q-card-section>
    </q-card>

    <!-- Actions -->
    <div class="row q-gutter-sm q-mb-md">
      <q-btn color="primary" icon="swap_horiz" label="Change Status" @click="$router.push(`/vehicle/${vehicle.id}/status`)" />
      <q-btn outline color="grey-7" icon="receipt_long" label="Receipts" @click="$router.push(`/vehicle/${vehicle.id}/receipts`)" />
      <q-btn outline color="amber-8" icon="local_gas_station" label="Expenses" @click="$router.push(`/vehicle/${vehicle.id}/expenses`)" />
      <q-btn outline color="teal" icon="route" label="Trips" @click="$router.push(`/vehicle/${vehicle.id}/trips`)" />
      <q-btn flat color="red" icon="delete" label="Remove" @click="confirmDelete" />
    </div>

    <!-- Cost Breakdown -->
    <q-card flat bordered class="q-pa-md q-mb-md">
      <CostSummary :vehicle-id="vehicle.id" />
    </q-card>

    <!-- Timeline -->
    <q-card flat bordered class="q-pa-md">
      <StatusTimeline :vehicle-id="vehicle.id" />
    </q-card>
  </q-page>

  <q-page v-else class="flex flex-center">
    <div class="text-grey-5">Vehicle not found</div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useVehiclesStore } from 'stores/vehicles';
import { useStatusLogStore } from 'stores/statusLog';
import StatusBadge from 'components/StatusBadge.vue';
import CostSummary from 'components/CostSummary.vue';
import StatusTimeline from 'components/StatusTimeline.vue';

const props = defineProps<{ id: string }>();
const router = useRouter();
const $q = useQuasar();
const vehiclesStore = useVehiclesStore();
const statusLogStore = useStatusLogStore();

const vehicle = computed(() => vehiclesStore.getVehicleById(props.id));

function confirmDelete() {
  $q.dialog({
    title: 'Remove Vehicle',
    message: `Are you sure you want to remove ${vehicle.value?.registration}? This will deactivate the vehicle but keep its history.`,
    cancel: true,
    persistent: true,
    color: 'red',
  }).onOk(async () => {
    try {
      await vehiclesStore.deleteVehicle(props.id);
      $q.notify({ type: 'info', message: 'Vehicle removed' });
      router.push('/');
    } catch {
      $q.notify({ type: 'negative', message: 'Failed to remove vehicle' });
    }
  });
}

onMounted(() => {
  if (!vehiclesStore.vehicles.length) vehiclesStore.fetchVehicles();
  if (!statusLogStore.entries.length) statusLogStore.fetchEntries();
});
</script>
