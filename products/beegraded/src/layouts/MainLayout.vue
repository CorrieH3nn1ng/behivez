<template>
  <q-layout view="hHh lpR fFf">
    <q-header class="bg-dark text-white" bordered>
      <q-toolbar>
        <q-btn flat dense no-caps to="/" class="text-amber q-mr-sm">
          <q-icon name="hive" size="28px" class="q-mr-xs" />
          <span class="text-weight-bold text-h6">BeeGraded</span>
        </q-btn>

        <q-space />

        <q-btn flat dense no-caps label="How It Works" to="/#how-it-works" class="q-mr-sm gt-xs" />
        <q-btn flat dense no-caps label="Pricing" to="/#pricing" class="q-mr-sm gt-xs" />

        <template v-if="authStore.isLoggedIn">
          <q-btn flat dense no-caps label="Workspace" to="/workspace" class="q-mr-sm" />
          <q-btn flat dense no-caps icon="logout" @click="handleLogout" />
        </template>
        <template v-else>
          <q-btn outline dense no-caps label="Get Started" to="/get-started" color="amber" class="q-mr-sm" />
        </template>

        <q-btn flat dense no-caps class="btn-bee q-ml-sm" label="Try Free" to="/free-sample" />
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
