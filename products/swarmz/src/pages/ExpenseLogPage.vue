<template>
  <q-page padding>
    <template v-if="vehicle">
      <!-- Header -->
      <div class="row items-center q-mb-md">
        <q-btn flat dense icon="arrow_back" @click="$router.push(`/vehicle/${id}`)" class="q-mr-sm" />
        <div class="col">
          <div class="text-h5 text-weight-bold">Expenses</div>
          <div class="text-subtitle2 text-grey-7">{{ vehicle.name || `${vehicle.make} ${vehicle.model}` }} &middot; {{ vehicle.registration }}</div>
        </div>
        <q-btn
          v-if="settings.modules.aiScan"
          color="primary"
          icon="document_scanner"
          label="Scan slip"
          :loading="scanning"
          class="q-mr-sm"
          @click="triggerScan"
        />
        <q-btn
          :color="settings.modules.aiScan ? 'grey-7' : 'primary'"
          :outline="settings.modules.aiScan"
          icon="add"
          label="Log manually"
          @click="openManual"
        />
        <!-- Hidden capture input driven by the Scan slip button -->
        <q-file
          ref="scanFileRef"
          v-model="scanFile"
          accept="image/*"
          capture="environment"
          style="display: none"
          @update:model-value="scanSlip"
        />
      </div>

      <!-- Filters -->
      <div class="row q-gutter-sm q-mb-md">
        <q-select v-model="filterCategory" :options="categoryOptions" outlined dense style="min-width: 150px" />
      </div>

      <!-- Total -->
      <q-card flat bordered class="q-pa-md q-mb-md">
        <div class="text-caption text-grey-7">Total Expenses</div>
        <div class="text-h4 text-weight-bold text-primary">R{{ totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 }) }}</div>
        <div class="text-caption text-grey-5">{{ filteredExpenses.length }} expense{{ filteredExpenses.length !== 1 ? 's' : '' }}</div>
      </q-card>

      <!-- Expense List -->
      <q-list separator v-if="filteredExpenses.length">
        <q-item v-for="exp in filteredExpenses" :key="exp.id" class="q-py-sm">
          <q-item-section side>
            <q-icon :name="categoryIcon(exp.category)" :color="categoryColor(exp.category)" />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ exp.vendor || exp.category }}</q-item-label>
            <q-item-label caption>{{ exp.date }} &middot; {{ exp.category }}</q-item-label>
            <q-item-label caption v-if="exp.description">{{ exp.description }}</q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-item-label class="text-weight-bold">R{{ exp.amount.toLocaleString(undefined, { minimumFractionDigits: 2 }) }}</q-item-label>
            <q-icon v-if="exp.receiptPath" name="receipt" size="xs" color="grey-5" />
          </q-item-section>
        </q-item>
      </q-list>

      <div v-else-if="!loading" class="text-center q-pa-xl">
        <q-icon name="receipt_long" size="64px" color="grey-4" />
        <div class="text-h6 text-grey-5 q-mt-md">No expenses logged yet</div>
        <q-btn color="primary" icon="add" label="Log First Expense" class="q-mt-lg" @click="openManual" />
      </div>

      <q-inner-loading :showing="loading" />
    </template>

    <q-page v-else class="flex flex-center">
      <q-spinner size="40px" color="primary" />
    </q-page>

    <!-- Log Expense Dialog -->
    <q-dialog v-model="showForm" persistent>
      <q-card style="min-width: 360px; max-width: 500px">
        <q-card-section>
          <div class="text-h6">{{ aiPrefilled ? 'Review scanned expense' : 'Log Expense' }}</div>
        </q-card-section>

        <!-- AI scan result banner -->
        <q-card-section v-if="aiPrefilled" class="q-py-none">
          <q-banner
            dense
            rounded
            :class="scanConfidence === 'high' ? 'bg-green-1 text-green-8' : 'bg-orange-1 text-orange-8'"
          >
            <template v-slot:avatar>
              <q-icon :name="scanConfidence === 'high' ? 'check_circle' : 'info'" />
            </template>
            {{ scanConfidence === 'high'
              ? 'Scanned successfully — please check the details and save.'
              : 'Some fields may need a quick check — please review before saving.' }}
          </q-banner>
        </q-card-section>

        <q-card-section class="q-gutter-sm">
          <q-select v-model="form.category" :options="expenseCategories" label="Category" outlined emit-value map-options />
          <q-input v-model.number="form.amount" label="Amount" type="number" outlined prefix="R" :rules="[v => v > 0 || 'Required']" />
          <q-input v-model="form.date" label="Date" outlined type="date" />
          <q-input v-model="form.vendor" label="Vendor" outlined />
          <q-input v-model="form.description" label="Notes" outlined autogrow />

          <!-- Fuel-specific fields -->
          <template v-if="form.category === 'FUEL'">
            <q-input v-model.number="form.litres" label="Litres" type="number" outlined />
            <q-input v-model.number="form.pricePerLitre" label="Price per litre" type="number" outlined prefix="R" />
            <q-input v-model.number="form.odometerKm" label="Odometer (km)" type="number" outlined />
          </template>

          <!-- Receipt photo -->
          <q-file v-model="form.receipt" label="Receipt photo" outlined accept="image/*" capture="environment">
            <template v-slot:prepend><q-icon name="camera_alt" /></template>
          </q-file>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" @click="showForm = false" />
          <q-btn color="primary" label="Save" :loading="saving" @click="saveExpense" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { Notify, QFile } from 'quasar';
import axios from 'axios';
import { api } from 'boot/axios';
import { useSettingsStore } from 'stores/settings';

const props = defineProps<{ id: string }>();

const settings = useSettingsStore();

const vehicle = ref<any>(null);
const expenses = ref<any[]>([]);
const loading = ref(false);
const saving = ref(false);
const showForm = ref(false);
const filterCategory = ref('ALL');

// AI slip scanning
const SLIP_WEBHOOK_URL = '/webhook/sz-slip-scan';
const scanFileRef = ref<QFile | null>(null);
const scanFile = ref<File | null>(null);
const scanning = ref(false);
const aiPrefilled = ref(false);
const scanConfidence = ref('');

const categoryOptions = ['ALL', 'FUEL', 'SERVICE', 'TYRES', 'INSURANCE', 'TOLL', 'LICENCE', 'PARKING', 'FINANCE', 'DEPRECIATION', 'OTHER'];
const expenseCategories = [
  { label: 'Fuel', value: 'FUEL' },
  { label: 'Service', value: 'SERVICE' },
  { label: 'Tyres', value: 'TYRES' },
  { label: 'Insurance', value: 'INSURANCE' },
  { label: 'Toll', value: 'TOLL' },
  { label: 'Licence', value: 'LICENCE' },
  { label: 'Parking', value: 'PARKING' },
  { label: 'Finance', value: 'FINANCE' },
  { label: 'Depreciation', value: 'DEPRECIATION' },
  { label: 'Other', value: 'OTHER' },
];

const today = new Date().toISOString().split('T')[0];
const form = reactive({
  category: 'FUEL',
  amount: null as number | null,
  date: today,
  vendor: '',
  description: '',
  litres: null as number | null,
  pricePerLitre: null as number | null,
  odometerKm: null as number | null,
  receipt: null as File | null,
});

const filteredExpenses = computed(() => {
  if (filterCategory.value === 'ALL') return expenses.value;
  return expenses.value.filter(e => e.category.toUpperCase() === filterCategory.value);
});

const totalAmount = computed(() =>
  filteredExpenses.value.reduce((sum, e) => sum + e.amount, 0)
);

function categoryIcon(cat: string): string {
  const map: Record<string, string> = {
    fuel: 'local_gas_station', service: 'build', tyres: 'trip_origin',
    insurance: 'shield', toll: 'toll', licence: 'badge',
    parking: 'local_parking', finance: 'account_balance', other: 'more_horiz',
  };
  return map[cat.toLowerCase()] || 'receipt';
}

function categoryColor(cat: string): string {
  const map: Record<string, string> = {
    fuel: 'amber', service: 'blue', tyres: 'deep-purple',
    insurance: 'teal', toll: 'orange', other: 'grey',
  };
  return map[cat.toLowerCase()] || 'grey';
}

async function loadData() {
  loading.value = true;
  try {
    const [vRes, eRes] = await Promise.all([
      api.get(`/vehicles/${props.id}`),
      api.get('/vehicle-expenses', { params: { vehicle_id: props.id } }),
    ]);
    vehicle.value = vRes.data;
    expenses.value = eRes.data;
  } catch (err: any) {
    Notify.create({ type: 'negative', message: err.response?.data?.message || 'Failed to load expenses' });
  } finally {
    loading.value = false;
  }
}

async function saveExpense() {
  if (!form.amount || form.amount <= 0) {
    Notify.create({ type: 'negative', message: 'Amount is required' });
    return;
  }
  saving.value = true;
  try {
    const fd = new FormData();
    fd.append('vehicleId', props.id);
    fd.append('category', form.category);
    fd.append('amount', String(form.amount));
    fd.append('date', form.date);
    if (form.vendor) fd.append('vendor', form.vendor);
    if (form.description) fd.append('description', form.description);
    if (form.category === 'FUEL') {
      if (form.litres) fd.append('litres', String(form.litres));
      if (form.pricePerLitre) fd.append('pricePerLitre', String(form.pricePerLitre));
      if (form.odometerKm) fd.append('odometerKm', String(form.odometerKm));
    }
    if (form.receipt) fd.append('receipt', form.receipt);
    fd.append('source', aiPrefilled.value ? 'AI_EXTRACTED' : 'MANUAL');

    await api.post('/vehicle-expenses', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    Notify.create({ type: 'positive', message: aiPrefilled.value ? 'Scanned expense saved' : 'Expense logged' });
    showForm.value = false;
    resetForm();
    await loadData();
  } catch (err: any) {
    Notify.create({ type: 'negative', message: err.response?.data?.message || 'Failed to save expense' });
  } finally {
    saving.value = false;
  }
}

function resetForm() {
  form.category = 'FUEL';
  form.amount = null;
  form.date = today;
  form.vendor = '';
  form.description = '';
  form.litres = null;
  form.pricePerLitre = null;
  form.odometerKm = null;
  form.receipt = null;
  aiPrefilled.value = false;
  scanConfidence.value = '';
  scanFile.value = null;
}

function openManual() {
  resetForm();
  showForm.value = true;
}

function triggerScan() {
  scanFileRef.value?.pickFiles();
}

// Downscale + JPEG-compress before sending to the AI gateway (keeps it fast on mobile data)
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
        resolve(canvas.toDataURL('image/jpeg', quality).split(',')[1]);
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function scanSlip(file: File | null) {
  if (!file) return;
  scanning.value = true;
  try {
    const base64 = await compressImage(file);
    // Image goes to n8n (the only AI gateway) — never to our Express backend
    const { data } = await axios.post(SLIP_WEBHOOK_URL, {
      file_data: base64,
      mime_type: 'image/jpeg',
      filename: file.name || 'slip.jpg',
    }, { timeout: 120000 });

    if (data.error) {
      Notify.create({ type: 'negative', message: data.error });
      return;
    }

    // Pre-fill the expense form from the AI extraction — user reviews before saving
    resetForm();
    if (data.category) form.category = data.category;
    if (data.amount != null) form.amount = data.amount;
    if (data.date) form.date = data.date;
    if (data.vendor) form.vendor = data.vendor;
    if (data.litres != null) form.litres = data.litres;
    if (data.pricePerLitre != null) form.pricePerLitre = data.pricePerLitre;
    if (data.odometerKm != null) form.odometerKm = data.odometerKm;
    form.receipt = file; // keep the photo as the receipt proof

    scanConfidence.value = data.confidence || 'medium';
    aiPrefilled.value = true;
    showForm.value = true;
  } catch (err: any) {
    console.error('Slip scan failed:', err);
    Notify.create({
      type: 'negative',
      message: 'Could not read the slip. Try a clearer photo, or log it manually.',
    });
  } finally {
    scanning.value = false;
    scanFile.value = null;
  }
}

onMounted(loadData);
</script>
