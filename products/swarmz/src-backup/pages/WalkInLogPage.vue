<template>
  <q-page padding>
    <div class="text-h5 q-mb-md">Walk-In Log</div>

    <q-card class="q-mb-lg">
      <q-card-section>
        <q-form @submit="submitWalkIn">
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <q-input
                v-model="form.customerName"
                label="Customer Name"
                outlined
                :rules="[val => !!val || 'Name is required']"
              />
            </div>
            <div class="col-12 col-md-6">
              <q-input
                v-model="form.phone"
                label="Phone Number"
                outlined
              />
            </div>
            <div class="col-12 col-md-6">
              <q-select
                v-model="form.categoryRequested"
                label="Category Requested"
                :options="categoryOptions"
                outlined
                emit-value
                map-options
              />
            </div>
            <div class="col-6 col-md-3">
              <q-input
                v-model="form.startDate"
                label="Start Date"
                type="date"
                outlined
              />
            </div>
            <div class="col-6 col-md-3">
              <q-input
                v-model="form.endDate"
                label="End Date"
                type="date"
                outlined
              />
            </div>
            <div class="col-12">
              <q-input
                v-model="form.notes"
                label="Notes"
                type="textarea"
                outlined
                rows="2"
              />
            </div>
            <div class="col-12 col-md-6">
              <q-select
                v-model="form.outcome"
                label="Outcome"
                :options="outcomeOptions"
                outlined
                emit-value
                map-options
              />
            </div>
            <div class="col-12 col-md-6">
              <q-input
                v-model="form.lostReason"
                v-if="form.outcome === 'LOST'"
                label="Reason Lost"
                outlined
              />
            </div>
          </div>

          <q-btn
            type="submit"
            color="primary"
            class="q-mt-md"
            :loading="isSubmitting"
          >
            Log Walk-In
          </q-btn>
        </q-form>
      </q-card-section>
    </q-card>

    <!-- Recent Walk-Ins -->
    <div class="text-h6 q-mb-sm">Today's Walk-Ins</div>
    <q-card>
      <q-list separator>
        <q-item v-for="item in recentWalkIns" :key="item.id">
          <q-item-section>
            <q-item-label>{{ item.customerName }}</q-item-label>
            <q-item-label caption>
              {{ item.categoryRequested }} | {{ item.startDate }} - {{ item.endDate }}
            </q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-badge
              :color="item.outcome === 'CONVERTED' ? 'positive' : item.outcome === 'LOST' ? 'negative' : 'grey'"
            >
              {{ item.outcome }}
            </q-badge>
          </q-item-section>
        </q-item>
        <q-item v-if="!recentWalkIns.length">
          <q-item-section class="text-center text-grey-6">
            No walk-ins logged today
          </q-item-section>
        </q-item>
      </q-list>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { api } from 'boot/axios';
import { useSyncStore } from 'stores/sync';

const $q = useQuasar();
const syncStore = useSyncStore();

const isSubmitting = ref(false);
const recentWalkIns = ref<any[]>([]);

const form = reactive({
  customerName: '',
  phone: '',
  categoryRequested: '',
  startDate: '',
  endDate: '',
  notes: '',
  outcome: 'PENDING',
  lostReason: '',
});

const categoryOptions = [
  { label: 'Category A (Economy)', value: 'CAT_A' },
  { label: 'Category B (Compact)', value: 'CAT_B' },
  { label: 'Category C (Sedan)', value: 'CAT_C' },
  { label: 'SUV', value: 'SUV' },
  { label: 'Luxury', value: 'LUXURY' },
];

const outcomeOptions = [
  { label: 'Pending', value: 'PENDING' },
  { label: 'Converted to Booking', value: 'CONVERTED' },
  { label: 'Lost - No Availability', value: 'LOST' },
  { label: 'Left Without Booking', value: 'LEFT' },
];

async function submitWalkIn() {
  isSubmitting.value = true;

  try {
    if (syncStore.isOnline) {
      await api.post('/walkins', form);
    } else {
      await syncStore.queueOperation({
        operation: 'CREATE',
        entityType: 'walkin',
        entityId: crypto.randomUUID(),
        data: { ...form },
      });
    }

    $q.notify({
      type: 'positive',
      message: 'Walk-in logged successfully',
    });

    // Reset form
    Object.assign(form, {
      customerName: '',
      phone: '',
      categoryRequested: '',
      startDate: '',
      endDate: '',
      notes: '',
      outcome: 'PENDING',
      lostReason: '',
    });

    loadRecentWalkIns();
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: 'Failed to log walk-in',
    });
  } finally {
    isSubmitting.value = false;
  }
}

async function loadRecentWalkIns() {
  try {
    const response = await api.get('/walkins', {
      params: { date: new Date().toISOString().split('T')[0] }
    });
    recentWalkIns.value = response.data;
  } catch {
    // Ignore errors
  }
}

onMounted(() => {
  const today = new Date().toISOString().split('T')[0];
  form.startDate = today;
  form.endDate = today;
  loadRecentWalkIns();
});
</script>
