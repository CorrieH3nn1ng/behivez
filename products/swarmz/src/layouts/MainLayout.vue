<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-btn flat dense round icon="menu" aria-label="Menu" @click="toggleDrawer" />
        <q-toolbar-title>{{ authStore.user?.fleetName || 'Swarmz' }}</q-toolbar-title>
        <q-btn flat round icon="person" @click="$router.push('/profile')" />
      </q-toolbar>
    </q-header>

    <q-drawer v-model="drawerOpen" show-if-above bordered>
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

        <q-item v-if="authStore.isFleetPlan" clickable v-ripple to="/drivers">
          <q-item-section avatar><q-icon name="group" /></q-item-section>
          <q-item-section>Drivers</q-item-section>
        </q-item>

        <q-separator spaced />

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
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from 'stores/auth';

const router = useRouter();
const authStore = useAuthStore();
const drawerOpen = ref(false);

function toggleDrawer() { drawerOpen.value = !drawerOpen.value; }

async function logout() {
  await authStore.logout();
  router.push({ name: 'login' });
}
</script>
