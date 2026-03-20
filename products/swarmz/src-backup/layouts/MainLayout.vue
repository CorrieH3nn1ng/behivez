<template>
  <q-layout view="lHh Lpr lFf">
    <!-- Offline Banner -->
    <div v-if="!syncStore.isOnline" class="offline-banner">
      You are offline. Changes will sync when connected.
      <span v-if="syncStore.pendingCount > 0">
        ({{ syncStore.pendingCount }} pending)
      </span>
    </div>

    <q-header elevated>
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="toggleLeftDrawer"
        />

        <q-toolbar-title>
          Swarmz
        </q-toolbar-title>

        <!-- Sync indicator -->
        <q-btn
          v-if="syncStore.hasPendingSync"
          flat
          round
          icon="sync"
          :loading="syncStore.isSyncing"
          @click="syncStore.syncAll()"
        >
          <q-badge color="warning" floating>{{ syncStore.pendingCount }}</q-badge>
        </q-btn>

        <q-btn flat round icon="person">
          <q-menu>
            <q-list style="min-width: 200px">
              <q-item-label header>{{ authStore.fullName }}</q-item-label>
              <q-item clickable v-close-popup @click="logout">
                <q-item-section avatar>
                  <q-icon name="logout" />
                </q-item-section>
                <q-item-section>Logout</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      bordered
    >
      <q-list>
        <q-item-label header>Operations</q-item-label>

        <q-item clickable v-ripple to="/" exact>
          <q-item-section avatar>
            <q-icon name="dashboard" />
          </q-item-section>
          <q-item-section>Dashboard</q-item-section>
        </q-item>

        <q-item clickable v-ripple to="/checkout">
          <q-item-section avatar>
            <q-icon name="logout" />
          </q-item-section>
          <q-item-section>Vehicle Checkout</q-item-section>
        </q-item>

        <q-item clickable v-ripple to="/return">
          <q-item-section avatar>
            <q-icon name="login" />
          </q-item-section>
          <q-item-section>Vehicle Return</q-item-section>
        </q-item>

        <q-item clickable v-ripple to="/status-board">
          <q-item-section avatar>
            <q-icon name="grid_view" />
          </q-item-section>
          <q-item-section>Status Board</q-item-section>
        </q-item>

        <q-item clickable v-ripple to="/walk-in">
          <q-item-section avatar>
            <q-icon name="person_add" />
          </q-item-section>
          <q-item-section>Walk-In Log</q-item-section>
        </q-item>

        <q-separator spaced />

        <q-item-label header>Fleet</q-item-label>

        <q-item clickable v-ripple to="/vehicles">
          <q-item-section avatar>
            <q-icon name="directions_car" />
          </q-item-section>
          <q-item-section>Vehicles</q-item-section>
        </q-item>

        <q-item clickable v-ripple to="/rentals">
          <q-item-section avatar>
            <q-icon name="assignment" />
          </q-item-section>
          <q-item-section>Rentals</q-item-section>
        </q-item>

        <q-separator spaced v-if="authStore.isManager" />

        <template v-if="authStore.isManager">
          <q-item-label header>Management</q-item-label>

          <q-item clickable v-ripple to="/reports">
            <q-item-section avatar>
              <q-icon name="analytics" />
            </q-item-section>
            <q-item-section>Reports</q-item-section>
          </q-item>
        </template>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from 'stores/auth';
import { useSyncStore } from 'stores/sync';

const router = useRouter();
const authStore = useAuthStore();
const syncStore = useSyncStore();

const leftDrawerOpen = ref(false);

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}

async function logout() {
  await authStore.logout();
  router.push('/login');
}

onMounted(() => {
  authStore.fetchUser();
  syncStore.initializeNetworkListener();
  syncStore.updatePendingCount();
});
</script>
