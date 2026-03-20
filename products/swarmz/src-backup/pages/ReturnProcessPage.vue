<template>
  <q-page padding>
    <q-btn flat icon="arrow_back" label="Back" @click="$router.back()" class="q-mb-md" />

    <div class="text-h5 q-mb-md">Return Process</div>

    <div v-if="rental" class="text-subtitle1 q-mb-md">
      {{ rental.vehicleRegistration }} - {{ rental.customerName }}
    </div>

    <!-- Stepper -->
    <q-stepper v-model="step" vertical animated>
      <!-- Step 1: Vehicle Inspection -->
      <q-step
        :name="1"
        title="Return Inspection"
        icon="camera_alt"
        :done="step > 1"
      >
        <div class="text-subtitle2 q-mb-md">Take return inspection photos:</div>
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

        <q-stepper-navigation>
          <q-btn color="primary" label="Continue" @click="step = 2" />
        </q-stepper-navigation>
      </q-step>

      <!-- Step 2: Damage Comparison -->
      <q-step
        :name="2"
        title="Damage Check"
        icon="compare"
        :done="step > 2"
      >
        <div class="text-subtitle2 q-mb-md">Compare with checkout inspection:</div>

        <q-checkbox v-model="noDamage" label="No new damage found" class="q-mb-md" />

        <q-input
          v-if="!noDamage"
          v-model="damageNotes"
          type="textarea"
          label="Damage Description"
          outlined
          class="q-mb-md"
        />

        <q-stepper-navigation>
          <q-btn color="primary" label="Continue" @click="step = 3" />
          <q-btn flat label="Back" @click="step = 1" />
        </q-stepper-navigation>
      </q-step>

      <!-- Step 3: Odometer & Fuel -->
      <q-step
        :name="3"
        title="Readings"
        icon="speed"
        :done="step > 3"
      >
        <q-input
          v-model.number="odometer"
          type="number"
          label="Odometer Reading"
          outlined
          class="q-mb-md"
          :hint="`Checkout: ${rental?.checkoutOdometer || 'N/A'} km`"
        />

        <div class="text-subtitle2 q-mb-sm">Fuel Level</div>
        <q-slider
          v-model="fuelLevel"
          :min="0"
          :max="100"
          :step="12.5"
          label
          label-always
          class="q-mb-md"
        />
        <div class="text-caption text-grey-7 q-mb-md">
          Checkout fuel: {{ rental?.checkoutFuel || 'N/A' }}%
        </div>

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
        <div class="text-subtitle2 q-mb-md">Customer signature confirming return:</div>
        <div class="signature-container q-mb-md" style="height: 200px">
          <div class="flex flex-center" style="height: 100%">
            <q-icon name="draw" size="48px" color="grey-6" />
          </div>
        </div>
        <q-stepper-navigation>
          <q-btn color="primary" label="Complete Return" @click="completeReturn" />
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

const route = useRoute();
const router = useRouter();
const rentalsStore = useRentalsStore();

const step = ref(1);
const noDamage = ref(true);
const damageNotes = ref('');
const odometer = ref(0);
const fuelLevel = ref(100);
const photos = ref<Record<string, string>>({});

const rental = computed(() => rentalsStore.currentRental);

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

async function completeReturn() {
  // TODO: Implement return completion
  router.push('/');
}

onMounted(async () => {
  const rentalId = route.params.rentalId as string;
  await rentalsStore.fetchRental(rentalId);

  if (rental.value) {
    odometer.value = rental.value.checkoutOdometer || 0;
    fuelLevel.value = rental.value.checkoutFuel || 100;
  }
});
</script>
