<template>
  <q-layout view="hHh lpR fFf">
    <q-header class="bg-white" style="border-bottom: 1px solid rgba(245,158,11,0.15);">
      <q-toolbar>
        <q-btn flat dense no-caps class="text-amber-9 q-mr-sm" @click="scrollTo('top')">
          <q-icon name="hive" size="28px" class="q-mr-xs" />
          <span class="text-weight-bold text-h6">BeHivez</span>
        </q-btn>
        <q-space />
        <q-btn flat no-caps label="Products" class="text-grey-8" @click="scrollTo('products')" />
        <q-btn flat no-caps label="About" class="text-grey-8" @click="scrollTo('about')" />
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>

    <q-footer class="bg-white text-grey-7 q-pa-md text-center" style="font-size: 12px; border-top: 1px solid rgba(245,158,11,0.15);">
      <div>BeHivez &copy; {{ new Date().getFullYear() }} &mdash; A hive of smart tools</div>
      <div class="q-mt-xs">A Risk-Asure Product</div>
    </q-footer>
  </q-layout>
</template>

<script setup lang="ts">
function scrollTo(id: string) {
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth' });
  }
}
</script>
