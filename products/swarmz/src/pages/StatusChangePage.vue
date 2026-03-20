<template>
  <q-page padding v-if="vehicle">
    <div class="text-h5 text-weight-bold q-mb-xs">Change Status</div>
    <div class="text-subtitle2 text-grey-7 q-mb-md">{{ vehicle.registration }} &middot; {{ vehicle.make }} {{ vehicle.model }}</div>

    <!-- Step 1: Pick status -->
    <div v-if="!selectedStatus" class="row q-col-gutter-sm">
      <div v-for="(cfg, key) in STATUS_CONFIG" :key="key" class="col-6 col-sm-4">
        <q-card flat bordered class="cursor-pointer text-center q-pa-md status-option" @click="selectStatus(key as VehicleStatus)">
          <q-icon :name="cfg.icon" size="32px" :color="cfg.color" />
          <div class="text-subtitle2 q-mt-xs">{{ cfg.label }}</div>
        </q-card>
      </div>
    </div>

    <!-- Step 2: Details -->
    <q-card v-else flat bordered class="q-pa-md">
      <div class="row items-center q-mb-md">
        <q-icon :name="STATUS_CONFIG[selectedStatus].icon" :color="STATUS_CONFIG[selectedStatus].color" size="24px" class="q-mr-sm" />
        <span class="text-subtitle1 text-weight-bold">{{ STATUS_CONFIG[selectedStatus].label }}</span>
        <q-space />
        <q-btn flat dense icon="close" @click="selectedStatus = null" />
      </div>

      <q-form @submit="confirm">
        <!-- Fueling fields -->
        <template v-if="selectedStatus === 'fueling'">
          <q-input v-model.number="form.litres" label="Litres" type="number" outlined class="q-mb-sm" />
          <q-input v-model.number="form.costAmount" label="Total (Rands)" type="number" outlined class="q-mb-sm" prefix="R" />
          <q-input v-model.number="form.odometer" label="Odometer (km)" type="number" outlined class="q-mb-sm" />
          <q-input v-model="form.vendor" label="Fuel Station" outlined class="q-mb-sm" />
        </template>

        <!-- Service/Repair fields -->
        <template v-if="selectedStatus === 'service' || selectedStatus === 'repair'">
          <q-input v-model="form.notes" label="Description" outlined autogrow class="q-mb-sm" />
          <q-input v-model.number="form.costAmount" label="Cost (Rands)" type="number" outlined class="q-mb-sm" prefix="R" />
          <q-input v-model="form.vendor" label="Workshop" outlined class="q-mb-sm" />
          <q-input v-model.number="form.odometer" label="Odometer (km)" type="number" outlined class="q-mb-sm" />
        </template>

        <!-- Cleaning -->
        <template v-if="selectedStatus === 'cleaning'">
          <q-input v-model.number="form.costAmount" label="Cost (Rands)" type="number" outlined class="q-mb-sm" prefix="R" />
          <q-input v-model="form.vendor" label="Location" outlined class="q-mb-sm" />
        </template>

        <!-- Out -->
        <template v-if="selectedStatus === 'out'">
          <q-input v-model="form.notes" label="Who & Purpose" outlined class="q-mb-sm" placeholder="e.g. Sipho — Uber shift" />
          <q-input v-model.number="form.odometer" label="Odometer (km)" type="number" outlined class="q-mb-sm" />
        </template>

        <!-- Accident -->
        <template v-if="selectedStatus === 'accident'">
          <q-input v-model="form.notes" label="What happened" outlined autogrow class="q-mb-sm" />
          <q-input v-model.number="form.costAmount" label="Estimated Cost (Rands)" type="number" outlined class="q-mb-sm" prefix="R" />
        </template>

        <!-- Towed -->
        <template v-if="selectedStatus === 'towed'">
          <q-input v-model="form.notes" label="Reason" outlined class="q-mb-sm" />
          <q-input v-model.number="form.costAmount" label="Tow Cost (Rands)" type="number" outlined class="q-mb-sm" prefix="R" />
          <q-input v-model="form.vendor" label="Tow Company" outlined class="q-mb-sm" />
        </template>

        <!-- Available / Returned -->
        <template v-if="selectedStatus === 'available'">
          <q-input v-model.number="form.odometer" label="Odometer (km)" type="number" outlined class="q-mb-sm" />
          <q-input v-model="form.notes" label="Notes (optional)" outlined class="q-mb-sm" />
        </template>

        <!-- General notes for all -->
        <q-input v-if="!['out','available','accident','towed'].includes(selectedStatus)" v-model="form.notes" label="Notes (optional)" outlined autogrow class="q-mb-sm" />

        <!-- Receipt scan -->
        <div v-if="STATUS_CONFIG[selectedStatus].hasReceipt" class="q-mb-md">
          <div class="text-caption text-grey-7 q-mb-xs">Scan Receipt / Invoice</div>
          <q-file v-model="receiptFiles" accept="image/*" capture="environment" multiple outlined label="Take photo of slip" counter>
            <template v-slot:prepend><q-icon name="camera_alt" /></template>
          </q-file>
        </div>

        <!-- Accident photos -->
        <div v-if="selectedStatus === 'accident'" class="q-mb-md">
          <div class="text-caption text-grey-7 q-mb-xs">Damage Photos (up to 5)</div>
          <q-file v-model="receiptFiles" accept="image/*" capture="environment" multiple outlined label="Take photos" counter max-files="5">
            <template v-slot:prepend><q-icon name="photo_camera" /></template>
          </q-file>
        </div>

        <q-btn type="submit" color="primary" class="full-width" size="lg" icon="check" label="Confirm" />
      </q-form>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useVehiclesStore } from 'stores/vehicles';
import { useStatusLogStore } from 'stores/statusLog';
import { STATUS_CONFIG } from 'src/types';
import type { VehicleStatus, CostCategory } from 'src/types';

const props = defineProps<{ id: string }>();
const router = useRouter();
const vehiclesStore = useVehiclesStore();
const statusLogStore = useStatusLogStore();

const vehicle = computed(() => vehiclesStore.getVehicleById(props.id));
const selectedStatus = ref<VehicleStatus | null>(null);
const receiptFiles = ref(null);

const form = reactive({
  costAmount: null as number | null,
  odometer: null as number | null,
  vendor: '',
  notes: '',
  litres: null as number | null,
});

function selectStatus(status: VehicleStatus) {
  selectedStatus.value = status;
  if (vehicle.value) form.odometer = vehicle.value.odometer;
}

const STATUS_CATEGORY_MAP: Record<string, CostCategory> = {
  fueling: 'fuel', service: 'service', repair: 'repair', cleaning: 'cleaning', accident: 'accident',
};

async function confirm() {
  if (!selectedStatus.value || !vehicle.value) return;

  // Collect receipt files if any
  const files: File[] = receiptFiles.value
    ? (Array.isArray(receiptFiles.value) ? receiptFiles.value : [receiptFiles.value])
    : [];

  await statusLogStore.addEntry({
    vehicleId: vehicle.value.id,
    status: selectedStatus.value,
    odometer: form.odometer || undefined,
    costAmount: form.costAmount || undefined,
    costCategory: STATUS_CATEGORY_MAP[selectedStatus.value] || undefined,
    vendor: form.vendor || undefined,
    notes: form.notes || (form.litres ? `${form.litres}L` : undefined),
    receiptPhotos: [],
  }, files.length ? files : undefined);

  vehiclesStore.updateStatus(vehicle.value.id, selectedStatus.value, form.odometer || undefined);
  router.push(`/vehicle/${vehicle.value.id}`);
}

onMounted(() => {
  if (!vehiclesStore.vehicles.length) vehiclesStore.fetchVehicles();
});
</script>

<style scoped>
.status-option {
  border-radius: 12px;
  transition: transform 0.15s, box-shadow 0.15s;
}
.status-option:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}
</style>
