<template>
  <q-page class="honeycomb-bg flex flex-center" style="min-height: 80vh;">
    <q-card flat class="bee-card q-pa-xl text-center" style="max-width: 480px; width: 100%;">
      <q-icon name="payment" size="48px" color="amber" class="q-mb-md" />
      <h2 class="text-h5 text-weight-bold q-mb-xs">Confirm Payment</h2>
      <p class="text-grey-7 q-mb-lg" style="font-size: 14px;">
        Secure payment via PayFast. Card, EFT, or SnapScan.
      </p>

      <div class="q-pa-md bg-grey-1 rounded-borders q-mb-md">
        <div class="row justify-between q-mb-sm">
          <span class="text-grey-7">Paper evaluation</span>
          <span class="text-weight-bold">Mode {{ mode }}</span>
        </div>
        <q-separator class="q-mb-sm" />
        <div class="row justify-between">
          <span class="text-weight-bold text-h6">Total</span>
          <span class="text-weight-bold text-h6 text-amber-8">{{ discountedPrice }}</span>
        </div>
      </div>

      <!-- Coupon Code -->
      <q-input
        v-model="couponCode"
        outlined
        dense
        label="Coupon code (optional)"
        class="q-mb-xs"
        @keyup.enter="checkCoupon"
        :loading="couponChecking"
        :disable="couponValid"
      >
        <template #append>
          <q-icon v-if="couponValid" name="check_circle" color="positive" />
          <q-btn v-else flat dense no-caps label="Apply" color="amber-8" @click="checkCoupon" :disable="!couponCode.trim()" />
        </template>
      </q-input>
      <div v-if="couponMessage" class="q-mb-md text-caption" :class="couponValid ? 'text-positive' : 'text-negative'">
        {{ couponMessage }}
      </div>
      <div v-else class="q-mb-md" />

      <q-btn
        v-if="isTestValid"
        class="full-width q-mb-sm"
        color="green"
        size="lg"
        no-caps
        :label="couponValid ? 'Get Free Evaluation' : 'Test Mode — Skip Payment'"
        :icon="couponValid ? 'redeem' : 'science'"
        @click="handleTestBypass"
      />

      <q-btn
        class="btn-bee full-width"
        size="lg"
        no-caps
        :label="isTestValid ? 'Or Pay with PayFast' : 'Pay with PayFast'"
        :loading="loading"
        @click="handlePayment"
        icon="lock"
      />

      <!-- Rubric customization link -->
      <div class="q-mt-md">
        <q-btn flat no-caps color="amber-8" icon="tune" label="Customize Rubric Weights First" size="sm" :to="`/workspace/rubric/${paperId}?mode=${mode}`" />
      </div>

      <p class="text-caption text-grey-5 q-mt-md">
        <q-icon name="verified_user" size="14px" /> You'll be redirected to PayFast's secure payment page. We never see your card details.
      </p>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePayment } from 'src/composables/usePayment'
import { backendApi } from 'src/boot/axios'
import { useAuthStore } from 'src/stores/auth'
import { useCouponStore } from 'src/stores/coupon'
import { Notify } from 'quasar'

const props = defineProps<{ paperId: string }>()
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const couponStore = useCouponStore()
const { loading, initiatePayment, submitToPayFast } = usePayment()

const isWorkspace = computed(() => route.path.startsWith('/workspace'))
const mode = computed(() => (route.query.mode as string) || 'A')
const email = computed(() => (route.query.email as string) || authStore.user?.email || '')
const name = computed(() => authStore.user?.name || '')

const couponCode = ref('')
const couponValid = ref(false)
const couponChecking = ref(false)
const couponMessage = ref('')
const couponDiscount = ref(0)

const isTestValid = computed(() => {
  const isAdmin = email.value.toLowerCase().includes('corri')
  return couponValid.value || isAdmin
})

// Registered users pay R20, token users pay R25
const basePrice = computed(() => {
  const tier = route.query.tier as string
  if (tier === 'token') return 25
  return 20 // registered
})

const discountedPrice = computed(() => {
  if (couponValid.value && couponDiscount.value === 100) return 'FREE'
  if (couponValid.value && couponDiscount.value > 0) {
    const price = basePrice.value * (1 - couponDiscount.value / 100)
    return `R${price.toFixed(2)}`
  }
  return `R${basePrice.value.toFixed(2)}`
})

// Auto-load coupon from store on mount
onMounted(() => {
  if (couponStore.isValid) {
    couponCode.value = couponStore.code
    couponValid.value = true
    couponDiscount.value = couponStore.discount_percent
    couponMessage.value = couponStore.discount_percent === 100
      ? `Free evaluation courtesy of ${couponStore.affiliate_name}`
      : `${couponStore.discount_percent}% off courtesy of ${couponStore.affiliate_name}`
  }
})

async function checkCoupon() {
  const code = couponCode.value.trim()
  if (!code) return
  couponChecking.value = true
  couponMessage.value = ''
  try {
    const { data: result } = await backendApi.get<{ valid: boolean; discount_percent: number; affiliate_name: string; message?: string }>(`/coupons/validate?code=${encodeURIComponent(code)}`)
    if (result.valid) {
      couponValid.value = true
      couponDiscount.value = result.discount_percent
      couponMessage.value = result.discount_percent === 100
        ? `Free evaluation courtesy of ${result.affiliate_name}`
        : `${result.discount_percent}% off courtesy of ${result.affiliate_name}`
      // Also save to coupon store
      couponStore.validateCoupon(code)
    } else {
      couponValid.value = false
      couponMessage.value = result.message || 'Invalid or expired coupon'
    }
  } catch {
    couponValid.value = false
    couponMessage.value = 'Could not verify coupon'
  } finally {
    couponChecking.value = false
  }
}

function handleTestBypass() {
  if (!isTestValid.value) return
  const msg = couponDiscount.value === 100
    ? 'Coupon applied — free evaluation!'
    : 'Test mode — skipping payment'
  Notify.create({ type: 'positive', message: msg, icon: 'redeem' })

  const routeName = isWorkspace.value ? 'workspace-processing' : 'processing'
  router.push({
    name: routeName,
    params: { paperId: props.paperId },
    query: { mode: mode.value, test: '1', coupon: couponCode.value.trim() }
  })
}

async function handlePayment() {
  try {
    const result = await initiatePayment(Number(props.paperId), mode.value, email.value, name.value)
    submitToPayFast(result.fields, result.payfast_url)
  } catch {
    Notify.create({ type: 'negative', message: 'Payment initiation failed. Try again.' })
  }
}
</script>
