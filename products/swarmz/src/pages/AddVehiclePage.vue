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
          <div class="text-subtitle1 q-mt-md">Scan your license disk</div>
          <div class="text-caption text-grey-6 q-mb-lg">Take a photo or choose from your files</div>
          <div class="row q-col-gutter-sm">
            <div class="col-6">
              <q-file
                v-model="licenseDiskPhoto"
                accept="image/*"
                capture="environment"
                label="Take Photo"
                outlined
                @update:model-value="onLicenseDiskScanned"
              >
                <template v-slot:prepend><q-icon name="camera_alt" /></template>
              </q-file>
            </div>
            <div class="col-6">
              <q-file
                v-model="licenseDiskPhoto"
                accept="image/*"
                label="Choose File"
                outlined
                @update:model-value="onLicenseDiskScanned"
              >
                <template v-slot:prepend><q-icon name="folder" /></template>
              </q-file>
            </div>
          </div>
          <div v-if="scanning" class="q-mt-md">
            <q-spinner-dots size="32px" color="primary" />
            <div class="text-caption text-grey-6 q-mt-sm">Reading your license disk...</div>
          </div>
          <q-banner v-if="scanError" class="bg-red-1 text-red-8 q-mt-md" rounded>
            <template v-slot:avatar><q-icon name="error" color="red" /></template>
            {{ scanError }}
          </q-banner>
        </q-card>
      </q-tab-panel>

      <q-tab-panel name="manual" class="q-pa-none">
        <!-- Form shows here, also used after scan pre-fill -->
      </q-tab-panel>
    </q-tab-panels>

    <!-- Confidence banner after scan -->
    <q-banner v-if="scanned && scanConfidence" class="q-mt-md" rounded
      :class="scanConfidence === 'high' ? 'bg-green-1 text-green-8' : scanConfidence === 'medium' ? 'bg-orange-1 text-orange-8' : 'bg-red-1 text-red-8'">
      <template v-slot:avatar>
        <q-icon :name="scanConfidence === 'high' ? 'check_circle' : 'info'" :color="scanConfidence === 'high' ? 'green' : 'orange'" />
      </template>
      {{ scanConfidence === 'high' ? 'Details extracted successfully — please review and save.' : 'Some fields may need correction — please review carefully.' }}
    </q-banner>

    <!-- License expiry warning -->
    <q-banner v-if="expiryWarning" class="q-mt-sm" rounded
      :class="expiryWarning === 'expired' ? 'bg-red-1 text-red-8' : 'bg-orange-1 text-orange-8'">
      <template v-slot:avatar>
        <q-icon :name="expiryWarning === 'expired' ? 'warning' : 'schedule'" :color="expiryWarning === 'expired' ? 'red' : 'orange'" />
      </template>
      {{ expiryWarning === 'expired' ? `License disk EXPIRED on ${expiryDate}. Renew before using this vehicle.` : `License disk expires on ${expiryDate}. Consider renewing soon.` }}
    </q-banner>

    <q-card flat bordered class="q-mt-md q-pa-md" v-if="tab === 'manual' || scanned">
      <q-form @submit="saveVehicle">
        <!-- Registration & Vehicle Reg -->
        <div class="text-subtitle2 text-grey-7 q-mb-xs">Identification</div>
        <q-input v-model="form.registration" label="License Plate Number" outlined class="q-mb-sm" placeholder="e.g. KFD780NW" :rules="[v => !!v || 'Required']" />
        <div class="row q-col-gutter-sm q-mb-sm">
          <div class="col-6">
            <q-input v-model="form.vehicleRegNumber" label="Vehicle Register No." outlined hint="Vrt.registernr." />
          </div>
          <div class="col-6">
            <q-input v-model="form.eNatisNumber" label="eNatis Number" outlined hint="NO. on disk" />
          </div>
        </div>

        <!-- Make, Model, Body Type -->
        <div class="text-subtitle2 text-grey-7 q-mt-md q-mb-xs">Vehicle Details</div>
        <div class="row q-col-gutter-sm q-mb-sm">
          <div class="col-6">
            <q-select v-model="form.make" label="Make" outlined :options="makes" emit-value map-options use-input input-debounce="0" @filter="filterMakes" :rules="[v => !!v || 'Required']">
              <template v-slot:no-option>
                <q-item>
                  <q-item-section class="text-grey">No match — type to use custom make</q-item-section>
                </q-item>
              </template>
            </q-select>
          </div>
          <div class="col-6">
            <q-input v-model="form.model" label="Model" outlined placeholder="e.g. Discovery 4" :rules="[v => !!v || 'Required']" />
          </div>
        </div>
        <div class="row q-col-gutter-sm q-mb-sm">
          <div class="col-4"><q-input v-model="form.bodyType" label="Body Type" outlined placeholder="e.g. Station wagon" /></div>
          <div class="col-4"><q-input v-model.number="form.year" label="Year" type="number" outlined /></div>
          <div class="col-4"><q-input v-model="form.color" label="Color" outlined /></div>
        </div>

        <!-- Technical Details -->
        <div class="text-subtitle2 text-grey-7 q-mt-md q-mb-xs">Technical</div>
        <q-input v-model="form.vin" label="VIN / Chassis Number" outlined class="q-mb-sm" />
        <div class="row q-col-gutter-sm q-mb-sm">
          <div class="col-6"><q-input v-model="form.engineNumber" label="Engine Number" outlined /></div>
          <div class="col-6"><q-input v-model.number="form.odometer" label="Current Odometer (km)" type="number" outlined /></div>
        </div>
        <div class="row q-col-gutter-sm q-mb-sm">
          <div class="col-4"><q-input v-model.number="form.tareMass" label="Tare (kg)" type="number" outlined /></div>
          <div class="col-4"><q-input v-model.number="form.gvm" label="GVM (kg)" type="number" outlined /></div>
          <div class="col-4"><q-input v-model.number="form.seatingCapacity" label="Seats" type="number" outlined /></div>
        </div>

        <!-- License Disk Dates -->
        <div class="text-subtitle2 text-grey-7 q-mt-md q-mb-xs">License Disk</div>
        <div class="row q-col-gutter-sm q-mb-sm">
          <div class="col-6"><q-input v-model="form.expiryDate" label="Disk Expiry Date" outlined type="date" /></div>
          <div class="col-6"><q-input v-model="form.firstRegistrationDate" label="First Registration Date" outlined type="date" /></div>
        </div>

        <div class="q-mb-md">
          <div class="text-caption text-grey-7 q-mb-xs">Vehicle Photo</div>
          <q-file v-model="vehiclePhoto" accept="image/*" capture="environment" label="Snap a photo" outlined>
            <template v-slot:prepend><q-icon name="photo_camera" /></template>
          </q-file>
        </div>

        <q-btn type="submit" color="primary" class="full-width" size="lg" icon="add" label="Save Vehicle" :loading="saving" :disable="saving" />
      </q-form>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import axios from 'axios';
import { api } from 'boot/axios';
import { useVehiclesStore } from 'stores/vehicles';

const router = useRouter();
const $q = useQuasar();
const vehiclesStore = useVehiclesStore();

const tab = ref('scan');
const scanning = ref(false);
const scanned = ref(false);
const saving = ref(false);
const scanError = ref('');
const scanConfidence = ref('');
const expiryWarning = ref('');
const expiryDate = ref('');
const licenseDiskPhoto = ref<File | null>(null);
const vehiclePhoto = ref<File | null>(null);

const form = reactive({
  registration: '',
  vehicleRegNumber: '',
  eNatisNumber: '',
  make: '',
  model: '',
  bodyType: '',
  year: new Date().getFullYear(),
  color: '',
  vin: '',
  engineNumber: '',
  odometer: 0,
  tareMass: null as number | null,
  gvm: null as number | null,
  seatingCapacity: null as number | null,
  expiryDate: '',
  firstRegistrationDate: '',
});

const allMakes = [
  'Audi', 'BMW', 'Chery', 'Chevrolet', 'Citroën', 'Dacia', 'Datsun', 'Fiat', 'Ford',
  'GWM', 'Haval', 'Honda', 'Hyundai', 'Isuzu', 'JAC', 'Jeep', 'Kia', 'Land Rover',
  'Lexus', 'Mahindra', 'Mazda', 'Mercedes-Benz', 'Mini', 'Mitsubishi', 'Nissan', 'Opel',
  'Peugeot', 'Porsche', 'Renault', 'Subaru', 'Suzuki', 'Tata', 'Toyota', 'Volkswagen', 'Volvo',
];
const makes = ref([...allMakes]);

function filterMakes(val: string, update: (fn: () => void) => void) {
  update(() => {
    const needle = val.toLowerCase();
    makes.value = needle ? allMakes.filter(m => m.toLowerCase().includes(needle)) : [...allMakes];
  });
}

const N8N_WEBHOOK_URL = '/webhook/sz-license-disk-scan';

function compressImage(file: File, maxWidth = 1600, quality = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const reader = new FileReader();

    reader.onload = () => {
      img.onload = () => {
        let { width, height } = img;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('Canvas not supported')); return; }
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl.split(',')[1]);
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function onLicenseDiskScanned() {
  const file = licenseDiskPhoto.value;
  if (!file) return;

  scanning.value = true;
  scanError.value = '';
  expiryWarning.value = '';

  try {
    const base64 = await compressImage(file);

    const response = await axios.post(N8N_WEBHOOK_URL, {
      file_data: base64,
      mime_type: 'image/jpeg',
      filename: file.name || 'license-disk.jpg',
    }, {
      timeout: 120000,
    });

    const data = response.data;

    if (data.error) {
      scanError.value = data.error;
      return;
    }

    // Pre-fill all form fields from scan
    form.registration = data.registration || '';
    form.vehicleRegNumber = data.vehicleRegNumber || '';
    form.eNatisNumber = data.eNatisNumber || '';
    form.model = data.model || '';
    form.bodyType = data.bodyType || '';
    form.year = data.year || new Date().getFullYear();
    form.color = data.color || '';
    form.vin = data.vin || '';
    form.engineNumber = data.engineNumber || '';
    form.tareMass = data.tareMass || null;
    form.gvm = data.gvm || null;
    form.seatingCapacity = data.seatingCapacity || null;
    form.expiryDate = data.expiryDate || '';
    form.firstRegistrationDate = data.firstRegistrationDate || '';

    // Match make to our list or use raw value
    if (data.make) {
      const matchedMake = allMakes.find(m => m.toLowerCase() === data.make.toLowerCase());
      form.make = matchedMake || data.make;
      if (!matchedMake && !allMakes.includes(data.make)) {
        allMakes.push(data.make);
        makes.value = [...allMakes];
      }
    }

    // Check license disk expiry
    if (data.expiryDate) {
      expiryDate.value = data.expiryDate;
      const expiry = new Date(data.expiryDate);
      const now = new Date();
      const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (daysUntilExpiry < 0) {
        expiryWarning.value = 'expired';
      } else if (daysUntilExpiry <= 60) {
        expiryWarning.value = 'expiring';
      }
    }

    scanConfidence.value = data.confidence || 'medium';
    scanned.value = true;
    tab.value = 'manual';

    // Save image copy to Express
    api.post('/vehicles/scan-upload', {
      file_data: base64,
      mime_type: 'image/jpeg',
      filename: file.name || 'license-disk.jpg',
    }).catch(() => {});

    $q.notify({ type: 'positive', message: 'License disk scanned — review the details below' });
  } catch (err: any) {
    console.error('License disk scan failed:', err);
    scanError.value = err.response?.data?.error || 'Failed to scan license disk. Please try again or enter details manually.';
  } finally {
    scanning.value = false;
  }
}

async function saveVehicle() {
  saving.value = true;
  try {
    const vehicle = await vehiclesStore.addVehicle({
      registration: form.registration,
      make: form.make,
      model: form.model,
      year: form.year,
      color: form.color,
      vin: form.vin || undefined,
      odometer: form.odometer,
      photoUrl: null,
    });

    $q.notify({ type: 'positive', message: `${form.make} ${form.model} added!` });
    router.push(`/vehicle/${vehicle.id}`);
  } catch (err: any) {
    console.error('Failed to save vehicle:', err);
    $q.notify({
      type: 'negative',
      message: err.response?.data?.error || 'Failed to save vehicle. Please try again.',
    });
  } finally {
    saving.value = false;
  }
}
</script>
