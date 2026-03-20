<template>
  <q-page padding>
    <div class="text-h5 q-mb-md">My Profile</div>

    <q-form @submit="handleSave">
      <!-- Profile Type -->
      <q-card class="q-mb-md">
        <q-card-section>
          <div class="text-h6 q-mb-sm">I am a...</div>
          <q-btn-toggle
            v-model="form.profile_type"
            spread
            no-caps
            rounded
            unelevated
            toggle-color="primary"
            :options="[
              { label: 'Freelancer / Business', value: 'freelancer' },
              { label: 'Salary Earner', value: 'salary' },
            ]"
            class="q-mb-xs"
          />
          <div class="text-caption text-grey-6">
            This controls which features are shown in the sidebar
          </div>
        </q-card-section>
      </q-card>

      <!-- Personal Details -->
      <q-card class="q-mb-md">
        <q-card-section>
          <div class="text-h6 q-mb-sm">Personal Details</div>
          <div class="row q-col-gutter-md">
            <div class="col-12 col-sm-6">
              <q-input v-model="form.name" label="Full Name" outlined dense :rules="[v => !!v || 'Required']" />
            </div>
            <div class="col-12 col-sm-6">
              <q-input v-model="form.email" label="Email" type="email" outlined dense :rules="[v => !!v || 'Required']" />
            </div>
            <div class="col-12 col-sm-6">
              <q-input v-model="form.phone" label="Phone" outlined dense />
            </div>
            <div class="col-12 col-sm-6">
              <q-input v-model="form.date_of_birth" label="Date of Birth" type="date" outlined dense />
            </div>
            <div class="col-12 col-sm-6">
              <q-input v-model="form.id_number" label="SA ID Number" outlined dense maxlength="13" mask="#############" />
            </div>
            <div class="col-12 col-sm-6">
              <q-select
                v-model="form.preferred_language"
                :options="languages"
                label="Preferred Language"
                outlined
                dense
                emit-value
                map-options
              />
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- Address -->
      <q-card class="q-mb-md">
        <q-card-section>
          <div class="text-h6 q-mb-sm">Address</div>
          <div class="row q-col-gutter-md">
            <div class="col-12">
              <q-input v-model="form.address" label="Street Address" type="textarea" outlined dense autogrow rows="2" />
            </div>
            <div class="col-12 col-sm-4">
              <q-input v-model="form.city" label="City" outlined dense />
            </div>
            <div class="col-12 col-sm-4">
              <q-select
                v-model="form.province"
                :options="provinces"
                label="Province"
                outlined
                dense
              />
            </div>
            <div class="col-12 col-sm-4">
              <q-input v-model="form.postal_code" label="Postal Code" outlined dense />
            </div>
            <div class="col-12 col-sm-6">
              <q-input v-model="form.country" label="Country" outlined dense />
            </div>
          </div>
        </q-card-section>
      </q-card>

      <div class="row justify-end q-mb-lg">
        <q-btn type="submit" color="primary" label="Save Profile" :loading="saving" unelevated />
      </div>
    </q-form>

    <!-- Change Password -->
    <q-card class="q-mb-md">
      <q-card-section>
        <div class="text-h6 q-mb-sm">Change Password</div>
        <q-form @submit="handleChangePassword" class="row q-col-gutter-md">
          <div class="col-12 col-sm-4">
            <q-input v-model="passwordForm.currentPassword" label="Current Password" type="password" outlined dense :rules="[v => !!v || 'Required']" />
          </div>
          <div class="col-12 col-sm-4">
            <q-input v-model="passwordForm.newPassword" label="New Password" type="password" outlined dense :rules="[v => v.length >= 8 || 'Min 8 characters']" />
          </div>
          <div class="col-12 col-sm-4">
            <q-input v-model="passwordForm.confirmPassword" label="Confirm New Password" type="password" outlined dense :rules="[v => v === passwordForm.newPassword || 'Must match']" />
          </div>
          <div class="col-12">
            <q-btn type="submit" color="warning" label="Change Password" :loading="changingPassword" unelevated />
          </div>
        </q-form>
      </q-card-section>
    </q-card>

    <!-- About -->
    <q-card>
      <q-card-section>
        <div class="text-h6 q-mb-sm">About</div>
        <div class="text-body2 text-grey-7">Pollenz v1.0</div>
        <div class="text-caption text-grey-5">Finance & tax management for South African freelancers</div>
        <div class="text-caption text-grey-5 q-mt-xs">Member since {{ memberSince }}</div>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { useUserStore } from '@/stores/user.store';
import apiClient from '@/services/api/client';

const $q = useQuasar();
const userStore = useUserStore();
const saving = ref(false);
const changingPassword = ref(false);

const provinces = [
  'Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal',
  'Limpopo', 'Mpumalanga', 'North West', 'Northern Cape', 'Western Cape',
];

const languages = [
  { label: 'English', value: 'en' },
  { label: 'Afrikaans', value: 'af' },
  { label: 'Zulu', value: 'zu' },
  { label: 'Xhosa', value: 'xh' },
  { label: 'Sotho', value: 'st' },
  { label: 'Tswana', value: 'tn' },
];

const form = ref({
  name: '',
  email: '',
  phone: '',
  date_of_birth: '',
  id_number: '',
  address: '',
  city: '',
  province: '',
  postal_code: '',
  country: 'South Africa',
  preferred_language: 'en',
  profile_type: null as string | null,
});

const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
});

const memberSince = computed(() => {
  if (!userStore.user?.created_at) return '';
  return new Date(userStore.user.created_at).toLocaleDateString('en-ZA', { year: 'numeric', month: 'long' });
});

async function handleSave() {
  saving.value = true;
  try {
    const res = await apiClient.put<{ data: Record<string, unknown> }>('/auth/profile', form.value);
    // Profile data lives in Laravel — update local store name/email if changed
    if (userStore.user) {
      userStore.user.name = form.value.name;
      userStore.user.email = form.value.email;
      localStorage.setItem('pz_user', JSON.stringify(userStore.user));
    }
    $q.notify({ type: 'positive', message: 'Profile saved' });
  } catch (err: unknown) {
    const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to save';
    $q.notify({ type: 'negative', message });
  } finally {
    saving.value = false;
  }
}

async function handleChangePassword() {
  changingPassword.value = true;
  try {
    await userStore.changePassword(passwordForm.value.currentPassword, passwordForm.value.newPassword);
    passwordForm.value = { currentPassword: '', newPassword: '', confirmPassword: '' };
    $q.notify({ type: 'positive', message: 'Password changed' });
  } catch (err: unknown) {
    const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to change password';
    $q.notify({ type: 'negative', message });
  } finally {
    changingPassword.value = false;
  }
}

onMounted(async () => {
  try {
    const res = await apiClient.get<{ data: Record<string, string | null> }>('/auth/user');
    const u = res.data.data;
    form.value = {
      name: u.name || '',
      email: u.email || '',
      phone: u.phone || '',
      date_of_birth: u.date_of_birth || '',
      id_number: u.id_number || '',
      address: u.address || '',
      city: u.city || '',
      province: u.province || '',
      postal_code: u.postal_code || '',
      country: u.country || 'South Africa',
      preferred_language: u.preferred_language || 'en',
      profile_type: u.profile_type || null,
    };
  } catch { /* user data from store */ }
});
</script>
