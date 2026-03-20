<template>
  <q-page padding>
    <div class="text-h5 text-weight-bold q-mb-md">Add Vehicle</div>

    <q-tabs v-model="tab" class="q-mb-lg" active-color="primary" indicator-color="primary" align="left">
      <q-tab name="scan" icon="qr_code_scanner" label="Scan License Disk" />
      <q-tab name="manual" icon="edit" label="Manual Entry" />
    </q-tabs>

    <q-tab-panels v-model="tab" animated>
      <q-tab-panel name="scan" class="q-pa-none">
        <q-card flat bordered class="q-pa-lg text-center">
          <q-icon name="photo_camera" size="48px" color="grey-4" />
          <div class="text-subtitle1 q-mt-md">Take a photo of your license disk</div>
          <div class="text-caption text-grey-6 q-mb-lg">We'll extract the vehicle details automatically</div>
          <q-file
            v-model="licenseDiskPhoto"
            accept="image/*"
            capture="environment"
            label="Open Camera"
            outlined
            @update:model-value="onLicenseDiskScanned"
          >
            <template v-slot:prepend><q-icon name="camera_alt" /></template>
          </q-file>
          <div v-if="scanning" class="q-mt-md">
            <q-spinner-dots size="32px" color="primary" />
            <div class="text-caption text-grey-6 q-mt-sm">Extracting details...</div>
          </div>
        </q-card>
      </q-tab-panel>

      <q-tab-panel name="manual" class="q-pa-none">
        <!-- Form shows here, also used after scan pre-fill -->
      </q-tab-panel>
    </q-tab-panels>

    <q-card flat bordered class="q-mt-md q-pa-md" v-if="tab === 'manual' || scanned">
      <q-form @submit="saveVehicle">
        <q-input v-model="form.registration" label="Registration Number" outlined class="q-mb-sm" placeholder="e.g. CA 456-789" :rules="[v => !!v || 'Required']" />
        <div class="row q-col-gutter-sm q-mb-sm">
          <div class="col-6">
            <q-select v-model="form.make" label="Make" outlined :options="makes" emit-value map-options :rules="[v => !!v || 'Required']" />
          </div>
          <div class="col-6">
            <q-input v-model="form.model" label="Model" outlined :rules="[v => !!v || 'Required']" />
          </div>
        </div>
        <div class="row q-col-gutter-sm q-mb-sm">
          <div class="col-4"><q-input v-model.number="form.year" label="Year" type="number" outlined /></div>
          <div class="col-4"><q-input v-model="form.color" label="Color" outlined /></div>
          <div class="col-4"><q-input v-model.number="form.odometer" label="Odometer (km)" type="number" outlined /></div>
        </div>
        <q-input v-model="form.vin" label="VIN (optional)" outlined class="q-mb-sm" />

        <div class="q-mb-md">
          <div class="text-caption text-grey-7 q-mb-xs">Vehicle Photo</div>
          <q-file v-model="vehiclePhoto" accept="image/*" capture="environment" label="Snap a photo" outlined>
            <template v-slot:prepend><q-icon name="photo_camera" /></template>
          </q-file>
        </div>

        <q-btn type="submit" color="primary" class="full-width" size="lg" icon="add" label="Save Vehicle" />
      </q-form>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useVehiclesStore } from 'stores/vehicles';

const router = useRouter();
const vehiclesStore = useVehiclesStore();

const tab = ref('manual');
const scanning = ref(false);
const scanned = ref(false);
const licenseDiskPhoto = ref(null);
const vehiclePhoto = ref(null);

const form = reactive({
  registration: '',
  make: '',
  model: '',
  year: new Date().getFullYear(),
  color: '',
  vin: '',
  odometer: 0,
});

const makes = [
  'Toyota', 'Volkswagen', 'Ford', 'Nissan', 'Hyundai', 'BMW', 'Mercedes-Benz',
  'Audi', 'Kia', 'Suzuki', 'Isuzu', 'Honda', 'Mazda', 'Renault', 'Opel', 'Other',
];

function onLicenseDiskScanned() {
  scanning.value = true;
  // Demo: simulate OCR after delay
  setTimeout(() => {
    form.registration = 'GP 789-WXY';
    form.make = 'Toyota';
    form.model = 'Corolla Cross 1.8 XS';
    form.year = 2024;
    form.color = 'White';
    form.vin = 'AHTBB3CD102345678';
    scanning.value = false;
    scanned.value = true;
    tab.value = 'manual';
  }, 2000);
}

function saveVehicle() {
  const vehicle = vehiclesStore.addVehicle({
    registration: form.registration,
    make: form.make,
    model: form.model,
    year: form.year,
    color: form.color,
    vin: form.vin || undefined,
    odometer: form.odometer,
    photoUrl: null,
  });
  router.push(`/vehicle/${vehicle.id}`);
}
</script>
