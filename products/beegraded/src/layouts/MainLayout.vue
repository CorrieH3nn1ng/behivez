<template>
  <q-layout view="hHh lpR fFf">
    <q-header class="bg-dark text-white" bordered>
      <q-toolbar>
        <q-btn flat dense no-caps to="/" class="text-amber q-mr-sm">
          <q-icon name="hive" size="28px" class="q-mr-xs" />
          <span class="text-weight-bold text-h6">BeeGraded</span>
        </q-btn>

        <q-space />

        <q-btn flat dense no-caps to="/#pricing" class="q-mr-sm gt-xs text-grey-4">
          Pricing
        </q-btn>

        <template v-if="authStore.isLoggedIn">
          <q-btn flat dense no-caps to="/workspace" class="q-mr-sm text-amber">
            <q-icon name="dashboard" size="18px" class="q-mr-xs" />
            Dashboard
          </q-btn>
          <q-btn flat dense no-caps icon="logout" class="text-grey-4" @click="handleLogout" />
        </template>
        <template v-else>
          <q-btn outline dense no-caps to="/get-started" color="amber">
            Login
          </q-btn>
        </template>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>

    <q-footer class="bg-dark text-grey-5 q-pa-md text-center" style="font-size: 12px;">
      <div>BeeGraded &copy; {{ new Date().getFullYear() }} &mdash; Get BeeGraded before you get graded</div>
      <div class="q-mt-xs">A Risk-Asure Product</div>
    </q-footer>
  </q-layout>
</template>

<script setup lang="ts">
import { useAuthStore } from 'src/stores/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

function handleLogout() {
  authStore.logout()
  router.push({ name: 'landing' })
}
</script>
