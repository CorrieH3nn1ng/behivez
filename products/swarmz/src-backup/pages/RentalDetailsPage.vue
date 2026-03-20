<template>
  <q-page padding>
    <q-btn flat icon="arrow_back" label="Back" @click="$router.back()" class="q-mb-md" />

    <div v-if="rentalsStore.isLoading" class="text-center q-pa-xl">
      <q-spinner color="primary" size="48px" />
    </div>

    <template v-else-if="rental">
      <q-card class="q-mb-md">
        <q-card-section>
          <div class="row items-center">
            <div class="text-h5">{{ rental.bookingRef }}</div>
            <q-space />
            <q-badge :color="statusColor(rental.status)" class="text-body2">
              {{ rental.status }}
            </q-badge>
          </div>
        </q-card-section>
        <q-separator />
        <q-card-section>
          <div class="row q-col-gutter-md">
            <div class="col-6 col-md-3">
              <div class="text-caption text-grey-7">Customer</div>
              <div>{{ rental.customerName }}</div>
            </div>
            <div class="col-6 col-md-3">
              <div class="text-caption text-grey-7">Category</div>
              <div>{{ rental.categoryName }}</div>
            </div>
            <div class="col-6 col-md-3">
              <div class="text-caption text-grey-7">Vehicle</div>
              <div>{{ rental.vehicleRegistration || 'Not assigned' }}</div>
            </div>
            <div class="col-6 col-md-3">
              <div class="text-caption text-grey-7">Branch</div>
              <div>{{ rental.branchName }}</div>
            </div>
            <div class="col-6 col-md-3">
              <div class="text-caption text-grey-7">Start Date</div>
              <div>{{ formatDate(rental.startDate) }}</div>
            </div>
            <div class="col-6 col-md-3">
              <div class="text-caption text-grey-7">End Date</div>
              <div>{{ formatDate(rental.endDate) }}</div>
            </div>
            <div class="col-6 col-md-3">
              <div class="text-caption text-grey-7">Checkout Odometer</div>
              <div>{{ rental.checkoutOdometer?.toLocaleString() || 'N/A' }} km</div>
            </div>
            <div class="col-6 col-md-3">
              <div class="text-caption text-grey-7">Return Odometer</div>
              <div>{{ rental.returnOdometer?.toLocaleString() || 'N/A' }} km</div>
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- Damage Alert -->
      <q-banner v-if="rental.hasDamage" class="bg-negative text-white q-mb-md">
        <template v-slot:avatar>
          <q-icon name="warning" />
        </template>
        This rental has damage recorded
      </q-banner>

      <!-- Actions -->
      <q-card v-if="rental.status === 'RESERVED'">
        <q-card-section>
          <q-btn
            color="primary"
            class="full-width"
            @click="$router.push(`/checkout/${rental.bookingRef}`)"
          >
            Start Checkout
          </q-btn>
        </q-card-section>
      </q-card>

      <q-card v-else-if="rental.status === 'ACTIVE'">
        <q-card-section>
          <q-btn
            color="primary"
            class="full-width"
            @click="$router.push(`/return/${rental.id}`)"
          >
            Process Return
          </q-btn>
        </q-card-section>
      </q-card>
    </template>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useRentalsStore, RentalStatus } from 'stores/rentals';

const route = useRoute();
const rentalsStore = useRentalsStore();

const rental = computed(() => rentalsStore.currentRental);

function statusColor(status: RentalStatus) {
  const colors: Record<RentalStatus, string> = {
    RESERVED: 'info',
    ACTIVE: 'primary',
    COMPLETED: 'positive',
    CANCELLED: 'grey',
  };
  return colors[status];
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString();
}

onMounted(() => {
  const id = route.params.id as string;
  rentalsStore.fetchRental(id);
});
</script>
