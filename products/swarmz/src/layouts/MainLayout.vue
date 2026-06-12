<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-btn v-if="!isOnboarding" flat dense round icon="menu" aria-label="Menu" @click="toggleDrawer" />
        <q-btn flat dense no-caps to="/" class="q-mr-sm text-white">
          <img src="/favicon.svg" style="height:34px;width:auto;" class="q-mr-xs" alt="Swarmz" />
          <span class="text-weight-bold">{{ authStore.user?.fleetName || 'Swarmz' }}</span>
        </q-btn>
        <q-space />
        <q-btn v-if="!isOnboarding" flat round icon="person" @click="$router.push('/profile')" />
      </q-toolbar>
    </q-header>

    <q-drawer v-if="!isOnboarding" v-model="drawerOpen" show-if-above bordered>
      <q-list>
        <q-item-label header class="text-weight-bold">Menu</q-item-label>

        <q-item clickable v-ripple to="/" exact>
          <q-item-section avatar><q-icon name="dashboard" /></q-item-section>
          <q-item-section>Dashboard</q-item-section>
        </q-item>

        <q-item clickable v-ripple to="/vehicle/add">
          <q-item-section avatar><q-icon name="add_circle" /></q-item-section>
          <q-item-section>Add Vehicle</q-item-section>
        </q-item>

        <!-- Tax & Logbook — only when the user has switched the module on -->
        <q-item v-if="settingsStore.modules.tax" clickable v-ripple to="/tax-report">
          <q-item-section avatar><q-icon name="receipt_long" /></q-item-section>
          <q-item-section>Tax &amp; Logbook</q-item-section>
        </q-item>

        <!-- Drivers — only when the Fleet module is on -->
        <q-item v-if="settingsStore.modules.fleet" clickable v-ripple to="/drivers">
          <q-item-section avatar><q-icon name="group" /></q-item-section>
          <q-item-section>Drivers</q-item-section>
        </q-item>

        <q-separator spaced />

        <q-item clickable v-ripple to="/settings">
          <q-item-section avatar><q-icon name="tune" /></q-item-section>
          <q-item-section>Settings</q-item-section>
        </q-item>

        <q-item clickable v-ripple to="/profile">
          <q-item-section avatar><q-icon name="person" /></q-item-section>
          <q-item-section>Profile</q-item-section>
        </q-item>

        <q-item clickable v-ripple @click="logout">
          <q-item-section avatar><q-icon name="logout" color="negative" /></q-item-section>
          <q-item-section class="text-negative">Logout</q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from 'stores/auth';
import { useSettingsStore } from 'stores/settings';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const settingsStore = useSettingsStore();
const drawerOpen = ref(false);

const isOnboarding = computed(() => route.name === 'onboarding');

function toggleDrawer() { drawerOpen.value = !drawerOpen.value; }

async function logout() {
  await authStore.logout();
  router.push({ name: 'login' });
}
</script>
