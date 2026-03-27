<template>
  <q-page class="honeycomb-bg flex flex-center" style="min-height: 80vh;">
    <q-card flat class="bee-card q-pa-xl" style="max-width: 480px; width: 100%;">
      <div class="text-center q-mb-lg">
        <q-icon name="hive" size="48px" color="amber" class="q-mb-sm" />
        <h2 class="text-h5 text-weight-bold q-mb-xs">{{ isRegister ? 'Create Account' : 'Welcome Back' }}</h2>
        <p class="text-grey-7" style="font-size: 14px;">
          {{ isRegister ? 'Get a workspace with history, rubric reuse, and affordable evaluations.' : 'Log in to your BeeGraded workspace.' }}
        </p>
      </div>

      <!-- Coupon (optional, on register) -->
      <div v-if="isRegister" class="q-mb-md">
        <div class="text-weight-bold q-mb-sm">
          <q-icon name="redeem" color="amber" class="q-mr-xs" />
          Have a coupon? <span class="text-caption text-grey-6">(optional)</span>
        </div>
        <q-input
          v-model="couponCode"
          outlined dense
          label="Enter coupon code"
          :loading="couponChecking"
          :disable="couponApplied"
          @keyup.enter="handleCoupon"
        >
          <template #append>
            <q-icon v-if="couponApplied" name="check_circle" color="positive" />
            <q-btn v-else flat dense no-caps label="Apply" color="amber-8" @click="handleCoupon" :disable="!couponCode.trim() || couponChecking" />
          </template>
        </q-input>
        <div v-if="couponMessage" class="q-mt-xs text-caption" :class="couponApplied ? 'text-positive' : 'text-negative'">
          {{ couponMessage }}
        </div>
        <q-separator class="q-mt-md" />
      </div>

      <!-- Name (register only) -->
      <q-input
        v-if="isRegister"
        v-model="name"
        outlined dense
        label="Full Name"
        class="q-mb-md"
        :disable="loading"
        @keyup.enter="handleSubmit"
      >
        <template #prepend><q-icon name="person" /></template>
      </q-input>

      <!-- Email -->
      <q-input
        v-model="email"
        outlined dense
        type="email"
        label="Email address"
        class="q-mb-md"
        :disable="loading"
        @keyup.enter="handleSubmit"
      >
        <template #prepend><q-icon name="mail" /></template>
      </q-input>

      <!-- Home Language (register only) -->
      <q-select
        v-if="isRegister"
        v-model="homeLanguage"
        outlined dense
        label="Home Language / Huistaal"
        :options="languageOptions"
        emit-value
        map-options
        class="q-mb-md"
        :disable="loading"
      >
        <template #prepend><q-icon name="language" /></template>
      </q-select>

      <!-- Password -->
      <q-input
        v-model="password"
        outlined dense
        :type="showPassword ? 'text' : 'password'"
        label="Password"
        class="q-mb-md"
        :disable="loading"
        @keyup.enter="handleSubmit"
      >
        <template #prepend><q-icon name="lock" /></template>
        <template #append>
          <q-icon :name="showPassword ? 'visibility_off' : 'visibility'" class="cursor-pointer" @click="showPassword = !showPassword" />
        </template>
      </q-input>

      <!-- Error -->
      <div v-if="errorMsg" class="q-mb-md text-negative text-caption text-center">
        <q-icon name="error" size="16px" class="q-mr-xs" />{{ errorMsg }}
      </div>

      <!-- Submit -->
      <q-btn
        class="btn-bee full-width"
        size="lg"
        no-caps
        :label="loading ? (isRegister ? 'Creating...' : 'Logging in...') : (isRegister ? 'Create Account' : 'Log In')"
        :loading="loading"
        :disable="!canSubmit"
        @click="handleSubmit"
      />

      <!-- Forgot password (login only) -->
      <div v-if="!isRegister" class="text-center q-mt-sm">
        <q-btn flat no-caps label="Forgot your password?" color="grey-7" size="sm" to="/forgot-password" />
      </div>

      <!-- Toggle login/register -->
      <div class="text-center q-mt-md">
        <q-btn
          flat no-caps
          :label="isRegister ? 'Already have an account? Log in' : 'No account yet? Create one'"
          color="amber-8"
          size="sm"
          @click="isRegister = !isRegister; errorMsg = ''"
        />
      </div>

      <!-- Alternative options -->
      <div class="text-center q-mt-sm">
        <q-btn flat no-caps color="grey-7" label="Just want one paper? Buy a token" to="/buy-token" size="sm" icon="token" />
        <div class="q-mt-xs">
          <q-btn flat no-caps color="grey-7" label="Try a free sample first" to="/free-sample" size="sm" />
        </div>
      </div>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from 'src/stores/auth'
import { useCouponStore } from 'src/stores/coupon'
import { Notify } from 'quasar'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const couponStore = useCouponStore()

const isRegister = ref(false)
const name = ref('')
const email = ref('')
const password = ref('')
const homeLanguage = ref('af')
const showPassword = ref(false)
const loading = ref(false)
const errorMsg = ref('')

const languageOptions = [
  { label: 'Afrikaans', value: 'af' },
  { label: 'English', value: 'en' },
  { label: 'Setswana', value: 'tn' },
]

// Coupon
const couponCode = ref('')
const couponChecking = ref(false)
const couponApplied = ref(false)
const couponMessage = ref('')

if (couponStore.isValid) {
  couponCode.value = couponStore.code
  couponApplied.value = true
  couponMessage.value = couponStore.discount_percent === 100
    ? `Free evaluation courtesy of ${couponStore.affiliate_name}`
    : `${couponStore.discount_percent}% off courtesy of ${couponStore.affiliate_name}`
}

// Pre-fill coupon from URL query
const queryCoupon = route.query.coupon as string
if (queryCoupon && !couponStore.isValid) {
  couponCode.value = queryCoupon
}

const canSubmit = computed(() => {
  if (loading.value) return false
  if (!email.value.trim() || !password.value) return false
  if (isRegister.value && !name.value.trim()) return false
  return true
})

async function handleCoupon() {
  const code = couponCode.value.trim()
  if (!code) return
  couponChecking.value = true
  couponMessage.value = ''
  try {
    const result = await couponStore.validateCoupon(code)
    if (result.valid) {
      couponApplied.value = true
      couponMessage.value = result.discount_percent === 100
        ? `Free evaluation courtesy of ${result.affiliate_name}`
        : `${result.discount_percent}% off courtesy of ${result.affiliate_name}`
    } else {
      couponMessage.value = result.message || 'Invalid or expired coupon'
    }
  } catch {
    couponMessage.value = 'Could not verify coupon'
  } finally {
    couponChecking.value = false
  }
}

async function handleSubmit() {
  if (!canSubmit.value) return
  loading.value = true
  errorMsg.value = ''

  try {
    let user
    if (isRegister.value) {
      user = await authStore.register(name.value.trim(), email.value.trim(), password.value)
      // Save home language preference
      localStorage.setItem('bg_math_lang', homeLanguage.value)
    } else {
      user = await authStore.login(email.value.trim(), password.value)
    }

    // Apply coupon from query if not yet applied
    if (queryCoupon && !couponStore.isValid) {
      try { await couponStore.validateCoupon(queryCoupon) } catch { /* ok */ }
    }

    if (user.mustChangePassword) {
      router.push({ name: 'change-password' })
    } else {
      const redirect = (route.query.redirect as string) || '/workspace'
      router.push(redirect)
    }

    Notify.create({ type: 'positive', message: isRegister.value ? 'Account created!' : 'Welcome back!' })
  } catch (err: any) {
    const msg = err?.response?.data?.error || err?.response?.data?.message || (isRegister.value ? 'Registration failed' : 'Invalid email or password')
    errorMsg.value = msg
  } finally {
    loading.value = false
  }
}
</script>
