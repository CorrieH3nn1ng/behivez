<template>
  <q-layout view="hHh lpR fFf">
    <q-header class="bz-header text-white" bordered>
      <q-toolbar>
        <q-btn flat dense round icon="menu" @click="drawer = !drawer" />
        <q-btn flat dense no-caps to="/" class="q-ml-sm" style="color: #f0a030;">
          <q-icon name="storefront" size="24px" class="q-mr-xs" />
          <span class="text-weight-bold">Broodz</span>
        </q-btn>

        <q-space />

        <q-btn
          v-if="talentStore.mine?.slug"
          flat dense no-caps
          icon="visibility"
          :label="$q.screen.gt.xs ? 'View Storefront' : ''"
          :to="'/' + talentStore.mine.slug"
          class="q-mr-sm"
          style="color: #c0b0a0;"
        />
        <q-btn flat dense icon="logout" style="color: #806858;" @click="handleLogout" />
      </q-toolbar>
    </q-header>

    <q-drawer v-model="drawer" bordered :width="240" class="bz-sidebar">
      <q-list padding class="text-grey-4">
        <q-item-label header class="text-weight-bold" style="color: #f0a030;">Dashboard</q-item-label>

        <q-item clickable v-ripple to="/dashboard" exact @click="closeMobile" active-class="bz-nav-active">
          <q-item-section avatar><q-icon name="home" color="grey-5" /></q-item-section>
          <q-item-section style="color: #c0b0a0;">Home</q-item-section>
        </q-item>

        <q-item clickable v-ripple to="/dashboard/profile" @click="closeMobile" active-class="bz-nav-active">
          <q-item-section avatar><q-icon name="person" color="grey-5" /></q-item-section>
          <q-item-section style="color: #c0b0a0;">My Profile</q-item-section>
        </q-item>

        <q-item clickable v-ripple to="/dashboard/services" @click="closeMobile" active-class="bz-nav-active">
          <q-item-section avatar><q-icon name="handyman" color="grey-5" /></q-item-section>
          <q-item-section style="color: #c0b0a0;">Services</q-item-section>
        </q-item>

        <q-item clickable v-ripple to="/dashboard/shop" @click="closeMobile" active-class="bz-nav-active">
          <q-item-section avatar><q-icon name="shopping_bag" color="grey-5" /></q-item-section>
          <q-item-section style="color: #c0b0a0;">Shop</q-item-section>
        </q-item>

        <q-item clickable v-ripple to="/dashboard/portfolio" @click="closeMobile" active-class="bz-nav-active">
          <q-item-section avatar><q-icon name="photo_library" color="grey-5" /></q-item-section>
          <q-item-section style="color: #c0b0a0;">Portfolio</q-item-section>
        </q-item>

        <q-item clickable v-ripple to="/dashboard/enquiries" @click="closeMobile" active-class="bz-nav-active">
          <q-item-section avatar><q-icon name="mail" color="grey-5" /></q-item-section>
          <q-item-section style="color: #c0b0a0;">Enquiries</q-item-section>
        </q-item>

        <q-separator class="q-my-sm" style="background: #3a3040;" />

        <q-item clickable v-ripple @click="openFinances">
          <q-item-section avatar><q-icon name="payments" color="grey-5" /></q-item-section>
          <q-item-section style="color: #c0b0a0;">My Finances</q-item-section>
          <q-item-section side><q-icon name="open_in_new" size="16px" style="color: #806858;" /></q-item-section>
        </q-item>

        <q-separator class="q-my-sm" style="background: #3a3040;" />

        <q-item clickable v-ripple to="/dashboard/account" @click="closeMobile" active-class="bz-nav-active">
          <q-item-section avatar><q-icon name="manage_accounts" color="grey-5" /></q-item-section>
          <q-item-section style="color: #c0b0a0;">Account</q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useAuthStore } from 'src/stores/auth'
import { useTalentStore } from 'src/stores/talent'

const drawer = ref(true)
const authStore = useAuthStore()
const talentStore = useTalentStore()
const router = useRouter()
const $q = useQuasar()

onMounted(async () => {
  try {
    await talentStore.fetchMine()
  } catch {
    // talent stub may not exist yet
  }
})

function closeMobile() {
  if ($q.screen.lt.md) {
    drawer.value = false
  }
}

function openFinances() {
  closeMobile()
  const token = process.env.CLIENT ? localStorage.getItem('bz_access_token') : ''
  const refresh = process.env.CLIENT ? localStorage.getItem('bz_refresh_token') : ''
  window.open(`https://pollenz.co.za/sso?token=${token}&refresh=${refresh}`, '_blank')
}

function handleLogout() {
  authStore.logout()
  router.push({ name: 'landing' })
}
</script>

<style lang="scss" scoped>
.bz-nav-active {
  background: rgba(240, 160, 48, 0.1);

  .q-item-section--side .q-icon {
    color: #f0a030 !important;
  }

  .q-item-section:not(.q-item-section--side) {
    color: #f0a030 !important;
    font-weight: 700;
  }
}
</style>
