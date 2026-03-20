<template>
  <q-page padding>
    <div class="text-h5 text-weight-bold q-mb-md">Profile</div>

    <q-card flat bordered class="q-pa-md">
      <div class="flex flex-center q-mb-md">
        <q-avatar size="80px" color="primary" text-color="white" class="text-h4">
          {{ authStore.user?.name?.charAt(0) || '?' }}
        </q-avatar>
      </div>

      <q-list>
        <q-item>
          <q-item-section avatar><q-icon name="person" /></q-item-section>
          <q-item-section>
            <q-item-label caption>Name</q-item-label>
            <q-item-label>{{ authStore.user?.name }}</q-item-label>
          </q-item-section>
        </q-item>
        <q-item>
          <q-item-section avatar><q-icon name="email" /></q-item-section>
          <q-item-section>
            <q-item-label caption>Email</q-item-label>
            <q-item-label>{{ authStore.user?.email }}</q-item-label>
          </q-item-section>
        </q-item>
        <q-item>
          <q-item-section avatar><q-icon name="workspace_premium" /></q-item-section>
          <q-item-section>
            <q-item-label caption>Plan</q-item-label>
            <q-item-label>
              <q-badge :color="authStore.isFleetPlan ? 'primary' : 'grey'" :label="authStore.user?.plan === 'fleet' ? 'Fleet' : 'Solo'" />
            </q-item-label>
          </q-item-section>
        </q-item>
        <q-item v-if="authStore.isFleetPlan">
          <q-item-section avatar><q-icon name="business" /></q-item-section>
          <q-item-section>
            <q-item-label caption>Fleet Name</q-item-label>
            <q-item-label>{{ authStore.user?.fleetName || 'Not set' }}</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>

      <q-separator class="q-my-md" />
      <q-btn color="negative" outline class="full-width" icon="logout" label="Logout" @click="logout" />
    </q-card>

    <div class="text-center text-caption text-grey-5 q-mt-lg">Swarmz v1.0.0</div>
  </q-page>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useAuthStore } from 'stores/auth';

const router = useRouter();
const authStore = useAuthStore();

async function logout() {
  await authStore.logout();
  router.push({ name: 'login' });
}
</script>
