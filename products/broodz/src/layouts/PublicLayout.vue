<template>
  <q-layout view="hHh lpR fFf">
    <q-header class="bz-header text-white" bordered>
      <q-toolbar>
        <q-btn flat dense no-caps to="/" class="q-mr-sm" style="color: #f0a030;">
          <q-icon name="storefront" size="28px" class="q-mr-xs" />
          <span class="text-weight-bold text-h6">Broodz</span>
        </q-btn>

        <q-space />

        <q-btn flat dense no-caps label="Browse" to="/" class="q-mr-sm gt-xs" style="color: #c0b0a0;" />
        <q-btn
          v-if="authStore.isLoggedIn"
          flat dense no-caps label="Dashboard" to="/dashboard" class="q-mr-sm" style="color: #c0b0a0;"
        />
        <q-btn
          v-else
          flat dense no-caps label="Login" to="/login" class="btn-broodz"
        />
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>

    <q-footer class="q-pa-md text-center" style="background: #1a1520; color: #806858; font-size: 12px;">
      <div>Broodz &copy; {{ new Date().getFullYear() }} &mdash; Your talent, your storefront</div>
    </q-footer>
  </q-layout>
</template>

<script setup lang="ts">
import { useAuthStore } from 'src/stores/auth'

const authStore = useAuthStore()
</script>
