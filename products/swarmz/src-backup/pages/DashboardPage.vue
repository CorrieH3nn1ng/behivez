<template>
  <q-page padding>
    <div class="text-h5 q-mb-md">Dashboard</div>

    <!-- Stats Cards -->
    <div class="row q-col-gutter-md q-mb-lg">
      <div class="col-6 col-md-3">
        <q-card>
          <q-card-section>
            <div class="text-subtitle2 text-grey-7">Ready Vehicles</div>
            <div class="text-h4 text-positive">{{ stats.ready }}</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-6 col-md-3">
        <q-card>
          <q-card-section>
            <div class="text-subtitle2 text-grey-7">Out on Rental</div>
            <div class="text-h4 text-primary">{{ stats.out }}</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-6 col-md-3">
        <q-card>
          <q-card-section>
            <div class="text-subtitle2 text-grey-7">Returned Today</div>
            <div class="text-h4 text-warning">{{ stats.returned }}</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-6 col-md-3">
        <q-card>
          <q-card-section>
            <div class="text-subtitle2 text-grey-7">In Workshop</div>
            <div class="text-h4 text-negative">{{ stats.workshop }}</div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="text-h6 q-mb-sm">Quick Actions</div>
    <div class="row q-col-gutter-md q-mb-lg">
      <div class="col-6 col-md-3">
        <q-card clickable v-ripple class="cursor-pointer" @click="$router.push('/checkout')">
          <q-card-section class="text-center">
            <q-icon name="logout" size="48px" color="primary" />
            <div class="text-subtitle1 q-mt-sm">Vehicle Checkout</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-6 col-md-3">
        <q-card clickable v-ripple class="cursor-pointer" @click="$router.push('/return')">
          <q-card-section class="text-center">
            <q-icon name="login" size="48px" color="secondary" />
            <div class="text-subtitle1 q-mt-sm">Vehicle Return</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-6 col-md-3">
        <q-card clickable v-ripple class="cursor-pointer" @click="$router.push('/status-board')">
          <q-card-section class="text-center">
            <q-icon name="grid_view" size="48px" color="accent" />
            <div class="text-subtitle1 q-mt-sm">Status Board</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-6 col-md-3">
        <q-card clickable v-ripple class="cursor-pointer" @click="$router.push('/walk-in')">
          <q-card-section class="text-center">
            <q-icon name="person_add" size="48px" color="info" />
            <div class="text-subtitle1 q-mt-sm">Log Walk-In</div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Today's Returns -->
    <div class="text-h6 q-mb-sm">Today's Expected Returns</div>
    <q-card class="q-mb-lg">
      <q-list separator v-if="todayReturns.length">
        <q-item
          v-for="rental in todayReturns"
          :key="rental.id"
          clickable
          @click="$router.push(`/return/${rental.id}`)"
        >
          <q-item-section avatar>
            <q-icon name="directions_car" color="primary" />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ rental.vehicleRegistration }}</q-item-label>
            <q-item-label caption>{{ rental.customerName }}</q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-item-label caption>{{ rental.bookingRef }}</q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-icon name="chevron_right" />
          </q-item-section>
        </q-item>
      </q-list>
      <q-card-section v-else class="text-center text-grey-6">
        No returns expected today
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useVehiclesStore } from 'stores/vehicles';
import { useRentalsStore } from 'stores/rentals';

const vehiclesStore = useVehiclesStore();
const rentalsStore = useRentalsStore();

const stats = computed(() => ({
  ready: vehiclesStore.vehiclesByStatus.READY.length,
  out: vehiclesStore.vehiclesByStatus.OUT.length,
  returned: vehiclesStore.vehiclesByStatus.RETURNED.length,
  workshop: vehiclesStore.vehiclesByStatus.WORKSHOP.length,
}));

const todayReturns = computed(() => rentalsStore.todayReturns);

onMounted(async () => {
  await Promise.all([
    vehiclesStore.fetchVehicles(),
    rentalsStore.fetchRentals(),
  ]);
});
</script>
