<template>
  <q-page class="honeycomb-bg flex flex-center" style="min-height: 80vh;">
    <q-card flat class="bee-card q-pa-xl" style="max-width: 480px; width: 100%;">
      <div class="text-center q-mb-lg">
        <q-icon name="token" size="48px" color="amber" class="q-mb-sm" />
        <h2 class="text-h5 text-weight-bold q-mb-xs">Buy Evaluation Token</h2>
        <p class="text-grey-7" style="font-size: 14px;">
          One token = your rubric PDF + draft evaluation + final evaluation + comparison.
        </p>
      </div>

      <!-- Email -->
      <q-input v-model="email" outlined type="email" label="Email address" class="q-mb-md" :disable="loading">
        <template #prepend><q-icon name="email" /></template>
      </q-input>

      <!-- Coupon -->
      <q-input
        v-model="couponCode"
        outlined
        dense
        label="Coupon code (optional)"
        class="q-mb-xs"
        @keyup.enter="checkCoupon"
        :loading="couponChecking"
        :disable="couponApplied || loading"
      >
        <template #append>
          <q-icon v-if="couponApplied" name="check_circle" color="positive" />
          <q-btn v-else flat dense no-caps label="Apply" color="amber-8" @click="checkCoupon" :disable="!couponCode.trim()" />
        </template>
      </q-input>
      <div v-if="couponMessage" class="q-mb-md text-caption" :class="couponApplied ? 'text-positive' : 'text-negative'">
        {{ couponMessage }}
      </div>
      <div v-else class="q-mb-md" />

      <!-- Price summary -->
      <div class="q-pa-md bg-grey-1 rounded-borders q-mb-lg">
        <div class="row justify-between q-mb-sm">
          <span class="text-grey-7">Evaluation token</span>
          <span class="text-weight-bold">1 token</span>
        </div>
        <div class="row justify-between q-mb-sm">
          <span class="text-grey-7">Includes</span>
          <span class="text-caption">Rubric + Draft + Final + Comparison</span>
        </div>
        <q-separator class="q-mb-sm" />
        <div class="row justify-between">
          <span class="text-weight-bold text-h6">Total</span>
          <span class="text-weight-bold text-h6 text-amber-8">{{ displayPrice }}</span>
        </div>
      </div>

      <!-- Free pass (affiliate/master) -->
      <q-btn
        v-if="isFreePass"
        class="btn-bee full-width q-mb-sm"
        size="lg"
        no-caps
        label="Get Free Token"
        icon="redeem"
        :loading="loading"
        :disable="!email.trim()"
        @click="handlePurchase"
      />

      <!-- PayFast button -->
      <q-btn
        v-else
        class="btn-bee full-width"
        size="lg"
        no-caps
        :label="loading ? 'Processing...' : `Pay ${displayPrice} with PayFast`"
        :loading="loading"
        :disable="!email.trim()"
        @click="handlePurchase"
        icon="lock"
      />

      <p class="text-caption text-grey-5 q-mt-md text-center">
        <q-icon name="verified_user" size="14px" /> Secure payment via PayFast. Token delivered to your email instantly.
      </p>

      <q-separator class="q-my-md" />

      <div class="text-center">
        <q-btn flat no-caps color="grey-7" label="Already have a token?" size="sm" @click="showTokenInput = !showTokenInput" />
        <div v-if="showTokenInput" class="q-mt-sm">
          <q-input v-model="existingToken" outlined dense label="Enter token code (e.g. BGT-XXXX-XXXX)" @keyup.enter="goToToken">
            <template #append>
              <q-btn flat dense no-caps label="Go" color="amber-8" @click="goToToken" :disable="!existingToken.trim()" />
            </template>
          </q-input>
        </div>
      </div>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useToken } from 'src/composables/useToken'
import { useCouponStore } from 'src/stores/coupon'
import { Notify } from 'quasar'

const router = useRouter()
const { purchaseToken } = useToken()
const couponStore = useCouponStore()

const email = ref('')
const couponCode = ref('')
const couponChecking = ref(false)
const couponApplied = ref(false)
const couponMessage = ref('')
const couponDiscount = ref(0)
const loading = ref(false)
const showTokenInput = ref(false)
const existingToken = ref('')

const BASE_PRICE = 25

// Pre-fill coupon from store
if (couponStore.isValid) {
  couponCode.value = couponStore.code
  couponApplied.value = true
  couponDiscount.value = couponStore.discount_percent
  couponMessage.value = couponStore.discount_percent === 100
    ? `Free token courtesy of ${couponStore.affiliate_name}`
    : `${couponStore.discount_percent}% off courtesy of ${couponStore.affiliate_name}`
}

const isFreePass = computed(() => couponApplied.value && couponDiscount.value === 100)

const displayPrice = computed(() => {
  if (isFreePass.value) return 'FREE'
  if (couponApplied.value && couponDiscount.value > 0) {
    const price = BASE_PRICE * (1 - couponDiscount.value / 100)
    return `R${price.toFixed(2)}`
  }
  return `R${BASE_PRICE}.00`
})

async function checkCoupon() {
  const code = couponCode.value.trim()
  if (!code) return
  couponChecking.value = true
  couponMessage.value = ''
  try {
    const result = await couponStore.validateCoupon(code)
    if (result.valid) {
      couponApplied.value = true
      couponDiscount.value = result.discount_percent
      couponMessage.value = result.discount_percent === 100
        ? `Free token courtesy of ${result.affiliate_name}`
        : `${result.discount_percent}% off courtesy of ${result.affiliate_name}`
    } else {
      couponApplied.value = false
      couponMessage.value = result.message || 'Invalid or expired coupon'
    }
  } catch {
    couponMessage.value = 'Could not verify coupon'
  } finally {
    couponChecking.value = false
  }
}

async function handlePurchase() {
  if (!email.value.trim()) return
  loading.value = true
  try {
    const result = await purchaseToken(
      email.value.trim().toLowerCase(),
      couponApplied.value ? couponCode.value.trim() : undefined,
    )

    if (result.free && result.token_code) {
      // Free pass — go straight to token hub
      Notify.create({ type: 'positive', message: 'Token activated!', icon: 'redeem' })
      router.push({ name: 'token-hub', params: { tokenCode: result.token_code } })
    } else if (result.fields && result.payfast_url) {
      // Redirect to PayFast
      const form = document.createElement('form')
      form.method = 'POST'
      form.action = result.payfast_url
      for (const [key, value] of Object.entries(result.fields)) {
        const input = document.createElement('input')
        input.type = 'hidden'
        input.name = key
        input.value = value
        form.appendChild(input)
      }
      document.body.appendChild(form)
      form.submit()
    }
  } catch {
    Notify.create({ type: 'negative', message: 'Could not process purchase. Please try again.' })
  } finally {
    loading.value = false
  }
}

function goToToken() {
  const code = existingToken.value.trim()
  if (code) {
    router.push({ name: 'token-hub', params: { tokenCode: code } })
  }
}
</script>
