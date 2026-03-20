<template>
  <div class="flex flex-center" style="min-height: 100vh; background: linear-gradient(160deg, #fffbeb 0%, #fef3c7 100%)">
    <q-card style="width: 400px; max-width: 90vw" class="q-pa-lg">
      <q-card-section class="text-center">
        <q-icon name="hive" size="36px" color="amber" class="q-mb-sm" />
        <div class="text-h4 text-primary text-weight-bold q-mb-xs">Pollenz</div>
        <div class="text-subtitle2 text-grey-7">Set your new password</div>
      </q-card-section>

      <q-card-section v-if="!done">
        <q-form @submit="handleReset" class="q-gutter-md">
          <q-input
            v-model="newPassword"
            label="New Password"
            type="password"
            outlined
            dense
            :rules="[val => val.length >= 8 || 'Min 8 characters']"
          />
          <q-input
            v-model="confirmPassword"
            label="Confirm Password"
            type="password"
            outlined
            dense
            :rules="[val => val === newPassword || 'Passwords must match']"
          />
          <q-btn
            type="submit"
            label="Reset Password"
            color="primary"
            class="full-width"
            :loading="loading"
            unelevated
          />
        </q-form>
      </q-card-section>

      <q-card-section v-else class="text-center">
        <q-icon name="check_circle" color="positive" size="48px" class="q-mb-md" />
        <div class="text-body1">Password reset successfully.</div>
        <div class="text-caption text-grey-6 q-mt-sm">You can now sign in with your new password.</div>
      </q-card-section>

      <q-card-section class="text-center q-pt-none">
        <router-link to="/login" class="text-primary">Back to Sign In</router-link>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRoute } from 'vue-router';
import { useQuasar } from 'quasar';
import { authApi } from '@/services/api/auth.api';

const route = useRoute();
const $q = useQuasar();
const newPassword = ref('');
const confirmPassword = ref('');
const loading = ref(false);
const done = ref(false);

async function handleReset() {
  const token = route.query.token as string;
  if (!token) {
    $q.notify({ type: 'negative', message: 'Invalid or missing reset token' });
    return;
  }
  loading.value = true;
  try {
    await authApi.resetPassword({ token, newPassword: newPassword.value });
    done.value = true;
  } catch (err: unknown) {
    const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to reset password';
    $q.notify({ type: 'negative', message });
  } finally {
    loading.value = false;
  }
}
</script>
