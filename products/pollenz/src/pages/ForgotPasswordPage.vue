<template>
  <div class="flex flex-center" style="min-height: 100vh; background: linear-gradient(160deg, #fffbeb 0%, #fef3c7 100%)">
    <q-card style="width: 400px; max-width: 90vw" class="q-pa-lg">
      <q-card-section class="text-center">
        <q-icon name="hive" size="36px" color="amber" class="q-mb-sm" />
        <div class="text-h4 text-primary text-weight-bold q-mb-xs">Pollenz</div>
        <div class="text-subtitle2 text-grey-7">Reset your password</div>
      </q-card-section>

      <q-card-section v-if="!sent">
        <q-form @submit="handleSubmit" class="q-gutter-md">
          <q-input
            v-model="email"
            label="Email"
            type="email"
            outlined
            dense
            :rules="[val => !!val || 'Required']"
          />
          <q-btn
            type="submit"
            label="Send Reset Link"
            color="primary"
            class="full-width"
            :loading="loading"
            unelevated
          />
        </q-form>
      </q-card-section>

      <q-card-section v-else class="text-center">
        <q-icon name="check_circle" color="positive" size="48px" class="q-mb-md" />
        <div class="text-body1">If an account exists for <strong>{{ email }}</strong>, a reset link has been sent.</div>
        <div class="text-caption text-grey-6 q-mt-sm">Check your email and follow the link to reset your password.</div>
      </q-card-section>

      <q-card-section class="text-center q-pt-none">
        <router-link to="/login" class="text-primary">Back to Sign In</router-link>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useQuasar } from 'quasar';
import { authApi } from '@/services/api/auth.api';

const $q = useQuasar();
const email = ref('');
const loading = ref(false);
const sent = ref(false);

async function handleSubmit() {
  loading.value = true;
  try {
    await authApi.forgotPassword(email.value);
    sent.value = true;
  } catch (err: unknown) {
    const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to send reset link';
    $q.notify({ type: 'negative', message });
  } finally {
    loading.value = false;
  }
}
</script>
