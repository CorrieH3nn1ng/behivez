<template>
  <q-page padding>
    <div class="row items-center q-mb-md">
      <div class="text-h5">Vehicles</div>
      <q-space />
      <q-btn-toggle
        v-model="viewMode"
        toggle-color="primary"
        :options="[
          { value: 'grid', slot: 'grid' },
          { value: 'list', slot: 'list' }
        ]"
      >
        <template v-slot:grid>
          <q-icon name="grid_view" />
        </template>
        <template v-slot:list>
          <q-icon name="view_list" />
        </template>
      </q-btn-toggle>
    </div>

    <!-- Filters -->
    <q-card class="q-mb-md">
      <q-card-section class="q-pb-none">
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-4">
            <q-input
              v-model="vehiclesStore.filters.search"
              label="Search"
              outlined
              dense
              clearable
            >
              <template v-slot:prepend>
                <q-icon name="search" />
              </template>
            </q-input>
          </div>
          <div class="col-6 col-md-4">
            <q-select
              v-model="vehiclesStore.filters.status"
              label="Status"
              :options="statusOptions"
              outlined
              dense
              clearable
              emit-value
              map-options
            />
          </div>
          <div class="col-6 col-md-4">
            <q-select
              v-model="vehiclesStore.filters.categoryId"
              label="Category"
              :options="categoryOptions"
              outlined
              dense
              clearable
              emit-value
              map-options
            />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Loading -->
    <div v-if="vehiclesStore.isLoading" class="text-center q-pa-lg">
      <q-spinner color="primary" size="48px" />
    </div>

    <!-- Grid View -->
    <div v-else-if="viewMode === 'grid'" class="row q-col-gutter-md">
      <div
        v-for="vehicle in vehiclesStore.filteredVehicles"
        :key="vehicle.id"
        class="col-12 col-sm-6 col-md-4 col-lg-3"
      >
        <q-card class="vehicle-card" @click="$router.push(`/vehicles/${vehicle.id}`)">
          <q-img
            v-if="vehicle.imageUrl"
            :src="vehicle.imageUrl"
            :ratio="16/9"
          />
          <div v-else class="bg-grey-3 flex flex-center" style="height: 120px">
            <q-icon name="directions_car" size="48px" color="grey-6" />
          </div>
          <q-card-section>
            <div class="row items-center">
              <div class="text-h6">{{ vehicle.registration }}</div>
              <q-space />
              <span :class="['status-badge', vehicle.status.toLowerCase()]">
                {{ vehicle.status }}
              </span>
            </div>
            <div class="text-subtitle2 text-grey-7">
              {{ vehicle.make }} {{ vehicle.model }} {{ vehicle.year }}
            </div>
            <div class="text-caption text-grey-6">
              {{ vehicle.categoryName }} | {{ vehicle.color }}
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- List View -->
    <q-card v-else>
      <q-list separator>
        <q-item
          v-for="vehicle in vehiclesStore.filteredVehicles"
          :key="vehicle.id"
          clickable
          @click="$router.push(`/vehicles/${vehicle.id}`)"
        >
          <q-item-section avatar>
            <q-avatar color="grey-3">
              <q-icon name="directions_car" color="grey-7" />
            </q-avatar>
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ vehicle.registration }}</q-item-label>
            <q-item-label caption>
              {{ vehicle.make }} {{ vehicle.model }} | {{ vehicle.categoryName }}
            </q-item-label>
          </q-item-section>
          <q-item-section side>
            <span :class="['status-badge', vehicle.status.toLowerCase()]">
              {{ vehicle.status }}
            </span>
          </q-item-section>
        </q-item>
      </q-list>
    </q-card>

    <!-- Empty State -->
    <div
      v-if="!vehiclesStore.isLoading && vehiclesStore.filteredVehicles.length === 0"
      class="text-center q-pa-lg text-grey-6"
    >
      <q-icon name="search_off" size="64px" />
      <div class="text-h6 q-mt-md">No vehicles found</div>
      <div>Try adjusting your filters</div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useVehiclesStore, VehicleStatus } from 'stores/vehicles';

const vehiclesStore = useVehiclesStore();

const viewMode = ref<'grid' | 'list'>('grid');

const statusOptions: { label: string; value: VehicleStatus }[] = [
  { label: 'Ready', value: 'READY' },
  { label: 'Out', value: 'OUT' },
  { label: 'Returned', value: 'RETURNED' },
  { label: 'Cleaning', value: 'CLEANING' },
  { label: 'Workshop', value: 'WORKSHOP' },
  { label: 'Maintenance', value: 'MAINTENANCE' },
  { label: 'Transferred', value: 'TRANSFERRED' },
  { label: 'Inactive', value: 'INACTIVE' },
];

// TODO: Load from API
const categoryOptions = ref([
  { label: 'Category A', value: 'cat-a' },
  { label: 'Category B', value: 'cat-b' },
  { label: 'SUV', value: 'suv' },
]);

onMounted(() => {
  vehiclesStore.fetchVehicles();
});
</script>
