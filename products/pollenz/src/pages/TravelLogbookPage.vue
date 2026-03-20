<template>
  <q-page padding>
    <div class="row items-center q-mb-md">
      <div class="text-h5 q-mr-md">Travel Logbook</div>
      <q-space />
      <q-btn color="primary" icon="add" label="Add Trip" @click="showAddDialog = true" unelevated />
    </div>

    <!-- Travel Summary Cards -->
    <div v-if="travelSummary" class="row q-col-gutter-sm q-mb-md">
      <div class="col-6 col-sm-3">
        <q-card flat bordered>
          <q-card-section class="q-pa-sm">
            <div class="text-caption text-grey-7">Total Trips</div>
            <div class="text-h6">{{ travelSummary.total_trips }}</div>
            <div class="text-caption text-grey-5">{{ fmt(travelSummary.total_km) }} km</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-6 col-sm-3">
        <q-card flat bordered class="bg-green-1">
          <q-card-section class="q-pa-sm">
            <div class="text-caption text-positive">Business</div>
            <div class="text-h6 text-positive">{{ travelSummary.business.trips }} trips</div>
            <div class="text-caption">{{ fmt(travelSummary.business.km) }} km ({{ travelSummary.business_use_percent }}%)</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-6 col-sm-3">
        <q-card flat bordered class="bg-grey-1">
          <q-card-section class="q-pa-sm">
            <div class="text-caption text-grey-7">Private</div>
            <div class="text-h6">{{ travelSummary.private.trips }} trips</div>
            <div class="text-caption">{{ fmt(travelSummary.private.km) }} km</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-6 col-sm-3">
        <q-card flat bordered class="bg-amber-1">
          <q-card-section class="q-pa-sm" v-if="travelSummary.vehicle_deduction">
            <div class="text-caption text-amber-9">SARS Deduction</div>
            <div class="text-h6 text-amber-9">R {{ fmtMoney(travelSummary.vehicle_deduction.annual_deduction) }}</div>
            <div class="text-caption">{{ travelSummary.vehicle_deduction.method }}</div>
          </q-card-section>
          <q-card-section class="q-pa-sm" v-else>
            <div class="text-caption text-grey-7">Vehicle Config</div>
            <div class="text-subtitle2 text-grey-5">Not configured</div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Filters -->
    <div class="row items-center q-gutter-sm q-mb-md">
      <q-btn-toggle
        v-model="categoryFilter"
        toggle-color="primary"
        :options="[
          { label: 'All', value: '' },
          { label: 'Business', value: 'Business' },
          { label: 'Private', value: 'Private' },
        ]"
        unelevated
        size="sm"
      />
      <q-space />
      <q-btn flat icon="print" label="Print" @click="printLogbook" size="sm" />
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-center q-pa-xl">
      <q-spinner size="40px" color="primary" />
    </div>

    <!-- Trip List -->
    <q-card v-else flat bordered>
      <q-table
        :rows="trips"
        :columns="columns"
        row-key="id"
        flat
        dense
        :pagination="{ rowsPerPage: 50 }"
        :filter="categoryFilter"
        :filter-method="filterTrips"
      >
        <template #body-cell-category="props">
          <q-td :props="props">
            <q-badge :color="props.row.category === 'Business' ? 'green' : 'grey'" :label="props.row.category" />
          </q-td>
        </template>
        <template #body-cell-distance_km="props">
          <q-td :props="props" class="text-right">
            {{ fmt(props.row.distance_km) }} km
          </q-td>
        </template>
        <template #body-cell-actions="props">
          <q-td :props="props">
            <q-btn flat dense icon="edit" size="sm" @click="editTrip(props.row)" />
            <q-btn flat dense icon="delete" size="sm" color="red" @click="confirmDelete(props.row)" />
          </q-td>
        </template>
      </q-table>
    </q-card>

    <!-- Add/Edit Trip Dialog -->
    <q-dialog v-model="showAddDialog" persistent>
      <q-card style="min-width:350px">
        <q-card-section>
          <div class="text-h6">{{ editingTrip ? 'Edit Trip' : 'Add Trip' }}</div>
        </q-card-section>
        <q-card-section class="column q-gutter-sm">
          <q-input v-model="tripForm.date" type="date" label="Date" dense outlined />
          <q-input v-model="tripForm.origin" label="From" dense outlined />
          <q-input v-model="tripForm.destination" label="To" dense outlined />
          <q-input v-model.number="tripForm.distance_km" type="number" label="Distance (km)" dense outlined step="0.1" />
          <q-input v-model="tripForm.purpose" label="Purpose" dense outlined />
          <q-select v-model="tripForm.category" :options="['Business', 'Private']" label="Category" dense outlined />
          <div class="row q-gutter-sm">
            <q-input v-model="tripForm.start_time" type="time" label="Depart" dense outlined class="col" />
            <q-input v-model="tripForm.end_time" type="time" label="Arrive" dense outlined class="col" />
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" @click="cancelDialog" />
          <q-btn color="primary" :label="editingTrip ? 'Update' : 'Add'" @click="saveTrip" :loading="saving" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { tripsApi, type Trip, type TravelSummary } from '@/services/api/trips.api';

const $q = useQuasar();

const trips = ref<Trip[]>([]);
const travelSummary = ref<TravelSummary | null>(null);
const loading = ref(true);
const saving = ref(false);
const categoryFilter = ref('');
const showAddDialog = ref(false);
const editingTrip = ref<Trip | null>(null);

const tripForm = ref({
  date: new Date().toISOString().substring(0, 10),
  origin: '',
  destination: '',
  distance_km: 0,
  purpose: '',
  category: 'Business' as 'Business' | 'Private',
  start_time: '',
  end_time: '',
});

const columns = [
  { name: 'date', label: 'Date', field: 'date', sortable: true, align: 'left' as const },
  { name: 'origin', label: 'From', field: 'origin', align: 'left' as const },
  { name: 'destination', label: 'To', field: 'destination', align: 'left' as const },
  { name: 'distance_km', label: 'Distance', field: 'distance_km', sortable: true, align: 'right' as const },
  { name: 'purpose', label: 'Purpose', field: 'purpose', align: 'left' as const },
  { name: 'category', label: 'Type', field: 'category', sortable: true, align: 'center' as const },
  { name: 'source', label: 'Source', field: 'source', align: 'center' as const },
  { name: 'actions', label: '', field: 'id', align: 'right' as const },
];

function fmt(n: number): string {
  return n.toLocaleString('en-ZA', { maximumFractionDigits: 1 });
}

function fmtMoney(n: number): string {
  return n.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function filterTrips(rows: Trip[], filter: string): Trip[] {
  if (!filter) return rows;
  return rows.filter(r => r.category === filter);
}

function editTrip(trip: Trip) {
  editingTrip.value = trip;
  tripForm.value = {
    date: trip.date,
    origin: trip.origin,
    destination: trip.destination,
    distance_km: trip.distance_km,
    purpose: trip.purpose || '',
    category: trip.category,
    start_time: trip.start_time || '',
    end_time: trip.end_time || '',
  };
  showAddDialog.value = true;
}

function cancelDialog() {
  showAddDialog.value = false;
  editingTrip.value = null;
  tripForm.value = {
    date: new Date().toISOString().substring(0, 10),
    origin: '',
    destination: '',
    distance_km: 0,
    purpose: '',
    category: 'Business',
    start_time: '',
    end_time: '',
  };
}

async function saveTrip() {
  if (!tripForm.value.origin || !tripForm.value.destination || !tripForm.value.distance_km) {
    $q.notify({ type: 'warning', message: 'Please fill in required fields' });
    return;
  }

  saving.value = true;
  try {
    if (editingTrip.value) {
      await tripsApi.update(editingTrip.value.id, tripForm.value);
      $q.notify({ type: 'positive', message: 'Trip updated' });
    } else {
      await tripsApi.create(tripForm.value);
      $q.notify({ type: 'positive', message: 'Trip added' });
    }
    cancelDialog();
    await loadData();
  } catch (err) {
    $q.notify({ type: 'negative', message: 'Failed to save trip' });
  } finally {
    saving.value = false;
  }
}

function confirmDelete(trip: Trip) {
  $q.dialog({
    title: 'Delete Trip',
    message: `Delete ${trip.date} ${trip.origin} → ${trip.destination}?`,
    cancel: true,
  }).onOk(async () => {
    try {
      await tripsApi.delete(trip.id);
      $q.notify({ type: 'positive', message: 'Trip deleted' });
      await loadData();
    } catch {
      $q.notify({ type: 'negative', message: 'Failed to delete' });
    }
  });
}

function printLogbook() {
  window.print();
}

async function loadData() {
  loading.value = true;
  try {
    const [tripsRes, summaryRes] = await Promise.all([
      tripsApi.list(),
      tripsApi.summary(),
    ]);
    trips.value = tripsRes.data.data;
    travelSummary.value = summaryRes.data;
  } catch (err) {
    console.error('Failed to load trips', err);
  } finally {
    loading.value = false;
  }
}

onMounted(loadData);
</script>

<style>
@media print {
  .q-header, .q-drawer, .q-btn, .q-page-sticky { display: none !important; }
  .q-page { padding: 0 !important; }
}
</style>
