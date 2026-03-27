<template>
  <q-page class="flex flex-center" style="min-height: 80vh; background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);">
    <q-card flat bordered style="width: 400px; max-width: 90vw;" class="q-pa-md">
      <q-card-section class="text-center">
        <q-icon name="hive" size="48px" color="amber-8" />
        <div class="text-h5 text-weight-bold text-grey-9 q-mt-sm">Sign In</div>
        <div class="text-caption text-grey-6">Log in to manage your subscriptions</div>
      </q-card-section>

      <q-banner v-if="error" class="bg-red-1 text-red-8 q-mb-md" rounded>
        {{ error }}
      </q-banner>

      <q-card-section>
        <q-input
          v-model="email"
          label="Email"
          type="email"
          outlined
          dense
          class="q-mb-md"
          @keyup.enter="handleLogin"
        />
        <q-input
          v-model="password"
          label="Password"
          :type="showPw ? 'text' : 'password'"
          outlined
          dense
          class="q-mb-md"
          @keyup.enter="handleLogin"
        >
          <template #append>
            <q-icon :name="showPw ? 'visibility_off' : 'visibility'" class="cursor-pointer" @click="showPw = !showPw" />
          </template>
        </q-input>

        <q-btn
          label="Sign In"
          color="amber-8"
          text-color="white"
          no-caps
          unelevated
          class="full-width q-mt-sm"
          :loading="loading"
          @click="handleLogin"
        />
      </q-card-section>

      <q-card-section class="text-center">
        <div class="text-grey-6">
          Don't have an account?
          <router-link to="/register" class="text-amber-9 text-weight-medium">Sign Up</router-link>
        </div>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from 'stores/auth'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const email = ref('')
const password = ref('')
const showPw = ref(false)
const loading = ref(false)
const error = ref('')

async function handleLogin() {
  if (!email.value || !password.value) {
    error.value = 'Please enter email and password.'
    return
  }

  loading.value = true
  error.value = ''
  try {
    await auth.login(email.value, password.value)
    const redirect = (route.query.redirect as string) || '/my/subscriptions'
    router.push(redirect)
  } catch (err: any) {
    error.value = err?.response?.data?.message || 'Login failed. Please check your credentials.'
  } finally {
    loading.value = false
  }
}
</script>
