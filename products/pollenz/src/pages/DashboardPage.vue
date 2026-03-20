<template>
  <q-page padding>
    <!-- Tax Year Tabs -->
    <div class="row items-center q-mb-md">
      <div class="text-h5 q-mr-md">Dashboard</div>
      <q-tabs
        v-model="selectedYear"
        dense
        class="text-grey-7"
        active-color="primary"
        indicator-color="primary"
        narrow-indicator
        no-caps
      >
        <q-tab
          v-for="year in availableYears"
          :key="year"
          :name="year"
          :label="yearLabel(year)"
        />
      </q-tabs>
    </div>

    <div v-if="loading" class="text-center q-pa-xl">
      <q-spinner size="40px" color="primary" />
      <div class="q-mt-sm text-grey-6">Loading dashboard...</div>
    </div>

    <template v-else-if="summary">
      <!-- Period Banner -->
      <div class="text-caption text-grey-6 q-mb-md">
        {{ summary.tax_year_label }} (SA Tax Year)
      </div>

      <!-- Top KPI Row -->
      <div class="row q-col-gutter-sm q-mb-md">
        <div class="col-6 col-sm-3">
          <q-card class="bg-positive text-white" style="min-height:90px">
            <q-card-section class="q-pa-sm">
              <div class="text-caption">Gross Income</div>
              <div class="text-h6">R {{ fmt(summary.income.transaction_total) }}</div>
              <div class="text-caption">{{ summary.income.transaction_count }} transactions</div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-6 col-sm-3">
          <q-card class="bg-red-7 text-white" style="min-height:90px">
            <q-card-section class="q-pa-sm">
              <div class="text-caption">Total Expenses</div>
              <div class="text-h6">R {{ fmt(summary.expenses.transaction_total) }}</div>
              <div class="text-caption">{{ summary.expenses.transaction_count }} transactions</div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-6 col-sm-3">
          <q-card class="bg-teal-7 text-white" style="min-height:90px">
            <q-card-section class="q-pa-sm">
              <div class="text-caption">Net Position</div>
              <div class="text-h6">R {{ fmt(summary.net_position) }}</div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-6 col-sm-3">
          <q-card class="bg-amber-8 text-white" style="min-height:90px">
            <q-card-section class="q-pa-sm">
              <div class="text-caption">Tax Deductible</div>
              <div class="text-h6">R {{ fmt(summary.expenses.tax_deductible) }}</div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- Income & Invoices Row -->
      <div class="text-subtitle1 text-weight-medium q-mb-sm">Income</div>
      <div class="row q-col-gutter-sm q-mb-md">
        <div class="col-6 col-sm-3">
          <q-card flat bordered>
            <q-card-section class="q-pa-sm">
              <div class="text-caption text-grey-7">Invoiced</div>
              <div class="text-subtitle1 text-weight-bold">R {{ fmt(summary.income.invoiced) }}</div>
              <div class="text-caption text-grey-5">{{ summary.income.invoice_count }} invoices</div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-6 col-sm-3">
          <q-card flat bordered>
            <q-card-section class="q-pa-sm">
              <div class="text-caption text-grey-7">Paid</div>
              <div class="text-subtitle1 text-weight-bold text-positive">R {{ fmt(summary.income.paid) }}</div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-6 col-sm-3">
          <q-card flat bordered>
            <q-card-section class="q-pa-sm">
              <div class="text-caption text-grey-7">Outstanding</div>
              <div class="text-subtitle1 text-weight-bold text-warning">R {{ fmt(summary.income.outstanding) }}</div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-6 col-sm-3">
          <q-card flat bordered>
            <q-card-section class="q-pa-sm">
              <div class="text-caption text-grey-7">Income Sources</div>
              <q-list dense class="q-mt-xs">
                <q-item v-for="ic in topIncomeCategories" :key="ic.category_id" dense class="q-pa-none" style="min-height:24px">
                  <q-item-section>
                    <q-item-label class="text-caption">{{ ic.category_name || 'Uncategorised' }}</q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-item-label class="text-caption text-weight-medium">R {{ fmt(ic.total) }}</q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- Expense Categories Breakdown -->
      <div class="text-subtitle1 text-weight-medium q-mb-sm">Expenses by Category</div>
      <div class="row q-col-gutter-sm q-mb-md">
        <div class="col-12 col-md-8">
          <q-card flat bordered>
            <q-list separator>
              <q-item v-for="cat in summary.expense_categories" :key="cat.category_id" dense>
                <q-item-section avatar style="min-width:32px">
                  <q-icon :name="cat.icon || 'label'" :color="cat.is_tax_deductible ? 'amber-8' : 'grey-5'" size="20px" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ cat.category_name || 'Uncategorised' }}</q-item-label>
                  <q-item-label caption>{{ cat.count }} transactions</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-item-label class="text-weight-bold">R {{ fmt(cat.total) }}</q-item-label>
                </q-item-section>
                <q-item-section side style="width:60px">
                  <q-linear-progress
                    :value="Number(cat.total) / summary.expenses.transaction_total"
                    color="red-4"
                    track-color="grey-3"
                    rounded
                    style="width:50px"
                  />
                </q-item-section>
              </q-item>
            </q-list>
          </q-card>
        </div>

        <!-- Vendor Invoices Summary -->
        <div class="col-12 col-md-4">
          <q-card flat bordered>
            <q-card-section>
              <div class="text-subtitle2">Supporting Documents</div>
            </q-card-section>
            <q-list dense separator>
              <q-item>
                <q-item-section>
                  <q-item-label>Vendor Invoices</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-badge color="blue">{{ summary.expenses.vendor_invoice_count }}</q-badge>
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section>
                  <q-item-label>Documented Value</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-item-label class="text-weight-medium">R {{ fmt(summary.expenses.vendor_invoice_total) }}</q-item-label>
                </q-item-section>
              </q-item>
              <q-item v-if="summary.expenses.pending_review > 0">
                <q-item-section>
                  <q-item-label>Pending Review</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-badge color="orange">{{ summary.expenses.pending_review }}</q-badge>
                </q-item-section>
              </q-item>
              <q-item v-if="summary.expenses.needs_extraction > 0">
                <q-item-section>
                  <q-item-label>Needs Extraction</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-badge color="red">{{ summary.expenses.needs_extraction }}</q-badge>
                </q-item-section>
              </q-item>
            </q-list>
          </q-card>

          <!-- Quick Actions -->
          <q-card flat bordered class="q-mt-sm">
            <q-card-section>
              <div class="text-subtitle2 q-mb-sm">Quick Actions</div>
              <div class="column q-gutter-xs">
                <q-btn color="primary" icon="add" label="New Invoice" @click="$router.push('/income/new-invoice')" unelevated size="sm" class="full-width" />
                <q-btn color="secondary" icon="upload_file" label="Upload Expense" @click="$router.push('/expenses')" outline size="sm" class="full-width" />
                <q-btn color="accent" icon="people" label="Manage Clients" @click="$router.push('/clients')" outline size="sm" class="full-width" />
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </template>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { transactionsApi, type DashboardSummary } from '@/services/api/transactions.api';

const summary = ref<DashboardSummary | null>(null);
const loading = ref(true);
const selectedYear = ref<number>(0);
const availableYears = ref<number[]>([]);

function yearLabel(year: number): string {
  return `${year}/${(year + 1).toString().slice(2)}`;
}

function fmt(amount: number | string): string {
  return (Number(amount) || 0).toLocaleString('en-ZA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

const topIncomeCategories = computed(() => {
  return (summary.value?.income_categories || []).slice(0, 4);
});

async function loadSummary(taxYear?: number) {
  loading.value = true;
  try {
    const res = await transactionsApi.summary(taxYear);
    summary.value = res.data;
    availableYears.value = res.data.available_tax_years;
    if (!selectedYear.value) {
      selectedYear.value = res.data.tax_year;
    }
  } catch (err) {
    console.error('Failed to load dashboard', err);
  } finally {
    loading.value = false;
  }
}

watch(selectedYear, (year) => {
  if (year && summary.value && year !== summary.value.tax_year) {
    loadSummary(year);
  }
});

onMounted(() => loadSummary());
</script>
