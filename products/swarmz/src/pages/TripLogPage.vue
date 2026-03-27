<template>
  <q-page padding>
    <template v-if="vehicle">
      <!-- Header -->
      <div class="row items-center q-mb-md">
        <q-btn flat dense icon="arrow_back" @click="$router.push(`/vehicle/${id}`)" class="q-mr-sm" />
        <div class="col">
          <div class="text-h5 text-weight-bold">Trip Logbook</div>
          <div class="text-subtitle2 text-grey-7">{{ vehicle.name || `${vehicle.make} ${vehicle.model}` }} &middot; {{ vehicle.registration }}</div>
        </div>
        <q-btn color="primary" icon="add" label="Log Trip" @click="showForm = true" />
      </div>

      <!-- Summary Cards -->
      <div class="row q-gutter-sm q-mb-md" v-if="summary">
        <div class="col-6 col-sm-3">
          <q-card flat bordered class="q-pa-sm text-center">
            <div class="text-caption text-grey-7">Total km</div>
            <div class="text-h6 text-weight-bold">{{ summary.totalKm.toLocaleString() }}</div>
          </q-card>
        </div>
        <div class="col-6 col-sm-3">
          <q-card flat bordered class="q-pa-sm text-center">
            <div class="text-caption text-grey-7">Business km</div>
            <div class="text-h6 text-weight-bold text-positive">{{ summary.businessKm.toLocaleString() }}</div>
          </q-card>
        </div>
        <div class="col-6 col-sm-3">
          <q-card flat bordered class="q-pa-sm text-center">
            <div class="text-caption text-grey-7">Private km</div>
            <div class="text-h6 text-weight-bold text-grey-6">{{ summary.privateKm.toLocaleString() }}</div>
          </q-card>
        </div>
        <div class="col-6 col-sm-3">
          <q-card flat bordered class="q-pa-sm text-center">
            <div class="text-caption text-grey-7">Business %</div>
            <div class="text-h6 text-weight-bold text-primary">{{ summary.businessPercent }}%</div>
          </q-card>
        </div>
      </div>

      <!-- Filters -->
      <div class="row q-gutter-sm q-mb-md">
        <q-btn-toggle v-model="filterCategory" no-caps rounded toggle-color="primary" :options="[
          { label: 'All', value: 'ALL' },
          { label: 'Business', value: 'BUSINESS' },
          { label: 'Private', value: 'PRIVATE' },
        ]" />
      </div>

      <!-- Trip List -->
      <q-list separator v-if="filteredTrips.length">
        <q-item v-for="trip in filteredTrips" :key="trip.id" class="q-py-sm">
          <q-item-section side>
            <q-badge :color="trip.isBusiness ? 'positive' : 'grey'" :label="trip.isBusiness ? 'B' : 'P'" />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ trip.origin }} → {{ trip.destination }}</q-item-label>
            <q-item-label caption>{{ trip.date }}<span v-if="trip.purpose"> &middot; {{ trip.purpose }}</span></q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-item-label class="text-weight-bold">{{ trip.distanceKm }} km</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>

      <div v-else-if="!loading" class="text-center q-pa-xl">
        <q-icon name="route" size="64px" color="grey-4" />
        <div class="text-h6 text-grey-5 q-mt-md">No trips logged yet</div>
        <q-btn color="primary" icon="add" label="Log First Trip" class="q-mt-lg" @click="showForm = true" />
      </div>

      <q-inner-loading :showing="loading" />
    </template>

    <q-page v-else class="flex flex-center">
      <q-spinner size="40px" color="primary" />
    </q-page>

    <!-- Log Trip Dialog -->
    <q-dialog v-model="showForm" persistent>
      <q-card style="min-width: 360px; max-width: 500px">
        <q-card-section>
          <div class="text-h6">Log Trip</div>
        </q-card-section>

        <q-card-section class="q-gutter-sm">
          <q-input v-model="form.date" label="Date" outlined type="date" />
          <q-input v-model="form.origin" label="Origin" outlined placeholder="e.g. Home (Hartbeespoort)" />
          <q-input v-model="form.destination" label="Destination" outlined placeholder="e.g. Nucleus Mining (Lanseria)" />
          <q-input v-model.number="form.distanceKm" label="Distance (km)" type="number" outlined :rules="[v => v > 0 || 'Required']" />
          <q-btn-toggle v-model="form.category" no-caps rounded toggle-color="primary" class="q-mb-sm" :options="[
            { label: 'Business', value: 'BUSINESS' },
            { label: 'Private', value: 'PRIVATE' },
          ]" />
          <q-input v-if="form.category === 'BUSINESS'" v-model="form.purpose" label="Purpose (required for SARS)" outlined placeholder="e.g. Client meeting" :rules="[v => !!v || 'Purpose required for business trips']" />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" @click="showForm = false" />
          <q-btn color="primary" label="Save" :loading="saving" @click="saveTrip" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { Notify } from 'quasar';
import { api } from 'boot/axios';

const props = defineProps<{ id: string }>();

const vehicle = ref<any>(null);
const trips = ref<any[]>([]);
const summary = ref<any>(null);
const loading = ref(false);
const saving = ref(false);
const showForm = ref(false);
const filterCategory = ref('ALL');

const today = new Date().toISOString().split('T')[0];
const form = reactive({
  date: today,
  origin: '',
  destination: '',
  distanceKm: null as number | null,
  category: 'BUSINESS',
  purpose: '',
});

const filteredTrips = computed(() => {
  if (filterCategory.value === 'ALL') return trips.value;
  return trips.value.filter(t => t.category.toUpperCase() === filterCategory.value);
});

async function loadData() {
  loading.value = true;
  try {
    const [vRes, tRes] = await Promise.all([
      api.get(`/vehicles/${props.id}`),
      api.get('/trips', { params: { vehicle_id: props.id } }),
    ]);
    vehicle.value = vRes.data;
    trips.value = tRes.data.trips || [];
    summary.value = tRes.data.summary || null;
  } catch (err: any) {
    Notify.create({ type: 'negative', message: err.response?.data?.message || 'Failed to load trips' });
  } finally {
    loading.value = false;
  }
}

async function saveTrip() {
  if (!form.distanceKm || form.distanceKm <= 0 || !form.origin || !form.destination) {
    Notify.create({ type: 'negative', message: 'Origin, destination and distance are required' });
    return;
  }
  if (form.category === 'BUSINESS' && !form.purpose) {
    Notify.create({ type: 'negative', message: 'Purpose is required for business trips' });
    return;
  }
  saving.value = true;
  try {
    await api.post('/trips', {
      vehicleId: props.id,
      date: form.date,
      origin: form.origin,
      destination: form.destination,
      distanceKm: form.distanceKm,
      category: form.category,
      purpose: form.purpose || undefined,
      source: 'MANUAL',
    });

    Notify.create({ type: 'positive', message: 'Trip logged' });
    showForm.value = false;
    form.origin = '';
    form.destination = '';
    form.distanceKm = null;
    form.purpose = '';
    form.date = today;
    await loadData();
  } catch (err: any) {
    Notify.create({ type: 'negative', message: err.response?.data?.message || 'Failed to save trip' });
  } finally {
    saving.value = false;
  }
}

onMounted(loadData);
</script>
