<template>
  <q-page class="q-pa-lg">
    <h4 class="text-h4 text-weight-bold q-mb-md q-mt-none">My Account</h4>

    <div class="row q-col-gutter-md" style="max-width: 700px;">
      <!-- Profile Info (from /auth/me) -->
      <div class="col-12">
        <q-card flat bordered class="q-pa-lg">
          <div class="text-subtitle1 text-weight-bold q-mb-md">Profile</div>

          <div v-if="loadingProfile" class="text-center q-pa-md">
            <q-spinner-gears size="32px" color="brown-8" />
          </div>

          <template v-else-if="profile">
            <div class="row q-col-gutter-md">
              <div class="col-12 col-sm-6">
                <q-input :model-value="profile.name" outlined dense label="Name" readonly />
              </div>
              <div class="col-12 col-sm-6">
                <q-input :model-value="profile.email" outlined dense label="Email" readonly />
              </div>
              <div class="col-12 col-sm-6">
                <q-input :model-value="profile.role" outlined dense label="Role" readonly />
              </div>
              <div class="col-12 col-sm-6">
                <q-input :model-value="(profile.products || []).join(', ')" outlined dense label="Products" readonly />
              </div>
            </div>
            <p class="text-caption text-grey-6 q-mt-sm">
              To update your name or email, contact support.
            </p>
          </template>
        </q-card>
      </div>

      <!-- Change Password -->
      <div class="col-12">
        <q-card flat bordered class="q-pa-lg">
          <div class="text-subtitle1 text-weight-bold q-mb-md">Change Password</div>

          <q-input
            v-model="currentPassword"
            outlined dense
            :type="showCurrent ? 'text' : 'password'"
            label="Current password"
            class="q-mb-md"
            :disable="changingPassword"
          >
            <template #append>
              <q-icon :name="showCurrent ? 'visibility_off' : 'visibility'" class="cursor-pointer" @click="showCurrent = !showCurrent" />
            </template>
          </q-input>

          <q-input
            v-model="newPassword"
            outlined dense
            :type="showNew ? 'text' : 'password'"
            label="New password"
            class="q-mb-md"
            :disable="changingPassword"
          >
            <template #append>
              <q-icon :name="showNew ? 'visibility_off' : 'visibility'" class="cursor-pointer" @click="showNew = !showNew" />
            </template>
          </q-input>

          <q-btn
            color="brown-8"
            no-caps
            label="Update Password"
            :loading="changingPassword"
            :disable="!currentPassword || newPassword.length < 8"
            @click="handleChangePassword"
          />
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from 'src/stores/auth'
import { Notify } from 'quasar'
import axios from 'axios'

const authStore = useAuthStore()

// Profile
const profile = ref<any>(null)
const loadingProfile = ref(true)

onMounted(async () => {
  try {
    const { data } = await axios.get('/auth/me', {
      headers: { Authorization: `Bearer ${authStore.accessToken}` },
    })
    profile.value = data
  } catch {
    profile.value = authStore.user
  } finally {
    loadingProfile.value = false
  }
})

// Change password
const currentPassword = ref('')
const newPassword = ref('')
const showCurrent = ref(false)
const showNew = ref(false)
const changingPassword = ref(false)

async function handleChangePassword() {
  changingPassword.value = true
  try {
    await authStore.changePassword(currentPassword.value, newPassword.value)
    Notify.create({ type: 'positive', message: 'Password updated!' })
    currentPassword.value = ''
    newPassword.value = ''
  } catch (err: any) {
    Notify.create({ type: 'negative', message: err?.response?.data?.error || 'Failed to change password' })
  } finally {
    changingPassword.value = false
  }
}
</script>
