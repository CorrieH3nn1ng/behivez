<template>
  <q-page padding>
    <!-- Loading -->
    <div v-if="loading" class="text-center q-pa-xl">
      <q-spinner size="40px" color="primary" />
    </div>

    <template v-else-if="vehicle">
      <!-- Header -->
      <div class="row items-center q-mb-md">
        <q-btn flat round icon="arrow_back" @click="$router.push('/travel')" class="q-mr-sm" />
        <div class="col">
          <div class="row items-center">
            <q-icon
              :name="vehicle.type === 'owned' ? 'directions_car' : 'car_rental'"
              :color="vehicle.type === 'owned' ? 'primary' : 'orange'"
              size="sm"
              class="q-mr-sm"
            />
            <div class="text-h5">{{ vehicle.name }}</div>
            <q-badge
              :color="vehicle.type === 'owned' ? 'primary' : 'orange'"
              :label="vehicle.type === 'owned' ? 'Owned' : 'Rental'"
              class="q-ml-sm"
            />
            <q-badge v-if="vehicle.is_default" color="green" label="Default" class="q-ml-xs" />
          </div>
          <div class="text-caption text-grey q-mt-xs">
            <template v-if="vehicle.make">{{ vehicle.year }} {{ vehicle.make }} {{ vehicle.model }}</template>
            <template v-if="vehicle.registration"> &middot; {{ vehicle.registration }}</template>
          </div>
        </div>
      </div>

      <!-- Stats Row -->
      <div class="row q-col-gutter-sm q-mb-md">
        <div class="col-3">
          <q-card flat bordered class="text-center q-pa-sm">
            <div class="text-caption text-grey">Trips</div>
            <div class="text-h6">{{ vehicle.trips_count }}</div>
          </q-card>
        </div>
        <div class="col-3">
          <q-card flat bordered class="text-center q-pa-sm">
            <div class="text-caption text-grey">Total KM</div>
            <div class="text-h6">{{ fmt(vehicle.total_km_year) }}</div>
          </q-card>
        </div>
        <div class="col-3">
          <q-card flat bordered class="text-center q-pa-sm">
            <div class="text-caption text-grey">Business %</div>
            <div class="text-h6">{{ vehicle.business_use_percent.toFixed(1) }}%</div>
          </q-card>
        </div>
        <div class="col-3">
          <q-card flat bordered class="text-center q-pa-sm">
            <div class="text-caption text-grey">
              {{ vehicle.type === 'owned' ? 'Deduction' : 'Rental Cost' }}
            </div>
            <div class="text-h6" :class="vehicle.type === 'owned' ? 'text-positive' : 'text-orange'">
              R {{ vehicle.type === 'owned' && vehicle.calculation
                ? fmtMoney(vehicle.calculation.annual_deduction)
                : fmtMoney(vehicle.rental_total || 0)
              }}
            </div>
          </q-card>
        </div>
      </div>

      <!-- Tabs -->
      <q-tabs v-model="activeTab" dense class="text-grey" active-color="primary" indicator-color="primary" align="left" narrow-indicator>
        <q-tab name="trips" icon="route" label="Trips" />
        <q-tab name="expenses" icon="receipt_long" label="Expenses" />
        <q-tab name="documents" icon="folder" label="Documents" />
      </q-tabs>
      <q-separator />

      <q-tab-panels v-model="activeTab" animated>
        <!-- TRIPS TAB -->
        <q-tab-panel name="trips" class="q-pa-none q-pt-md">
          <!-- Filter & Add -->
          <div class="row items-center q-gutter-sm q-mb-sm">
            <q-btn-toggle
              v-model="tripFilter"
              toggle-color="primary"
              :options="[
                { label: 'All', value: '' },
                { label: 'Business', value: 'Business' },
                { label: 'Private', value: 'Private' },
              ]"
              unelevated size="sm"
            />
            <q-space />
            <q-btn unelevated color="primary" icon="add" label="Add Trip" size="sm" no-caps @click="openAddTrip" />
          </div>

          <div v-if="tripsLoading" class="text-center q-pa-md">
            <q-spinner size="30px" color="primary" />
          </div>
          <div v-else-if="filteredTrips.length === 0" class="text-center q-pa-lg text-grey">
            No trips recorded yet
          </div>
          <q-list v-else separator>
            <q-item v-for="trip in filteredTrips" :key="trip.id">
              <q-item-section avatar>
                <q-icon :name="trip.is_business ? 'work' : 'home'" :color="trip.is_business ? 'primary' : 'grey'" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ trip.origin }} &rarr; {{ trip.destination }}</q-item-label>
                <q-item-label caption>
                  {{ trip.date }} &middot; {{ trip.distance_km }} km
                  <template v-if="trip.purpose"> &middot; {{ trip.purpose }}</template>
                </q-item-label>
              </q-item-section>
              <q-item-section side>
                <div class="row q-gutter-xs">
                  <q-btn flat round icon="edit" size="sm" @click="editTrip(trip)" />
                  <q-btn flat round icon="delete" size="sm" color="negative" @click="deleteTrip(trip)" />
                </div>
              </q-item-section>
            </q-item>
          </q-list>
        </q-tab-panel>

        <!-- EXPENSES TAB -->
        <q-tab-panel name="expenses" class="q-pa-none q-pt-md">
          <div class="row items-center q-gutter-sm q-mb-sm">
            <q-space />
            <q-btn unelevated color="primary" icon="add" label="Add Expense" size="sm" no-caps @click="openAddExpense" />
            <q-btn outline color="primary" icon="camera_alt" label="Scan Receipt" size="sm" no-caps @click="openScanReceipt" />
          </div>

          <!-- Category Breakdown -->
          <div v-if="expenseSummary" class="row q-col-gutter-xs q-mb-md">
            <div v-for="(val, cat) in expenseSummary.by_category" :key="String(cat)" class="col-auto">
              <q-chip :icon="catIcon(String(cat))" size="sm" outline>
                {{ cat }}: R {{ fmtMoney(val.total) }}
              </q-chip>
            </div>
          </div>

          <div v-if="expensesLoading" class="text-center q-pa-md">
            <q-spinner size="30px" color="primary" />
          </div>
          <div v-else-if="expenses.length === 0" class="text-center q-pa-lg text-grey">
            No expenses recorded yet
          </div>
          <q-list v-else separator>
            <q-item v-for="exp in expenses" :key="exp.id">
              <q-item-section avatar>
                <q-icon :name="catIcon(exp.category)" color="primary" />
              </q-item-section>
              <q-item-section>
                <q-item-label>
                  {{ exp.category }}
                  <template v-if="exp.vendor"> &middot; {{ exp.vendor }}</template>
                </q-item-label>
                <q-item-label caption>
                  {{ exp.date?.substring(0, 10) }}
                  <template v-if="exp.litres"> &middot; {{ exp.litres }}L @ R{{ exp.price_per_litre }}/L</template>
                  <template v-if="exp.odometer_km"> &middot; {{ exp.odometer_km.toLocaleString() }} km</template>
                </q-item-label>
              </q-item-section>
              <q-item-section side>
                <div class="text-weight-bold">R {{ fmtMoney(exp.amount) }}</div>
                <div class="row q-gutter-xs q-mt-xs">
                  <q-btn flat round icon="edit" size="xs" @click="editExpense(exp)" />
                  <q-btn flat round icon="delete" size="xs" color="negative" @click="deleteExpense(exp)" />
                </div>
              </q-item-section>
            </q-item>
          </q-list>
        </q-tab-panel>

        <!-- DOCUMENTS TAB -->
        <q-tab-panel name="documents" class="q-pa-none q-pt-md">
          <div class="row items-center q-mb-sm">
            <q-space />
            <q-btn unelevated color="primary" icon="upload_file" label="Upload Document" size="sm" no-caps @click="showDocUpload = true" />
          </div>
          <div v-if="!vehicle.documents?.length" class="text-center q-pa-lg text-grey">
            No documents uploaded yet
          </div>
          <q-list v-else separator>
            <q-item v-for="doc in vehicle.documents" :key="doc.id">
              <q-item-section avatar>
                <q-icon name="description" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ doc.filename }}</q-item-label>
                <q-item-label caption>{{ doc.mime_type }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-tab-panel>
      </q-tab-panels>
    </template>

    <!-- Not Found -->
    <div v-else class="text-center q-pa-xl text-grey">
      <q-icon name="error_outline" size="48px" class="q-mb-md" />
      <div class="text-subtitle1">Vehicle not found</div>
      <q-btn flat color="primary" label="Back to Travel" to="/travel" class="q-mt-md" />
    </div>

    <!-- Add/Edit Trip Dialog -->
    <q-dialog v-model="showTripDialog" maximized transition-show="slide-up" transition-hide="slide-down">
      <q-card>
        <q-toolbar class="bg-primary text-white">
          <q-toolbar-title>{{ editingTrip ? 'Edit Trip' : 'Add Trip' }}</q-toolbar-title>
          <q-btn flat round icon="close" v-close-popup />
        </q-toolbar>
        <q-card-section>
          <q-input v-model="tForm.date" label="Date" type="date" outlined dense class="q-mb-sm" />
          <q-input v-model="tForm.origin" label="From" outlined dense class="q-mb-sm" />
          <q-input v-model="tForm.destination" label="To" outlined dense class="q-mb-sm" />
          <q-input v-model.number="tForm.distance_km" label="Distance (km)" type="number" outlined dense class="q-mb-sm" />
          <q-input v-model.number="tForm.odometer_start" label="Odometer Start" type="number" outlined dense class="q-mb-sm" />
          <q-input v-model.number="tForm.odometer_end" label="Odometer End" type="number" outlined dense class="q-mb-sm" />
          <q-input v-model="tForm.purpose" label="Purpose" outlined dense class="q-mb-sm" />
          <q-select v-model="tForm.category" :options="['Business', 'Private']" label="Category" outlined dense class="q-mb-sm" />
        </q-card-section>
        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn unelevated color="primary" :label="editingTrip ? 'Save' : 'Add'" :loading="tripSaving" @click="saveTrip" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Add/Edit Expense Dialog -->
    <q-dialog v-model="showExpenseDialog" maximized transition-show="slide-up" transition-hide="slide-down">
      <q-card>
        <q-toolbar class="bg-primary text-white">
          <q-toolbar-title>{{ editingExpenseId ? 'Edit Expense' : 'Add Expense' }}</q-toolbar-title>
          <q-btn flat round icon="close" v-close-popup />
        </q-toolbar>
        <q-card-section>
          <q-input v-model="eForm.date" label="Date" type="date" outlined dense class="q-mb-sm" />
          <q-select v-model="eForm.category" :options="expCats" label="Category" outlined dense class="q-mb-sm" />
          <q-input v-model.number="eForm.amount" label="Amount (R)" type="number" outlined dense class="q-mb-sm" />
          <q-input v-model="eForm.vendor" label="Vendor" outlined dense class="q-mb-sm" />
          <q-input v-model="eForm.description" label="Description" outlined dense class="q-mb-sm" />
          <q-input v-model.number="eForm.litres" label="Litres" type="number" outlined dense class="q-mb-sm" />
          <q-input v-model.number="eForm.price_per_litre" label="Price per Litre" type="number" outlined dense class="q-mb-sm" />
          <q-input v-model.number="eForm.odometer_km" label="Odometer (km)" type="number" outlined dense class="q-mb-sm" />
        </q-card-section>
        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn unelevated color="primary" :label="editingExpenseId ? 'Save' : 'Add'" :loading="expenseSaving" @click="saveExpense" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Scan Receipt Dialog -->
    <q-dialog v-model="showScanDialog" maximized transition-show="slide-up" transition-hide="slide-down">
      <q-card>
        <q-toolbar class="bg-primary text-white">
          <q-toolbar-title>Scan Receipt</q-toolbar-title>
          <q-btn flat round icon="close" v-close-popup />
        </q-toolbar>
        <q-card-section>
          <q-file
            v-model="scanFile"
            label="Select receipt / invoice"
            accept="image/*,.pdf"
            outlined
            :disable="scanUploading"
          >
            <template v-slot:prepend><q-icon name="camera_alt" /></template>
          </q-file>
        </q-card-section>
        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn unelevated color="primary" label="Upload & Extract" icon="cloud_upload" :loading="scanUploading" :disable="!scanFile" @click="doScanUpload" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Document Upload Dialog -->
    <q-dialog v-model="showDocUpload">
      <q-card style="min-width: 320px">
        <q-card-section>
          <div class="text-subtitle1">Upload Document</div>
        </q-card-section>
        <q-card-section>
          <q-select v-model="docType" :options="['registration', 'insurance', 'contract', 'other']" label="Document Type" outlined dense class="q-mb-sm" />
          <q-file v-model="docFile" label="Select file" outlined accept="image/*,.pdf" />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn unelevated color="primary" label="Upload" :disable="!docFile" :loading="docUploading" @click="uploadDoc" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { vehiclesApi, type Vehicle } from '@/services/api/vehicles.api';
import { vehicleExpensesApi, type VehicleExpense, type ExpenseSummary, EXPENSE_CATEGORIES } from '@/services/api/vehicle-expenses.api';
import { tripsApi, type Trip } from '@/services/api/trips.api';

const route = useRoute();
const router = useRouter();
const $q = useQuasar();

const vehicleId = computed(() => route.params.id as string);
const vehicle = ref<(Vehicle & { documents?: Array<{ id: string; filename: string; mime_type: string }> }) | null>(null);
const loading = ref(true);
const activeTab = ref('trips');

// Trips
const trips = ref<Trip[]>([]);
const tripsLoading = ref(false);
const tripFilter = ref('');
const showTripDialog = ref(false);
const editingTrip = ref<Trip | null>(null);
const tripSaving = ref(false);
const tForm = ref(emptyTripForm());

// Expenses
const expenses = ref<VehicleExpense[]>([]);
const expenseSummary = ref<ExpenseSummary | null>(null);
const expensesLoading = ref(false);
const showExpenseDialog = ref(false);
const editingExpenseId = ref<string | null>(null);
const expenseSaving = ref(false);
const eForm = ref(emptyExpenseForm());
const expCats = EXPENSE_CATEGORIES as unknown as string[];

// Scan
const showScanDialog = ref(false);
const scanFile = ref<File | null>(null);
const scanUploading = ref(false);

// Documents
const showDocUpload = ref(false);
const docFile = ref<File | null>(null);
const docType = ref('other');
const docUploading = ref(false);

// Computed
const filteredTrips = computed(() => {
  if (!tripFilter.value) return trips.value;
  return trips.value.filter((t) => t.category === tripFilter.value);
});

// Formatters
function fmt(n: number) { return n.toLocaleString('en-ZA', { maximumFractionDigits: 1 }); }
function fmtMoney(n: number) { return n.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function catIcon(c: string) {
  const m: Record<string, string> = { Fuel: 'local_gas_station', Service: 'build', Tyres: 'tire_repair', Insurance: 'shield', Toll: 'toll', Licence: 'badge', Parking: 'local_parking' };
  return m[c] || 'receipt';
}

function emptyTripForm() {
  return {
    date: new Date().toISOString().substring(0, 10),
    origin: '',
    destination: '',
    distance_km: 0,
    odometer_start: undefined as number | undefined,
    odometer_end: undefined as number | undefined,
    purpose: '',
    category: 'Business' as 'Business' | 'Private',
  };
}

function emptyExpenseForm() {
  return {
    date: new Date().toISOString().substring(0, 10),
    category: 'Fuel',
    amount: 0,
    vendor: '',
    description: '',
    litres: undefined as number | undefined,
    price_per_litre: undefined as number | undefined,
    odometer_km: undefined as number | undefined,
  };
}

// Data Loading
async function loadVehicle() {
  loading.value = true;
  try {
    const { data } = await vehiclesApi.show(vehicleId.value);
    vehicle.value = data.data;
  } catch {
    vehicle.value = null;
  } finally {
    loading.value = false;
  }
}

async function loadTrips() {
  tripsLoading.value = true;
  try {
    const { data } = await tripsApi.list({ vehicle_id: vehicleId.value });
    trips.value = data.data;
  } catch {
    trips.value = [];
  } finally {
    tripsLoading.value = false;
  }
}

async function loadExpenses() {
  expensesLoading.value = true;
  try {
    const [expResp, sumResp] = await Promise.all([
      vehicleExpensesApi.list({ vehicle_id: vehicleId.value }),
      vehicleExpensesApi.summary(vehicleId.value),
    ]);
    expenses.value = expResp.data.data;
    expenseSummary.value = sumResp.data;
  } catch {
    expenses.value = [];
  } finally {
    expensesLoading.value = false;
  }
}

// Trip Actions
function openAddTrip() {
  editingTrip.value = null;
  tForm.value = emptyTripForm();
  showTripDialog.value = true;
}

function editTrip(trip: Trip) {
  editingTrip.value = trip;
  tForm.value = {
    date: trip.date,
    origin: trip.origin,
    destination: trip.destination,
    distance_km: trip.distance_km,
    odometer_start: trip.odometer_start ?? undefined,
    odometer_end: trip.odometer_end ?? undefined,
    purpose: trip.purpose || '',
    category: trip.category,
  };
  showTripDialog.value = true;
}

async function saveTrip() {
  tripSaving.value = true;
  try {
    const payload = { ...tForm.value, vehicle_id: vehicleId.value };
    if (editingTrip.value) {
      await tripsApi.update(editingTrip.value.id, payload);
    } else {
      await tripsApi.create(payload);
    }
    showTripDialog.value = false;
    await Promise.all([loadTrips(), loadVehicle()]);
    $q.notify({ type: 'positive', message: editingTrip.value ? 'Trip updated' : 'Trip added' });
  } catch {
    $q.notify({ type: 'negative', message: 'Failed to save trip' });
  } finally {
    tripSaving.value = false;
  }
}

async function deleteTrip(trip: Trip) {
  $q.dialog({ title: 'Delete Trip', message: `Delete trip from ${trip.origin} to ${trip.destination}?`, cancel: true })
    .onOk(async () => {
      try {
        await tripsApi.delete(trip.id);
        await Promise.all([loadTrips(), loadVehicle()]);
        $q.notify({ type: 'positive', message: 'Trip deleted' });
      } catch {
        $q.notify({ type: 'negative', message: 'Failed to delete trip' });
      }
    });
}

// Expense Actions
function openAddExpense() {
  editingExpenseId.value = null;
  eForm.value = emptyExpenseForm();
  showExpenseDialog.value = true;
}

function editExpense(exp: VehicleExpense) {
  editingExpenseId.value = exp.id;
  eForm.value = {
    date: exp.date?.substring(0, 10) || '',
    category: exp.category,
    amount: exp.amount,
    vendor: exp.vendor || '',
    description: exp.description || '',
    litres: exp.litres ?? undefined,
    price_per_litre: exp.price_per_litre ?? undefined,
    odometer_km: exp.odometer_km ?? undefined,
  };
  showExpenseDialog.value = true;
}

async function saveExpense() {
  expenseSaving.value = true;
  try {
    const payload = { ...eForm.value, vehicle_id: vehicleId.value };
    if (editingExpenseId.value) {
      await vehicleExpensesApi.update(editingExpenseId.value, payload);
    } else {
      await vehicleExpensesApi.create(payload);
    }
    showExpenseDialog.value = false;
    await Promise.all([loadExpenses(), loadVehicle()]);
    $q.notify({ type: 'positive', message: editingExpenseId.value ? 'Expense updated' : 'Expense added' });
  } catch {
    $q.notify({ type: 'negative', message: 'Failed to save expense' });
  } finally {
    expenseSaving.value = false;
  }
}

async function deleteExpense(exp: VehicleExpense) {
  $q.dialog({ title: 'Delete Expense', message: `Delete ${exp.category} expense of R${exp.amount}?`, cancel: true })
    .onOk(async () => {
      try {
        await vehicleExpensesApi.destroy(exp.id);
        await Promise.all([loadExpenses(), loadVehicle()]);
        $q.notify({ type: 'positive', message: 'Expense deleted' });
      } catch {
        $q.notify({ type: 'negative', message: 'Failed to delete expense' });
      }
    });
}

// Scan Receipt
function openScanReceipt() {
  scanFile.value = null;
  showScanDialog.value = true;
}

async function doScanUpload() {
  if (!scanFile.value) return;
  scanUploading.value = true;
  try {
    await vehicleExpensesApi.upload(vehicleId.value, scanFile.value);
    showScanDialog.value = false;
    await Promise.all([loadExpenses(), loadVehicle()]);
    $q.notify({ type: 'positive', message: 'Receipt uploaded for extraction' });
  } catch {
    $q.notify({ type: 'negative', message: 'Failed to upload receipt' });
  } finally {
    scanUploading.value = false;
  }
}

// Document Upload
async function uploadDoc() {
  if (!docFile.value || !vehicle.value) return;
  docUploading.value = true;
  try {
    await vehiclesApi.uploadDocument(vehicle.value.id, docFile.value, docType.value);
    showDocUpload.value = false;
    await loadVehicle();
    $q.notify({ type: 'positive', message: 'Document uploaded' });
  } catch {
    $q.notify({ type: 'negative', message: 'Failed to upload document' });
  } finally {
    docUploading.value = false;
  }
}

// Watch for tab changes to load data
watch(activeTab, (tab) => {
  if (tab === 'trips' && trips.value.length === 0) loadTrips();
  if (tab === 'expenses' && expenses.value.length === 0) loadExpenses();
});

onMounted(async () => {
  await loadVehicle();
  loadTrips();
  loadExpenses();
});
</script>
