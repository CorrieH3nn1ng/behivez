<template>
  <q-layout view="hHh lpR fFf">
    <q-header class="bg-dark text-white" bordered>
      <q-toolbar>
        <q-btn flat dense no-caps to="/" class="text-amber q-mr-sm">
          <q-icon name="hive" size="28px" class="q-mr-xs" />
          <span class="text-weight-bold text-h6">BeeGraded</span>
        </q-btn>

        <q-space />

        <q-badge v-if="tokenStore.isValid" color="amber" class="q-mr-sm q-pa-xs" style="font-size: 11px;">
          <q-icon name="token" size="12px" class="q-mr-xs" />
          {{ tokenStore.tokenCode }}
        </q-badge>

        <q-btn flat dense no-caps label="Token Hub" :to="`/t/${tokenCode}`" color="amber" class="q-mr-sm" />
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>

    <q-footer class="bg-dark text-grey-5 q-pa-md text-center" style="font-size: 12px;">
      <div>BeeGraded &copy; {{ new Date().getFullYear() }} &mdash; Get BeeGraded before you get graded</div>
    </q-footer>
  </q-layout>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useTokenStore } from 'src/stores/token'

const route = useRoute()
const tokenStore = useTokenStore()
const tokenCode = computed(() => (route.params.tokenCode as string) || tokenStore.tokenCode || '')
</script>
