<template>
  <div class="flex flex-center" style="min-height: 100vh; background: linear-gradient(160deg, #fffbeb 0%, #fef3c7 100%)">
    <q-card style="width: 400px; max-width: 90vw" class="q-pa-lg login-card">
      <q-card-section class="text-center">
        <q-icon name="hive" size="36px" color="amber" class="q-mb-sm" />
        <div class="text-h4 text-primary text-weight-bold q-mb-xs">BeHivez</div>
        <div class="text-caption text-grey-6 q-mb-sm">Admin Control Panel</div>
        <div class="text-subtitle2 text-grey-7">Sign in to manage the hive</div>
      </q-card-section>

      <q-card-section>
        <q-form @submit.prevent="handleLogin" class="q-gutter-md">
          <q-input
            v-model="email"
            label="Email"
            type="email"
            outlined
            dense
            :rules="[val => !!val || 'Required']"
          />
          <q-input
            v-model="password"
            label="Password"
            :type="showPwd ? 'text' : 'password'"
            outlined
            dense
            :rules="[val => !!val || 'Required']"
          >
            <template v-slot:append>
              <q-icon
                :name="showPwd ? 'visibility_off' : 'visibility'"
                class="cursor-pointer"
                @click="showPwd = !showPwd"
              />
            </template>
          </q-input>

          <q-banner v-if="error" dense class="bg-red-1 text-red-8 q-mt-sm rounded-borders">
            {{ error }}
          </q-banner>

          <q-btn
            type="submit"
            label="Sign In"
            color="primary"
            class="full-width"
            :loading="loading"
            unelevated
            no-caps
          />
        </q-form>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from 'stores/auth'

const auth = useAuthStore()
const router = useRouter()

const email = ref('')
const password = ref('')
const showPwd = ref(false)
const loading = ref(false)
const error = ref('')

async function handleLogin() {
  error.value = ''
  loading.value = true
  try {
    const user = await auth.login(email.value, password.value)
    if (user.role !== 'OWNER' && user.role !== 'ADMIN') {
      error.value = 'Access denied — admin privileges required'
      await auth.logout()
      return
    }
    router.push('/admin/dashboard')
  } catch (e: any) {
    error.value = e.response?.data?.error || e.response?.data?.message || 'Login failed'
  } finally {
    loading.value = false
  }
}
</script>
