<template>
  <q-page padding>
    <div class="text-h5 q-mb-md">Vehicle Checkout</div>

    <q-card class="q-mb-lg">
      <q-card-section>
        <q-form @submit="lookupBooking">
          <q-input
            v-model="bookingRef"
            label="Booking Reference"
            outlined
            class="q-mb-md"
            :rules="[val => !!val || 'Booking reference is required']"
          >
            <template v-slot:prepend>
              <q-icon name="confirmation_number" />
            </template>
          </q-input>

          <q-btn
            type="submit"
            color="primary"
            :loading="isLoading"
            class="full-width"
          >
            Look Up Booking
          </q-btn>
        </q-form>
      </q-card-section>
    </q-card>

    <!-- Booking Details -->
    <q-card v-if="rental" class="q-mb-lg">
      <q-card-section>
        <div class="text-h6">Booking Found</div>
      </q-card-section>
      <q-separator />
      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-6">
            <div class="text-caption text-grey-7">Customer</div>
            <div class="text-subtitle1">{{ rental.customerName }}</div>
          </div>
          <div class="col-6">
            <div class="text-caption text-grey-7">Booking Ref</div>
            <div class="text-subtitle1">{{ rental.bookingRef }}</div>
          </div>
          <div class="col-6">
            <div class="text-caption text-grey-7">Category</div>
            <div class="text-subtitle1">{{ rental.categoryName }}</div>
          </div>
          <div class="col-6">
            <div class="text-caption text-grey-7">Dates</div>
            <div class="text-subtitle1">
              {{ formatDate(rental.startDate) }} - {{ formatDate(rental.endDate) }}
            </div>
          </div>
        </div>
      </q-card-section>
      <q-separator />
      <q-card-actions>
        <q-btn
          color="primary"
          class="full-width"
          @click="$router.push(`/checkout/${rental.bookingRef}`)"
        >
          Start Checkout Process
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
import { useRentalsStore } from 'stores/rentals';

const rentalsStore = useRentalsStore();

const bookingRef = ref('');
const isLoading = ref(false);
const error = ref('');
const rental = ref<any>(null);

async function lookupBooking() {
  error.value = '';
  rental.value = null;
  isLoading.value = true;

  try {
    rental.value = await rentalsStore.findByBookingRef(bookingRef.value);
    if (rental.value.status !== 'RESERVED') {
      error.value = `This booking is ${rental.value.status.toLowerCase()}. Only reserved bookings can be checked out.`;
      rental.value = null;
    }
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Booking not found';
  } finally {
    isLoading.value = false;
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString();
}
</script>
