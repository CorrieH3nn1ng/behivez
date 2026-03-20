<template>
  <q-layout view="lHh Lpr lFf">
    <q-header class="bg-dark text-white" bordered>
      <q-toolbar>
        <q-btn flat dense round icon="menu" aria-label="Menu" @click="toggleLeftDrawer" />
        <q-btn flat dense no-caps to="/" class="text-amber q-mr-sm">
          <q-icon name="hive" size="28px" class="q-mr-xs" />
          <span class="text-weight-bold text-h6">Pollenz</span>
        </q-btn>
        <q-space />
        <q-btn flat round icon="person">
          <q-menu>
            <q-list style="min-width: 180px">
              <q-item-label header>{{ userStore.user?.name }}</q-item-label>
              <q-item clickable v-close-popup @click="$router.push('/settings')">
                <q-item-section avatar><q-icon name="settings" /></q-item-section>
                <q-item-section>Settings</q-item-section>
              </q-item>
              <q-separator />
              <q-item clickable v-close-popup @click="handleLogout">
                <q-item-section avatar><q-icon name="logout" /></q-item-section>
                <q-item-section>Logout</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" show-if-above bordered>
      <q-list>
        <q-item-label header class="text-weight-bold">Navigation</q-item-label>

        <q-item clickable v-ripple to="/" exact>
          <q-item-section avatar><q-icon name="dashboard" /></q-item-section>
          <q-item-section>Dashboard</q-item-section>
        </q-item>

        <q-separator spaced />
        <q-item-label header>Finance</q-item-label>

        <!-- Freelancer: Income (Invoices) -->
        <q-item v-if="isFreelancer" clickable v-ripple to="/income">
          <q-item-section avatar><q-icon name="trending_up" /></q-item-section>
          <q-item-section>Income</q-item-section>
        </q-item>

        <!-- Salary: Payslips (Income) -->
        <q-item v-if="isSalary" clickable v-ripple to="/salary-profile">
          <q-item-section avatar><q-icon name="account_balance_wallet" /></q-item-section>
          <q-item-section>Payslips</q-item-section>
        </q-item>

        <q-item clickable v-ripple to="/expenses">
          <q-item-section avatar><q-icon name="trending_down" /></q-item-section>
          <q-item-section>Expenses</q-item-section>
        </q-item>

        <!-- Freelancer only: Clients -->
        <q-item v-if="isFreelancer" clickable v-ripple to="/clients">
          <q-item-section avatar><q-icon name="people" /></q-item-section>
          <q-item-section>Clients</q-item-section>
        </q-item>

        <q-item clickable v-ripple to="/import">
          <q-item-section avatar><q-icon name="upload_file" /></q-item-section>
          <q-item-section>Import Statement</q-item-section>
        </q-item>

        <q-item clickable v-ripple to="/travel">
          <q-item-section avatar><q-icon name="directions_car" /></q-item-section>
          <q-item-section>Travel Expenses</q-item-section>
        </q-item>

        <q-separator spaced />
        <q-item-label header>Profile</q-item-label>

        <!-- Freelancer: Business Profile -->
        <q-item v-if="isFreelancer" clickable v-ripple to="/business-profile">
          <q-item-section avatar><q-icon name="business" /></q-item-section>
          <q-item-section>Business Profile</q-item-section>
        </q-item>

        <q-item clickable v-ripple to="/settings">
          <q-item-section avatar><q-icon name="settings" /></q-item-section>
          <q-item-section>Settings</q-item-section>
        </q-item>
      </q-list>

      <!-- Prompt to choose profile type if not set -->
      <div v-if="!profileType" class="q-pa-md">
        <q-banner rounded class="bg-amber-1 text-amber-10">
          <template v-slot:avatar>
            <q-icon name="info" color="amber" />
          </template>
          Set your profile type in
          <router-link to="/settings" class="text-primary text-weight-bold">Settings</router-link>
          to see relevant features.
        </q-banner>
      </div>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>

    <q-footer class="bg-dark text-grey-5 q-pa-md text-center" style="font-size: 12px;">
      <div>Pollenz &copy; {{ new Date().getFullYear() }} &mdash; Smart finance for SA entrepreneurs</div>
      <div class="q-mt-xs">A <span class="text-amber">BeHivez</span> Product</div>
    </q-footer>
  </q-layout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user.store';

const userStore = useUserStore();
const router = useRouter();
const leftDrawerOpen = ref(false);

const profileType = computed(() => userStore.user?.profile_type);
const isFreelancer = computed(() => !profileType.value || profileType.value === 'freelancer');
const isSalary = computed(() => !profileType.value || profileType.value === 'salary');

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}

async function handleLogout() {
  await userStore.logout();
  router.push('/login');
}
</script>
