<template>
  <q-page class="flex flex-center" style="min-height: 80vh; background: linear-gradient(180deg, #1a1520, #251d28);">
    <q-card flat class="q-pa-xl" style="max-width: 420px; width: 100%; background: #2a2230; border-radius: 16px;">
      <div class="text-center q-mb-lg">
        <q-icon name="storefront" size="48px" style="color: #f0a030;" class="q-mb-sm" />
        <h5 class="text-h5 text-weight-bold q-mb-xs q-mt-none" style="color: #fff8f0;">{{ isRegister ? 'Create Account' : 'Welcome back' }}</h5>
        <p style="font-size: 14px; color: #b0a090;">
          {{ isRegister ? 'Get your own talent storefront — showcase work, list services, get enquiries.' : 'Sign in to manage your storefront.' }}
        </p>
      </div>

      <!-- Name (register only) -->
      <q-input
        v-if="isRegister"
        v-model="name"
        outlined dense
        label="Full Name"
        class="q-mb-md bz-input"
        :disable="loading"
        @keyup.enter="handleSubmit"
        dark
      >
        <template #prepend><q-icon name="person" /></template>
      </q-input>

      <!-- Email -->
      <q-input
        v-model="email"
        outlined dense
        type="email"
        label="Email address"
        class="q-mb-md bz-input"
        :disable="loading"
        @keyup.enter="handleSubmit"
        dark
      >
        <template #prepend><q-icon name="mail" /></template>
      </q-input>

      <!-- Password -->
      <q-input
        v-model="password"
        outlined dense
        :type="showPassword ? 'text' : 'password'"
        label="Password"
        class="q-mb-md bz-input"
        :disable="loading"
        @keyup.enter="handleSubmit"
        dark
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
        class="full-width btn-broodz"
        size="lg"
        no-caps
        :label="loading ? (isRegister ? 'Creating...' : 'Signing in...') : (isRegister ? 'Create Account' : 'Sign In')"
        :loading="loading"
        :disable="!canSubmit"
        @click="handleSubmit"
      />

      <!-- Forgot password -->
      <div v-if="!isRegister" class="text-center q-mt-sm">
        <q-btn flat no-caps label="Forgot password?" style="color: #f0a030;" size="sm" to="/forgot-password" />
      </div>

      <!-- Toggle login/register -->
      <div class="text-center q-mt-md">
        <span style="color: #b0a090; font-size: 13px;">
          {{ isRegister ? 'Already have an account?' : "Don't have an account?" }}
        </span>
        <q-btn
          flat no-caps
          :label="isRegister ? 'Log in' : 'Sign up'"
          style="color: #f0a030;"
          size="sm"
          @click="isRegister = !isRegister; errorMsg = ''"
        />
      </div>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from 'src/stores/auth'
import { Notify } from 'quasar'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const isRegister = ref(false)
const name = ref('')
const email = ref('')
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)
const errorMsg = ref('')

const canSubmit = computed(() => {
  if (loading.value) return false
  if (!email.value.trim() || !password.value) return false
  if (isRegister.value && !name.value.trim()) return false
  return true
})

async function handleSubmit() {
  if (!canSubmit.value) return
  loading.value = true
  errorMsg.value = ''

  try {
    let user
    if (isRegister.value) {
      user = await authStore.register(name.value.trim(), email.value.trim(), password.value)
    } else {
      user = await authStore.login(email.value.trim(), password.value)
    }

    if (user.mustChangePassword) {
      router.push({ name: 'change-password' })
    } else {
      const redirect = (route.query.redirect as string) || '/dashboard'
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

<style lang="scss" scoped>
.bz-input {
  :deep(.q-field__control) {
    background: #352d3d;
    border-color: #4a4050;
  }
}
</style>
