<template>
  <q-layout view="lHh Lpr lFf">
    <q-header class="bg-dark text-white" bordered>
      <q-toolbar>
        <q-btn flat dense round icon="menu" @click="drawer = !drawer" />
        <q-btn flat dense no-caps to="/admin/dashboard" class="text-amber q-mr-sm">
          <q-icon name="hive" size="28px" class="q-mr-xs" />
          <span class="text-weight-bold text-h6">BeHivez</span>
        </q-btn>
        <q-chip dense color="amber-8" text-color="white" class="q-ml-sm">Admin</q-chip>
        <q-space />
        <q-btn flat round icon="person">
          <q-menu>
            <q-list style="min-width: 180px">
              <q-item-label header>{{ userName }}</q-item-label>
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

    <q-drawer v-model="drawer" show-if-above bordered>
      <q-list>
        <q-item-label header class="text-weight-bold">Admin Panel</q-item-label>

        <q-item clickable v-ripple to="/admin/dashboard" exact>
          <q-item-section avatar><q-icon name="dashboard" /></q-item-section>
          <q-item-section>Dashboard</q-item-section>
        </q-item>

        <q-item clickable v-ripple to="/admin/users">
          <q-item-section avatar><q-icon name="people" /></q-item-section>
          <q-item-section>Users</q-item-section>
        </q-item>

        <q-item clickable v-ripple to="/admin/revenue">
          <q-item-section avatar><q-icon name="attach_money" /></q-item-section>
          <q-item-section>Revenue</q-item-section>
        </q-item>

        <q-item clickable v-ripple to="/admin/health">
          <q-item-section avatar><q-icon name="monitor_heart" /></q-item-section>
          <q-item-section>Health</q-item-section>
        </q-item>

        <q-separator spaced />
        <q-item-label header>Links</q-item-label>

        <q-item clickable v-ripple to="/">
          <q-item-section avatar><q-icon name="home" /></q-item-section>
          <q-item-section>Landing Page</q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>

    <q-footer class="bg-dark text-grey-5 q-pa-md text-center" style="font-size: 12px;">
      <div>BeHivez Admin &copy; {{ new Date().getFullYear() }}</div>
      <div class="q-mt-xs">A <span class="text-amber">BeHivez</span> Product</div>
    </q-footer>
  </q-layout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from 'stores/auth'

const drawer = ref(false)
const auth = useAuthStore()
const router = useRouter()

const userName = computed(() => auth.user?.name || '')

async function handleLogout() {
  await auth.logout()
  router.push('/admin/login')
}
</script>
