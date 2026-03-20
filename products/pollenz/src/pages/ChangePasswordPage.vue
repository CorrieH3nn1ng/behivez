<template>
  <div class="flex flex-center" style="min-height: 100vh; background: linear-gradient(160deg, #fffbeb 0%, #fef3c7 100%)">
    <q-card style="width: 400px; max-width: 90vw" class="q-pa-lg">
      <q-card-section class="text-center">
        <q-icon name="hive" size="36px" color="amber" class="q-mb-sm" />
        <div class="text-h4 text-primary text-weight-bold q-mb-xs">Pollenz</div>
        <div class="text-subtitle2 text-grey-7">Change your password</div>
        <div v-if="userStore.mustChangePassword" class="text-caption text-warning q-mt-sm">
          You must change your password before continuing.
        </div>
      </q-card-section>

      <q-card-section>
        <q-form @submit="handleChange" class="q-gutter-md">
          <q-input
            v-model="currentPassword"
            label="Current Password"
            type="password"
            outlined
            dense
            :rules="[val => !!val || 'Required']"
          />
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
            label="Confirm New Password"
            type="password"
            outlined
            dense
            :rules="[val => val === newPassword || 'Passwords must match']"
          />
          <q-btn
            type="submit"
            label="Change Password"
            color="primary"
            class="full-width"
            :loading="loading"
            unelevated
          />
        </q-form>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useUserStore } from '@/stores/user.store';

const router = useRouter();
const $q = useQuasar();
const userStore = useUserStore();

const currentPassword = ref('');
const newPassword = ref('');
const confirmPassword = ref('');
const loading = ref(false);

async function handleChange() {
  loading.value = true;
  try {
    await userStore.changePassword(currentPassword.value, newPassword.value);
    $q.notify({ type: 'positive', message: 'Password changed successfully' });
    router.push('/');
  } catch (err: unknown) {
    const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to change password';
    $q.notify({ type: 'negative', message });
  } finally {
    loading.value = false;
  }
}
</script>
