<template>
  <q-page padding>
    <div class="row items-center q-mb-md">
      <div class="col">
        <div class="text-h5 text-weight-bold">Your Fleet</div>
        <div class="text-subtitle1 text-grey-7">
          {{ vehiclesStore.vehicleCount }} vehicle{{ vehiclesStore.vehicleCount !== 1 ? 's' : '' }}
          &middot; <span class="text-primary text-weight-bold">R{{ vehiclesStore.totalMonthlySpend.toLocaleString() }}</span> this month
        </div>
      </div>
    </div>

    <q-input v-if="vehiclesStore.vehicleCount > 2" v-model="vehiclesStore.searchQuery" outlined dense placeholder="Search vehicles..." class="q-mb-md">
      <template v-slot:prepend><q-icon name="search" /></template>
    </q-input>

    <div v-if="vehiclesStore.filteredVehicles.length" class="row q-col-gutter-md">
      <div v-for="vehicle in vehiclesStore.filteredVehicles" :key="vehicle.id" class="col-12 col-sm-6 col-md-4">
        <VehicleCard :vehicle="vehicle" @click="$router.push(`/vehicle/${vehicle.id}`)" />
      </div>
    </div>

    <div v-else-if="!vehiclesStore.isLoading" class="text-center q-pa-xl">
      <q-icon name="directions_car" size="64px" color="grey-4" />
      <div class="text-h6 text-grey-5 q-mt-md">No vehicles yet</div>
      <q-btn color="primary" icon="add" label="Add Your First Vehicle" class="q-mt-lg" @click="$router.push('/vehicle/add')" />
    </div>

    <q-page-sticky position="bottom-right" :offset="[18, 18]">
      <q-btn fab icon="add" color="primary" @click="$router.push('/vehicle/add')" />
    </q-page-sticky>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useVehiclesStore } from 'stores/vehicles';
import { useStatusLogStore } from 'stores/statusLog';
import VehicleCard from 'components/VehicleCard.vue';

const vehiclesStore = useVehiclesStore();
const statusLogStore = useStatusLogStore();

onMounted(() => {
  vehiclesStore.fetchVehicles();
  statusLogStore.fetchEntries();
});
</script>
