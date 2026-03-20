<template>
  <q-page padding>
    <q-btn flat icon="arrow_back" label="Back" @click="$router.back()" class="q-mb-md" />

    <div class="text-h5 q-mb-md">Checkout Process</div>

    <!-- Stepper -->
    <q-stepper v-model="step" vertical animated>
      <!-- Step 1: Customer Verification -->
      <q-step
        :name="1"
        title="Customer Verification"
        icon="person"
        :done="step > 1"
      >
        <div class="q-mb-md">
          <div class="text-subtitle2 q-mb-sm">Customer Details</div>
          <div><strong>Name:</strong> {{ rental?.customerName }}</div>
          <div><strong>Booking:</strong> {{ rental?.bookingRef }}</div>
        </div>
        <q-checkbox v-model="customerVerified" label="Customer ID verified" />
        <q-stepper-navigation>
          <q-btn color="primary" label="Continue" :disable="!customerVerified" @click="step = 2" />
        </q-stepper-navigation>
      </q-step>

      <!-- Step 2: Vehicle Selection -->
      <q-step
        :name="2"
        title="Select Vehicle"
        icon="directions_car"
        :done="step > 2"
      >
        <div class="text-subtitle2 q-mb-md">Available {{ rental?.categoryName }} vehicles:</div>
        <q-list bordered separator>
          <q-item
            v-for="v in availableVehicles"
            :key="v.id"
            clickable
            :active="selectedVehicle?.id === v.id"
            @click="selectedVehicle = v"
          >
            <q-item-section>
              <q-item-label>{{ v.registration }}</q-item-label>
              <q-item-label caption>{{ v.make }} {{ v.model }} - {{ v.color }}</q-item-label>
            </q-item-section>
            <q-item-section side v-if="selectedVehicle?.id === v.id">
              <q-icon name="check_circle" color="positive" />
            </q-item-section>
          </q-item>
        </q-list>
        <q-stepper-navigation>
          <q-btn color="primary" label="Continue" :disable="!selectedVehicle" @click="step = 3" />
          <q-btn flat label="Back" @click="step = 1" />
        </q-stepper-navigation>
      </q-step>

      <!-- Step 3: Vehicle Inspection -->
      <q-step
        :name="3"
        title="Vehicle Inspection"
        icon="camera_alt"
        :done="step > 3"
      >
        <div class="text-subtitle2 q-mb-md">Take inspection photos:</div>
        <div class="row q-col-gutter-sm q-mb-md">
          <div v-for="pos in photoPositions" :key="pos.id" class="col-4 col-md-3">
            <q-card>
              <q-img
                v-if="photos[pos.id]"
                :src="photos[pos.id]"
                :ratio="4/3"
              />
              <div v-else class="bg-grey-3 flex flex-center" style="aspect-ratio: 4/3">
                <q-icon name="add_a_photo" size="32px" color="grey-6" />
              </div>
              <q-card-section class="text-center q-py-sm">
                <div class="text-caption">{{ pos.label }}</div>
              </q-card-section>
            </q-card>
          </div>
        </div>

        <q-input
          v-model.number="odometer"
          type="number"
          label="Odometer Reading"
          outlined
          class="q-mb-md"
        />

        <q-slider
          v-model="fuelLevel"
          :min="0"
          :max="100"
          :step="12.5"
          label
          label-always
          class="q-mb-md"
        />
        <div class="text-caption text-grey-7 q-mb-md">Fuel Level: {{ fuelLevel }}%</div>

        <q-stepper-navigation>
          <q-btn color="primary" label="Continue" @click="step = 4" />
          <q-btn flat label="Back" @click="step = 2" />
        </q-stepper-navigation>
      </q-step>

      <!-- Step 4: Signature -->
      <q-step
        :name="4"
        title="Customer Signature"
        icon="draw"
      >
        <div class="text-subtitle2 q-mb-md">Customer signature:</div>
        <div class="signature-container q-mb-md" style="height: 200px">
          <!-- Signature pad component would go here -->
          <div class="flex flex-center" style="height: 100%">
            <q-icon name="draw" size="48px" color="grey-6" />
          </div>
        </div>
        <q-stepper-navigation>
          <q-btn color="primary" label="Complete Checkout" @click="completeCheckout" />
          <q-btn flat label="Back" @click="step = 3" />
        </q-stepper-navigation>
      </q-step>
    </q-stepper>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useRentalsStore } from 'stores/rentals';
import { useVehiclesStore } from 'stores/vehicles';

const route = useRoute();
const router = useRouter();
const rentalsStore = useRentalsStore();
const vehiclesStore = useVehiclesStore();

const step = ref(1);
const customerVerified = ref(false);
const selectedVehicle = ref<any>(null);
const odometer = ref(0);
const fuelLevel = ref(100);
const photos = ref<Record<string, string>>({});

const rental = computed(() => rentalsStore.currentRental);
const availableVehicles = computed(() =>
  vehiclesStore.availableVehicles.filter(v => v.categoryId === rental.value?.categoryId)
);

const photoPositions = [
  { id: 'front', label: 'Front' },
  { id: 'rear', label: 'Rear' },
  { id: 'left', label: 'Left Side' },
  { id: 'right', label: 'Right Side' },
  { id: 'front_left', label: 'Front Left' },
  { id: 'front_right', label: 'Front Right' },
  { id: 'rear_left', label: 'Rear Left' },
  { id: 'rear_right', label: 'Rear Right' },
  { id: 'interior_front', label: 'Interior Front' },
  { id: 'interior_rear', label: 'Interior Rear' },
  { id: 'odometer', label: 'Odometer' },
  { id: 'fuel', label: 'Fuel Gauge' },
];

async function completeCheckout() {
  // TODO: Implement checkout completion
  router.push('/');
}

onMounted(async () => {
  const bookingRef = route.params.bookingRef as string;
  await rentalsStore.findByBookingRef(bookingRef);
  await vehiclesStore.fetchVehicles();

  if (selectedVehicle.value) {
    odometer.value = selectedVehicle.value.odometer;
  }
});
</script>
