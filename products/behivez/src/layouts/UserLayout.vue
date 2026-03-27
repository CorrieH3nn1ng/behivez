<template>
  <q-layout view="hHh lpR fFf">
    <q-header class="bg-white" style="border-bottom: 1px solid rgba(245,158,11,0.15);">
      <q-toolbar>
        <q-btn flat dense no-caps class="text-amber-9 q-mr-sm" to="/">
          <q-icon name="hive" size="28px" class="q-mr-xs" />
          <span class="text-weight-bold text-h6">BeHivez</span>
        </q-btn>
        <q-space />
        <q-btn flat no-caps label="Pricing" class="text-grey-8" to="/pricing" />
        <q-btn flat no-caps label="Content Creator" class="text-amber-9" icon="auto_awesome" to="/my/content-creator" />
        <q-btn flat no-caps label="My Subscriptions" class="text-grey-8" to="/my/subscriptions" />
        <q-btn flat round icon="person">
          <q-menu>
            <q-list style="min-width: 180px">
              <q-item-label header>{{ auth.user?.name || '' }}</q-item-label>
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

    <q-page-container>
      <router-view />
    </q-page-container>

    <q-footer class="bg-white text-grey-7 q-pa-md text-center" style="font-size: 12px; border-top: 1px solid rgba(245,158,11,0.15);">
      <div>BeHivez &copy; {{ new Date().getFullYear() }} &mdash; A hive of smart tools</div>
    </q-footer>
  </q-layout>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from 'stores/auth'

const auth = useAuthStore()
const router = useRouter()

async function handleLogout() {
  await auth.logout()
  router.push('/')
}
</script>
