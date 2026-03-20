<template>
  <q-page padding>
    <div class="text-h5 q-mb-md">Rentals</div>

    <!-- Filters -->
    <q-card class="q-mb-md">
      <q-card-section class="q-pb-none">
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-4">
            <q-input
              v-model="rentalsStore.filters.search"
              label="Search"
              outlined
              dense
              clearable
            >
              <template v-slot:prepend>
                <q-icon name="search" />
              </template>
            </q-input>
          </div>
          <div class="col-6 col-md-4">
            <q-select
              v-model="rentalsStore.filters.status"
              label="Status"
              :options="statusOptions"
              outlined
              dense
              clearable
              emit-value
              map-options
            />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Loading -->
    <div v-if="rentalsStore.isLoading" class="text-center q-pa-lg">
      <q-spinner color="primary" size="48px" />
    </div>

    <!-- Rentals List -->
    <q-card v-else>
      <q-list separator>
        <q-item
          v-for="rental in rentalsStore.filteredRentals"
          :key="rental.id"
          clickable
          @click="$router.push(`/rentals/${rental.id}`)"
        >
          <q-item-section avatar>
            <q-avatar color="grey-3">
              <q-icon name="assignment" color="grey-7" />
            </q-avatar>
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ rental.bookingRef }}</q-item-label>
            <q-item-label caption>
              {{ rental.customerName }} | {{ rental.vehicleRegistration || rental.categoryName }}
            </q-item-label>
            <q-item-label caption>
              {{ formatDate(rental.startDate) }} - {{ formatDate(rental.endDate) }}
            </q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-badge
              :color="statusColor(rental.status)"
            >
              {{ rental.status }}
            </q-badge>
            <q-icon
              v-if="rental.hasDamage"
              name="warning"
              color="negative"
              class="q-mt-xs"
            />
          </q-item-section>
        </q-item>
      </q-list>
    </q-card>

    <!-- Empty State -->
    <div
      v-if="!rentalsStore.isLoading && rentalsStore.filteredRentals.length === 0"
      class="text-center q-pa-lg text-grey-6"
    >
      <q-icon name="search_off" size="64px" />
      <div class="text-h6 q-mt-md">No rentals found</div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRentalsStore, RentalStatus } from 'stores/rentals';

const rentalsStore = useRentalsStore();

const statusOptions = [
  { label: 'Reserved', value: 'RESERVED' },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Cancelled', value: 'CANCELLED' },
];

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
  rentalsStore.fetchRentals();
});
</script>
