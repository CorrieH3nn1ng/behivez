<template>
  <q-page padding>
    <div class="text-h5 q-mb-md">Reports</div>

    <!-- Date Range -->
    <q-card class="q-mb-lg">
      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-6 col-md-3">
            <q-input
              v-model="dateFrom"
              label="From"
              type="date"
              outlined
              dense
            />
          </div>
          <div class="col-6 col-md-3">
            <q-input
              v-model="dateTo"
              label="To"
              type="date"
              outlined
              dense
            />
          </div>
          <div class="col-12 col-md-3">
            <q-btn color="primary" @click="loadReports" :loading="isLoading">
              Generate Reports
            </q-btn>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Fleet Utilization -->
    <div class="row q-col-gutter-md q-mb-lg">
      <div class="col-12 col-md-6">
        <q-card>
          <q-card-section>
            <div class="text-h6">Fleet Utilization</div>
          </q-card-section>
          <q-separator />
          <q-card-section>
            <div class="text-center">
              <div class="text-h2 text-primary">{{ reports.utilization }}%</div>
              <div class="text-subtitle2 text-grey-7">Average utilization</div>
            </div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-md-6">
        <q-card>
          <q-card-section>
            <div class="text-h6">Total Rentals</div>
          </q-card-section>
          <q-separator />
          <q-card-section>
            <div class="text-center">
              <div class="text-h2 text-secondary">{{ reports.totalRentals }}</div>
              <div class="text-subtitle2 text-grey-7">Completed rentals</div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Category Breakdown -->
    <q-card class="q-mb-lg">
      <q-card-section>
        <div class="text-h6">Utilization by Category</div>
      </q-card-section>
      <q-separator />
      <q-card-section>
        <q-list separator>
          <q-item v-for="cat in reports.byCategory" :key="cat.name">
            <q-item-section>
              <q-item-label>{{ cat.name }}</q-item-label>
              <q-linear-progress
                :value="cat.utilization / 100"
                color="primary"
                class="q-mt-sm"
              />
            </q-item-section>
            <q-item-section side>
              {{ cat.utilization }}%
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>
    </q-card>

    <!-- Walk-In Demand -->
    <q-card>
      <q-card-section>
        <div class="text-h6">Walk-In Demand Analysis</div>
      </q-card-section>
      <q-separator />
      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-6 col-md-3">
            <div class="text-center">
              <div class="text-h4">{{ reports.walkIns.total }}</div>
              <div class="text-caption text-grey-7">Total Walk-Ins</div>
            </div>
          </div>
          <div class="col-6 col-md-3">
            <div class="text-center">
              <div class="text-h4 text-positive">{{ reports.walkIns.converted }}</div>
              <div class="text-caption text-grey-7">Converted</div>
            </div>
          </div>
          <div class="col-6 col-md-3">
            <div class="text-center">
              <div class="text-h4 text-negative">{{ reports.walkIns.lost }}</div>
              <div class="text-caption text-grey-7">Lost (No Availability)</div>
            </div>
          </div>
          <div class="col-6 col-md-3">
            <div class="text-center">
              <div class="text-h4">{{ reports.walkIns.conversionRate }}%</div>
              <div class="text-caption text-grey-7">Conversion Rate</div>
            </div>
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { api } from 'boot/axios';

const isLoading = ref(false);

const dateFrom = ref(
  new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
);
const dateTo = ref(new Date().toISOString().split('T')[0]);

const reports = reactive({
  utilization: 0,
  totalRentals: 0,
  byCategory: [] as { name: string; utilization: number }[],
  walkIns: {
    total: 0,
    converted: 0,
    lost: 0,
    conversionRate: 0,
  },
});

async function loadReports() {
  isLoading.value = true;
  try {
    const response = await api.get('/reports', {
      params: { from: dateFrom.value, to: dateTo.value },
    });
    Object.assign(reports, response.data);
  } catch (error) {
    console.error('Failed to load reports:', error);
    // Use mock data for now
    reports.utilization = 72;
    reports.totalRentals = 156;
    reports.byCategory = [
      { name: 'Category A', utilization: 85 },
      { name: 'Category B', utilization: 78 },
      { name: 'SUV', utilization: 65 },
      { name: 'Luxury', utilization: 45 },
    ];
    reports.walkIns = {
      total: 48,
      converted: 32,
      lost: 12,
      conversionRate: 67,
    };
  } finally {
    isLoading.value = false;
  }
}

onMounted(() => {
  loadReports();
});
</script>
