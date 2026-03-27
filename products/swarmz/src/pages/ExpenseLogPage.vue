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
        <q-btn color="primary" icon="add" label="Log Expense" @click="showForm = true" />
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
        <q-btn color="primary" icon="add" label="Log First Expense" class="q-mt-lg" @click="showForm = true" />
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
          <div class="text-h6">Log Expense</div>
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
import { Notify } from 'quasar';
import { api } from 'boot/axios';

const props = defineProps<{ id: string }>();

const vehicle = ref<any>(null);
const expenses = ref<any[]>([]);
const loading = ref(false);
const saving = ref(false);
const showForm = ref(false);
const filterCategory = ref('ALL');

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

    await api.post('/vehicle-expenses', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    Notify.create({ type: 'positive', message: 'Expense logged' });
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
}

onMounted(loadData);
</script>
