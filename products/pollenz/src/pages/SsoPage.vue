<template>
  <div class="flex flex-center" style="min-height: 100vh; background: linear-gradient(160deg, #fffbeb 0%, #fef3c7 100%)">
    <q-spinner-hourglass color="amber" size="48px" />
    <div v-if="error" class="text-negative q-mt-md">{{ error }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useUserStore } from '@/stores/user.store';
import { authApi } from '@/services/api/auth.api';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();
const error = ref('');

onMounted(async () => {
  const token = route.query.token as string;
  const refresh = route.query.refresh as string;
  const redirect = (route.query.redirect as string) || '/';

  if (!token || !refresh) {
    error.value = 'Missing token or refresh parameter';
    setTimeout(() => router.push('/login'), 2000);
    return;
  }

  try {
    // Validate the token by calling /auth/me
    const { data: user } = await authApi.getMe(token);

    // Store auth in Pollenz localStorage
    userStore.accessToken = token;
    userStore.refreshTokenValue = refresh;
    userStore.user = user;
    localStorage.setItem('pz_access_token', token);
    localStorage.setItem('pz_refresh_token', refresh);
    localStorage.setItem('pz_user', JSON.stringify(user));

    // Redirect
    if (user.mustChangePassword) {
      router.replace('/change-password');
    } else {
      router.replace(redirect);
    }
  } catch {
    error.value = 'Invalid or expired token';
    setTimeout(() => router.push('/login'), 2000);
  }
});
</script>
