<template>
  <q-page padding>
    <div class="text-h5 q-mb-md">Vehicle Return</div>

    <q-card class="q-mb-lg">
      <q-card-section>
        <q-form @submit="lookupVehicle">
          <q-input
            v-model="searchQuery"
            label="Vehicle Registration or Rental ID"
            outlined
            class="q-mb-md"
            :rules="[val => !!val || 'Search query is required']"
          >
            <template v-slot:prepend>
              <q-icon name="search" />
            </template>
          </q-input>

          <q-btn
            type="submit"
            color="primary"
            :loading="isLoading"
            class="full-width"
          >
            Find Rental
          </q-btn>
        </q-form>
      </q-card-section>
    </q-card>

    <!-- Rental Details -->
    <q-card v-if="rental" class="q-mb-lg">
      <q-card-section>
        <div class="text-h6">Rental Found</div>
      </q-card-section>
      <q-separator />
      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-6">
            <div class="text-caption text-grey-7">Vehicle</div>
            <div class="text-subtitle1">{{ rental.vehicleRegistration }}</div>
          </div>
          <div class="col-6">
            <div class="text-caption text-grey-7">Customer</div>
            <div class="text-subtitle1">{{ rental.customerName }}</div>
          </div>
          <div class="col-6">
            <div class="text-caption text-grey-7">Booking Ref</div>
            <div class="text-subtitle1">{{ rental.bookingRef }}</div>
          </div>
          <div class="col-6">
            <div class="text-caption text-grey-7">Expected Return</div>
            <div class="text-subtitle1">{{ formatDate(rental.endDate) }}</div>
          </div>
        </div>
      </q-card-section>
      <q-separator />
      <q-card-actions>
        <q-btn
          color="primary"
          class="full-width"
          @click="$router.push(`/return/${rental.id}`)"
        >
          Start Return Process
        </q-btn>
      </q-card-actions>
    </q-card>

    <!-- Error -->
    <q-banner v-if="error" class="bg-negative text-white q-mb-md">
      {{ error }}
    </q-banner>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { api } from 'boot/axios';

const searchQuery = ref('');
const isLoading = ref(false);
const error = ref('');
const rental = ref<any>(null);

async function lookupVehicle() {
  error.value = '';
  rental.value = null;
  isLoading.value = true;

  try {
    const response = await api.get(`/rentals/active`, {
      params: { search: searchQuery.value }
    });
    if (response.data.length === 0) {
      error.value = 'No active rental found for this vehicle';
    } else {
      rental.value = response.data[0];
    }
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Rental not found';
  } finally {
    isLoading.value = false;
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString();
}
</script>
