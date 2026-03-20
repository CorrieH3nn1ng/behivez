<template>
  <q-page padding>
    <div class="row items-center q-mb-md">
      <div class="text-h5">Status Board</div>
      <q-space />
      <q-btn flat icon="refresh" @click="refresh" :loading="vehiclesStore.isLoading" />
    </div>

    <div class="row q-col-gutter-md">
      <!-- Ready -->
      <div class="col-12 col-md-6 col-lg-4">
        <q-card>
          <q-card-section class="bg-positive text-white">
            <div class="row items-center">
              <q-icon name="check_circle" size="24px" class="q-mr-sm" />
              <div class="text-h6">Ready</div>
              <q-space />
              <q-badge color="white" text-color="positive">
                {{ vehiclesStore.vehiclesByStatus.READY.length }}
              </q-badge>
            </div>
          </q-card-section>
          <q-list separator dense>
            <q-item
              v-for="v in vehiclesStore.vehiclesByStatus.READY"
              :key="v.id"
              clickable
              @click="selectVehicle(v)"
            >
              <q-item-section>
                <q-item-label>{{ v.registration }}</q-item-label>
                <q-item-label caption>{{ v.make }} {{ v.model }}</q-item-label>
              </q-item-section>
            </q-item>
            <q-item v-if="!vehiclesStore.vehiclesByStatus.READY.length">
              <q-item-section class="text-grey-6 text-center">
                No vehicles
              </q-item-section>
            </q-item>
          </q-list>
        </q-card>
      </div>

      <!-- Out -->
      <div class="col-12 col-md-6 col-lg-4">
        <q-card>
          <q-card-section class="bg-primary text-white">
            <div class="row items-center">
              <q-icon name="directions_car" size="24px" class="q-mr-sm" />
              <div class="text-h6">Out</div>
              <q-space />
              <q-badge color="white" text-color="primary">
                {{ vehiclesStore.vehiclesByStatus.OUT.length }}
              </q-badge>
            </div>
          </q-card-section>
          <q-list separator dense>
            <q-item
              v-for="v in vehiclesStore.vehiclesByStatus.OUT"
              :key="v.id"
              clickable
              @click="selectVehicle(v)"
            >
              <q-item-section>
                <q-item-label>{{ v.registration }}</q-item-label>
                <q-item-label caption>{{ v.make }} {{ v.model }}</q-item-label>
              </q-item-section>
            </q-item>
            <q-item v-if="!vehiclesStore.vehiclesByStatus.OUT.length">
              <q-item-section class="text-grey-6 text-center">
                No vehicles
              </q-item-section>
            </q-item>
          </q-list>
        </q-card>
      </div>

      <!-- Returned -->
      <div class="col-12 col-md-6 col-lg-4">
        <q-card>
          <q-card-section class="bg-warning text-black">
            <div class="row items-center">
              <q-icon name="assignment_return" size="24px" class="q-mr-sm" />
              <div class="text-h6">Returned</div>
              <q-space />
              <q-badge color="dark">
                {{ vehiclesStore.vehiclesByStatus.RETURNED.length }}
              </q-badge>
            </div>
          </q-card-section>
          <q-list separator dense>
            <q-item
              v-for="v in vehiclesStore.vehiclesByStatus.RETURNED"
              :key="v.id"
              clickable
              @click="selectVehicle(v)"
            >
              <q-item-section>
                <q-item-label>{{ v.registration }}</q-item-label>
                <q-item-label caption>{{ v.make }} {{ v.model }}</q-item-label>
              </q-item-section>
            </q-item>
            <q-item v-if="!vehiclesStore.vehiclesByStatus.RETURNED.length">
              <q-item-section class="text-grey-6 text-center">
                No vehicles
              </q-item-section>
            </q-item>
          </q-list>
        </q-card>
      </div>

      <!-- Cleaning -->
      <div class="col-12 col-md-6 col-lg-4">
        <q-card>
          <q-card-section class="bg-accent text-white">
            <div class="row items-center">
              <q-icon name="cleaning_services" size="24px" class="q-mr-sm" />
              <div class="text-h6">Cleaning</div>
              <q-space />
              <q-badge color="white" text-color="accent">
                {{ vehiclesStore.vehiclesByStatus.CLEANING.length }}
              </q-badge>
            </div>
          </q-card-section>
          <q-list separator dense>
            <q-item
              v-for="v in vehiclesStore.vehiclesByStatus.CLEANING"
              :key="v.id"
              clickable
              @click="selectVehicle(v)"
            >
              <q-item-section>
                <q-item-label>{{ v.registration }}</q-item-label>
                <q-item-label caption>{{ v.make }} {{ v.model }}</q-item-label>
              </q-item-section>
            </q-item>
            <q-item v-if="!vehiclesStore.vehiclesByStatus.CLEANING.length">
              <q-item-section class="text-grey-6 text-center">
                No vehicles
              </q-item-section>
            </q-item>
          </q-list>
        </q-card>
      </div>

      <!-- Workshop -->
      <div class="col-12 col-md-6 col-lg-4">
        <q-card>
          <q-card-section class="bg-negative text-white">
            <div class="row items-center">
              <q-icon name="build" size="24px" class="q-mr-sm" />
              <div class="text-h6">Workshop</div>
              <q-space />
              <q-badge color="white" text-color="negative">
                {{ vehiclesStore.vehiclesByStatus.WORKSHOP.length }}
              </q-badge>
            </div>
          </q-card-section>
          <q-list separator dense>
            <q-item
              v-for="v in vehiclesStore.vehiclesByStatus.WORKSHOP"
              :key="v.id"
              clickable
              @click="selectVehicle(v)"
            >
              <q-item-section>
                <q-item-label>{{ v.registration }}</q-item-label>
                <q-item-label caption>{{ v.make }} {{ v.model }}</q-item-label>
              </q-item-section>
            </q-item>
            <q-item v-if="!vehiclesStore.vehiclesByStatus.WORKSHOP.length">
              <q-item-section class="text-grey-6 text-center">
                No vehicles
              </q-item-section>
            </q-item>
          </q-list>
        </q-card>
      </div>

      <!-- Maintenance -->
      <div class="col-12 col-md-6 col-lg-4">
        <q-card>
          <q-card-section class="bg-orange text-white">
            <div class="row items-center">
              <q-icon name="handyman" size="24px" class="q-mr-sm" />
              <div class="text-h6">Maintenance</div>
              <q-space />
              <q-badge color="white" text-color="orange">
                {{ vehiclesStore.vehiclesByStatus.MAINTENANCE.length }}
              </q-badge>
            </div>
          </q-card-section>
          <q-list separator dense>
            <q-item
              v-for="v in vehiclesStore.vehiclesByStatus.MAINTENANCE"
              :key="v.id"
              clickable
              @click="selectVehicle(v)"
            >
              <q-item-section>
                <q-item-label>{{ v.registration }}</q-item-label>
                <q-item-label caption>{{ v.make }} {{ v.model }}</q-item-label>
              </q-item-section>
            </q-item>
            <q-item v-if="!vehiclesStore.vehiclesByStatus.MAINTENANCE.length">
              <q-item-section class="text-grey-6 text-center">
                No vehicles
              </q-item-section>
            </q-item>
          </q-list>
        </q-card>
      </div>
    </div>

    <!-- Status Change Dialog -->
    <q-dialog v-model="showStatusDialog">
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">Change Status</div>
          <div class="text-subtitle2">{{ selectedVehicle?.registration }}</div>
        </q-card-section>
        <q-card-section>
          <q-select
            v-model="newStatus"
            label="New Status"
            :options="statusOptions"
            outlined
            emit-value
            map-options
          />
          <q-input
            v-model="statusNotes"
            label="Notes (optional)"
            outlined
            class="q-mt-md"
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn color="primary" label="Update" @click="updateStatus" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useVehiclesStore, Vehicle, VehicleStatus } from 'stores/vehicles';

const vehiclesStore = useVehiclesStore();

const showStatusDialog = ref(false);
const selectedVehicle = ref<Vehicle | null>(null);
const newStatus = ref<VehicleStatus>('READY');
const statusNotes = ref('');

const statusOptions = [
  { label: 'Ready', value: 'READY' },
  { label: 'Out', value: 'OUT' },
  { label: 'Returned', value: 'RETURNED' },
  { label: 'Cleaning', value: 'CLEANING' },
  { label: 'Workshop', value: 'WORKSHOP' },
  { label: 'Maintenance', value: 'MAINTENANCE' },
  { label: 'Transferred', value: 'TRANSFERRED' },
  { label: 'Inactive', value: 'INACTIVE' },
];

function selectVehicle(vehicle: Vehicle) {
  selectedVehicle.value = vehicle;
  newStatus.value = vehicle.status;
  statusNotes.value = '';
  showStatusDialog.value = true;
}

async function updateStatus() {
  if (!selectedVehicle.value) return;

  try {
    await vehiclesStore.updateVehicleStatus(
      selectedVehicle.value.id,
      newStatus.value,
      statusNotes.value
    );
    showStatusDialog.value = false;
  } catch (error) {
    console.error('Failed to update status:', error);
  }
}

function refresh() {
  vehiclesStore.fetchVehicles();
}

onMounted(() => {
  vehiclesStore.fetchVehicles();
});
</script>
