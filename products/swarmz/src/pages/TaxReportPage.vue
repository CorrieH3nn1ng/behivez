<template>
  <q-page padding>
    <div class="row items-center q-mb-md">
      <q-btn flat dense icon="arrow_back" @click="$router.push('/')" class="q-mr-sm" />
      <div class="col">
        <div class="text-h5 text-weight-bold">Tax Report</div>
        <div class="text-subtitle2 text-grey-7">SARS Vehicle Claim Comparison</div>
      </div>
    </div>

    <!-- Selectors -->
    <div class="row q-gutter-sm q-mb-md">
      <q-select v-model="selectedVehicle" :options="vehicleOptions" label="Vehicle" outlined dense emit-value map-options style="min-width: 250px" />
    </div>

    <template v-if="report && !loading">
      <!-- KM Summary -->
      <q-card flat bordered class="q-pa-md q-mb-md">
        <div class="text-subtitle1 text-weight-bold q-mb-sm">Kilometres — {{ report.taxYear }}</div>
        <div class="row q-gutter-md">
          <div class="col-6 col-sm-3">
            <div class="text-caption text-grey-7">Total km</div>
            <div class="text-h6">{{ report.km.total.toLocaleString() }}</div>
          </div>
          <div class="col-6 col-sm-3">
            <div class="text-caption text-grey-7">Business km</div>
            <div class="text-h6 text-positive">{{ report.km.business.toLocaleString() }}</div>
          </div>
          <div class="col-6 col-sm-3">
            <div class="text-caption text-grey-7">Private km</div>
            <div class="text-h6 text-grey-6">{{ report.km.private.toLocaleString() }}</div>
          </div>
          <div class="col-6 col-sm-3">
            <div class="text-caption text-grey-7">Business %</div>
            <div class="text-h6 text-primary">{{ report.km.businessPercent }}%</div>
          </div>
        </div>
        <div class="text-caption text-grey-5 q-mt-xs">{{ report.km.tripCount }} trips recorded</div>
      </q-card>

      <!-- Method Comparison -->
      <div class="row q-gutter-md q-mb-md">
        <!-- Fixed Cost Method -->
        <div class="col-12 col-sm-6">
          <q-card flat bordered class="q-pa-md full-height" :class="report.comparison.winner === 'fixed_cost' ? 'bg-green-1' : ''">
            <div class="row items-center q-mb-sm">
              <div class="text-subtitle1 text-weight-bold">Fixed Cost Method</div>
              <q-badge v-if="report.comparison.winner === 'fixed_cost'" color="positive" label="WINNER" class="q-ml-sm" />
            </div>
            <template v-if="report.fixedCostMethod">
              <div class="q-gutter-xs">
                <div class="row justify-between"><span class="text-grey-7">Fixed cost PA (prorated)</span><span>R{{ report.fixedCostMethod.proratedFixedCost.toLocaleString() }}</span></div>
                <div class="row justify-between"><span class="text-grey-7">Fuel deemed ({{ report.fixedCostMethod.fuelCostPerKm }} c/km)</span><span>R{{ report.fixedCostMethod.fuelDeemed.toLocaleString() }}</span></div>
                <div class="row justify-between"><span class="text-grey-7">Maint deemed ({{ report.fixedCostMethod.maintenanceCostPerKm }} c/km)</span><span>R{{ report.fixedCostMethod.maintenanceDeemed.toLocaleString() }}</span></div>
                <q-separator class="q-my-xs" />
                <div class="row justify-between"><span class="text-grey-7">Deemed cost</span><span class="text-weight-bold">R{{ report.fixedCostMethod.deemedCost.toLocaleString() }}</span></div>
                <div class="row justify-between"><span class="text-grey-7">× Business {{ report.fixedCostMethod.businessPercent }}%</span><span></span></div>
                <q-separator class="q-my-xs" />
                <div class="row justify-between text-h6"><span>Deduction</span><span class="text-weight-bold text-positive">R{{ report.fixedCostMethod.deduction.toLocaleString() }}</span></div>
              </div>
              <div class="text-caption text-grey-5 q-mt-sm">{{ report.fixedCostMethod.useDays }}/{{ report.fixedCostMethod.totalDaysInYear }} days used</div>
            </template>
            <div v-else class="text-grey-5">Not available for rental vehicles</div>
          </q-card>
        </div>

        <!-- Actual Cost Method -->
        <div class="col-12 col-sm-6">
          <q-card flat bordered class="q-pa-md full-height" :class="report.comparison.winner === 'actual_cost' ? 'bg-green-1' : ''">
            <div class="row items-center q-mb-sm">
              <div class="text-subtitle1 text-weight-bold">Actual Cost Method</div>
              <q-badge v-if="report.comparison.winner === 'actual_cost'" color="positive" label="WINNER" class="q-ml-sm" />
            </div>
            <div class="q-gutter-xs">
              <div v-for="(amount, cat) in report.actualCostMethod.byCategory" :key="cat" class="row justify-between">
                <span class="text-grey-7 text-capitalize">{{ cat }}</span>
                <span>R{{ amount.toLocaleString() }}</span>
              </div>
              <q-separator class="q-my-xs" />
              <div class="row justify-between"><span class="text-grey-7">Total actual cost</span><span class="text-weight-bold">R{{ report.actualCostMethod.totalActualCost.toLocaleString() }}</span></div>
              <div class="row justify-between"><span class="text-grey-7">× Business {{ report.actualCostMethod.businessPercent }}%</span><span></span></div>
              <q-separator class="q-my-xs" />
              <div class="row justify-between text-h6"><span>Deduction</span><span class="text-weight-bold text-positive">R{{ report.actualCostMethod.deduction.toLocaleString() }}</span></div>
            </div>
          </q-card>
        </div>
      </div>

      <!-- Recommendation -->
      <q-banner class="q-mb-md" :class="report.comparison.winner === 'fixed_cost' ? 'bg-green-1 text-green-9' : 'bg-blue-1 text-blue-9'" rounded>
        <template v-slot:avatar><q-icon name="emoji_objects" /></template>
        <div class="text-weight-bold">{{ report.comparison.recommendation }}</div>
        <div class="text-caption q-mt-xs">Difference: R{{ report.comparison.difference.toLocaleString() }}</div>
      </q-banner>
    </template>

    <div v-else-if="loading" class="flex flex-center q-pa-xl">
      <q-spinner size="40px" color="primary" />
    </div>

    <div v-else-if="!selectedVehicle" class="text-center q-pa-xl">
      <q-icon name="analytics" size="64px" color="grey-4" />
      <div class="text-h6 text-grey-5 q-mt-md">Select a vehicle to view tax report</div>
    </div>

    <div v-else class="text-center q-pa-xl">
      <q-icon name="info" size="64px" color="grey-4" />
      <div class="text-h6 text-grey-5 q-mt-md">No data for this vehicle</div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { Notify } from 'quasar';
import { api } from 'boot/axios';

const vehicles = ref<any[]>([]);
const selectedVehicle = ref<string | null>(null);
const report = ref<any>(null);
const loading = ref(false);

const vehicleOptions = computed(() =>
  vehicles.value.map(v => ({
    label: `${v.name || `${v.make} ${v.model}`} (${v.registration})`,
    value: v.id,
  }))
);

async function loadVehicles() {
  try {
    const res = await api.get('/vehicles', { params: { all: 'true' } });
    vehicles.value = res.data;
    if (vehicles.value.length === 1) {
      selectedVehicle.value = vehicles.value[0].id;
    }
  } catch (err: any) {
    Notify.create({ type: 'negative', message: 'Failed to load vehicles' });
  }
}

async function loadReport() {
  if (!selectedVehicle.value) { report.value = null; return; }
  loading.value = true;
  try {
    const res = await api.get(`/sars/vehicle/${selectedVehicle.value}`);
    report.value = res.data;
  } catch (err: any) {
    report.value = null;
    Notify.create({ type: 'negative', message: err.response?.data?.message || 'Failed to load tax report' });
  } finally {
    loading.value = false;
  }
}

watch(selectedVehicle, loadReport);

onMounted(async () => {
  await loadVehicles();
});
</script>
