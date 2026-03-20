<template>
  <q-page padding>
    <div class="row items-center q-mb-md">
      <div class="col">
        <div class="text-h5 text-weight-bold">Drivers</div>
        <div class="text-caption text-grey-7">{{ driversStore.activeDrivers.length }} active</div>
      </div>
      <q-btn color="primary" icon="person_add" label="Invite" @click="showInvite = true" />
    </div>

    <q-list v-if="driversStore.drivers.length" separator>
      <q-item v-for="driver in driversStore.drivers" :key="driver.id">
        <q-item-section avatar>
          <q-avatar color="primary" text-color="white">{{ driver.name.charAt(0) }}</q-avatar>
        </q-item-section>
        <q-item-section>
          <q-item-label>{{ driver.name }}</q-item-label>
          <q-item-label caption>{{ driver.email }}</q-item-label>
          <q-item-label caption v-if="driver.assignedVehicleIds.length">
            {{ driver.assignedVehicleIds.length }} vehicle(s) assigned
          </q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-badge :color="driver.inviteStatus === 'accepted' ? 'positive' : 'warning'">
            {{ driver.inviteStatus }}
          </q-badge>
        </q-item-section>
        <q-item-section side>
          <q-btn flat round icon="delete" color="negative" size="sm" @click="driversStore.removeDriver(driver.id)" />
        </q-item-section>
      </q-item>
    </q-list>

    <div v-else class="text-center q-pa-xl">
      <q-icon name="group" size="48px" color="grey-4" />
      <div class="text-subtitle1 text-grey-5 q-mt-md">No drivers yet</div>
    </div>

    <!-- Invite dialog -->
    <q-dialog v-model="showInvite">
      <q-card style="width: 360px;">
        <q-card-section><div class="text-h6">Invite Driver</div></q-card-section>
        <q-card-section>
          <q-input v-model="inviteName" label="Name" outlined class="q-mb-sm" />
          <q-input v-model="inviteEmail" label="Email" type="email" outlined />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn color="primary" label="Send Invite" @click="sendInvite" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useDriversStore } from 'stores/drivers';

const driversStore = useDriversStore();
const showInvite = ref(false);
const inviteName = ref('');
const inviteEmail = ref('');

function sendInvite() {
  if (inviteName.value && inviteEmail.value) {
    driversStore.inviteDriver(inviteName.value, inviteEmail.value);
    inviteName.value = '';
    inviteEmail.value = '';
    showInvite.value = false;
  }
}

onMounted(() => driversStore.fetchDrivers());
</script>
