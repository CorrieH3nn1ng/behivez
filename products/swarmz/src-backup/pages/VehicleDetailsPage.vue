<template>
  <q-page padding>
    <q-btn flat icon="arrow_back" label="Back" @click="$router.back()" class="q-mb-md" />

    <div v-if="vehiclesStore.isLoading" class="text-center q-pa-xl">
      <q-spinner color="primary" size="48px" />
    </div>

    <template v-else-if="vehicle">
      <q-card class="q-mb-md">
        <q-card-section>
          <div class="row items-center">
            <div class="text-h5">{{ vehicle.registration }}</div>
            <q-space />
            <span :class="['status-badge', vehicle.status.toLowerCase()]">
              {{ vehicle.status }}
            </span>
          </div>
          <div class="text-subtitle1 text-grey-7">
            {{ vehicle.make }} {{ vehicle.model }} {{ vehicle.year }}
          </div>
        </q-card-section>
        <q-separator />
        <q-card-section>
          <div class="row q-col-gutter-md">
            <div class="col-6 col-md-3">
              <div class="text-caption text-grey-7">Category</div>
              <div>{{ vehicle.categoryName }}</div>
            </div>
            <div class="col-6 col-md-3">
              <div class="text-caption text-grey-7">Color</div>
              <div>{{ vehicle.color }}</div>
            </div>
            <div class="col-6 col-md-3">
              <div class="text-caption text-grey-7">Odometer</div>
              <div>{{ vehicle.odometer.toLocaleString() }} km</div>
            </div>
            <div class="col-6 col-md-3">
              <div class="text-caption text-grey-7">Fuel Level</div>
              <div>{{ vehicle.fuelLevel }}%</div>
            </div>
          </div>
        </q-card-section>
      </q-card>

      <q-card>
        <q-card-section>
          <div class="text-h6">Quick Actions</div>
        </q-card-section>
        <q-card-section>
          <div class="row q-col-gutter-sm">
            <div class="col-6 col-md-3">
              <q-btn
                color="positive"
                class="full-width"
                :disable="vehicle.status === 'READY'"
                @click="setStatus('READY')"
              >
                Set Ready
              </q-btn>
            </div>
            <div class="col-6 col-md-3">
              <q-btn
                color="accent"
                class="full-width"
                :disable="vehicle.status === 'CLEANING'"
                @click="setStatus('CLEANING')"
              >
                Send to Cleaning
              </q-btn>
            </div>
            <div class="col-6 col-md-3">
              <q-btn
                color="negative"
                class="full-width"
                :disable="vehicle.status === 'WORKSHOP'"
                @click="setStatus('WORKSHOP')"
              >
                Send to Workshop
              </q-btn>
            </div>
            <div class="col-6 col-md-3">
              <q-btn
                color="orange"
                class="full-width"
                :disable="vehicle.status === 'MAINTENANCE'"
                @click="setStatus('MAINTENANCE')"
              >
                Maintenance
              </q-btn>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </template>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useVehiclesStore, VehicleStatus } from 'stores/vehicles';

const route = useRoute();
const vehiclesStore = useVehiclesStore();

const vehicle = computed(() => vehiclesStore.currentVehicle);

async function setStatus(status: VehicleStatus) {
  if (!vehicle.value) return;
  await vehiclesStore.updateVehicleStatus(vehicle.value.id, status);
}

onMounted(() => {
  const id = route.params.id as string;
  vehiclesStore.fetchVehicle(id);
});
</script>
