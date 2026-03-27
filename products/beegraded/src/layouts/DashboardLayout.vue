<template>
  <q-layout view="hHh lpR fFf">
    <q-header class="bg-dark text-white" bordered>
      <q-toolbar>
        <q-btn flat dense no-caps to="/" class="text-amber q-mr-sm">
          <q-icon name="hive" size="28px" class="q-mr-xs" />
          <span class="text-weight-bold text-h6">BeeGraded</span>
        </q-btn>

        <q-space />

        <q-badge v-if="couponStore.isValid" color="green" class="q-mr-md q-pa-xs" style="font-size: 11px;">
          <q-icon name="redeem" size="12px" class="q-mr-xs" />
          {{ couponStore.discount_percent === 100 ? 'Free' : `${couponStore.discount_percent}% off` }}
        </q-badge>

        <q-btn flat dense no-caps to="/workspace/children" color="amber" class="q-mr-sm">
          <q-icon name="family_restroom" size="18px" class="q-mr-xs" />
          <span>{{ lang === 'af' ? 'My Kinders' : 'My Children' }}</span>
        </q-btn>
        <q-btn flat dense no-caps to="/workspace/papers" class="q-mr-sm">
          <q-icon name="description" size="18px" class="q-mr-xs" />
          <span class="gt-xs">{{ lang === 'af' ? 'Werkruimte' : 'Papers' }}</span>
        </q-btn>
        <q-btn flat dense no-caps class="btn-bee q-ml-sm" @click="handleNewEvaluation">
          {{ lang === 'af' ? 'Nuwe Evaluering' : 'New Evaluation' }}
        </q-btn>
        <q-btn flat dense icon="person" class="q-ml-md text-grey-4" to="/workspace/account" />
        <q-btn flat dense icon="logout" class="q-ml-md text-grey-4" @click="handleLogout" />
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>

    <q-footer class="bg-dark text-grey-5 q-pa-md text-center" style="font-size: 12px;">
      <div>BeeGraded &copy; {{ new Date().getFullYear() }} &mdash; {{ lang === 'af' ? 'Word BeeGraded voordat jy gegradeer word' : 'Get BeeGraded before you get graded' }}</div>
    </q-footer>
  </q-layout>
</template>

<script setup lang="ts">
import { useAuthStore } from 'src/stores/auth'
import { useCouponStore } from 'src/stores/coupon'
import { useRouter } from 'vue-router'
import { useEvalSessionStore } from 'src/stores/evaluation-session'
import { useI18n } from 'src/i18n'

const { lang } = useI18n()
const authStore = useAuthStore()
const couponStore = useCouponStore()
const router = useRouter()
const evalSession = useEvalSessionStore()

function handleNewEvaluation() {
  evalSession.startNew()
  router.push('/workspace/new')
}

async function handleLogout() {
  await authStore.logout()
  couponStore.clearCoupon()
  router.push({ name: 'landing' })
}
</script>
