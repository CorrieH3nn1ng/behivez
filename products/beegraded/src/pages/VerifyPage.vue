<template>
  <q-page class="honeycomb-bg flex flex-center" style="min-height: 80vh;">
    <q-card flat class="bee-card q-pa-xl text-center" style="max-width: 420px; width: 100%;">
      <template v-if="verifying">
        <q-spinner-gears size="48px" color="amber" class="q-mb-md" />
        <p class="text-subtitle1 text-weight-bold">Verifying your login...</p>
      </template>

      <template v-else-if="error">
        <q-icon name="error" size="48px" color="negative" class="q-mb-md" />
        <p class="text-subtitle1 text-weight-bold">Link Expired or Invalid</p>
        <p class="text-grey-7" style="font-size: 13px;">Magic links expire after 15 minutes. Request a new one.</p>
        <q-btn class="btn-bee q-mt-md" no-caps label="Request New Link" to="/get-started" />
      </template>

      <template v-else>
        <q-icon name="check_circle" size="48px" color="positive" class="q-mb-md" />
        <p class="text-subtitle1 text-weight-bold">You're logged in!</p>
        <p class="text-grey-7" style="font-size: 13px;">Redirecting you now...</p>
      </template>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from 'src/stores/auth'
import { useCouponStore } from 'src/stores/coupon'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const couponStore = useCouponStore()

const verifying = ref(true)
const error = ref(false)

onMounted(async () => {
  const token = route.query.token as string
  if (!token) {
    error.value = true
    verifying.value = false
    return
  }

  try {
    await authStore.verifyToken(token)
    verifying.value = false

    // Load coupon from query param (e.g. ?coupon=IK_KAgsBHSu) or localStorage
    const couponParam = route.query.coupon as string
    if (couponParam && !couponStore.isValid) {
      try {
        await couponStore.validateCoupon(couponParam)
      } catch { /* ignore */ }
    } else {
      const savedCoupon = localStorage.getItem('bg_coupon')
      if (savedCoupon && !couponStore.isValid) {
        try {
          const parsed = JSON.parse(savedCoupon)
          if (parsed.code) {
            await couponStore.validateCoupon(parsed.code)
          }
        } catch { /* ignore */ }
      }
    }

    const redirect = route.query.redirect as string || '/workspace'
    setTimeout(() => router.push(redirect), 1000)
  } catch {
    error.value = true
    verifying.value = false
  }
})
</script>
