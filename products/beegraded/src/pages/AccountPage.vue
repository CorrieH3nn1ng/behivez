<template>
  <q-page class="honeycomb-bg q-pa-lg">
    <div style="max-width: 700px; margin: 0 auto;">
      <h2 class="text-h4 text-weight-bold q-mb-md" style="color: #78350f;">
        {{ lang === 'af' ? 'My Rekening' : 'My Account' }}
      </h2>

      <!-- Profile Info -->
      <q-card flat class="bee-card q-pa-lg q-mb-md">
        <div class="text-subtitle1 text-weight-bold q-mb-md" style="color: #78350f;">
          <q-icon name="person" color="amber" class="q-mr-sm" />
          {{ lang === 'af' ? 'Profiel' : 'Profile' }}
        </div>

        <div v-if="loadingProfile" class="text-center q-pa-md">
          <q-spinner-gears size="32px" color="amber" />
        </div>

        <template v-else-if="profile">
          <div class="row q-col-gutter-md">
            <div class="col-12 col-sm-6">
              <q-input :model-value="profile.name" outlined dense :label="lang === 'af' ? 'Naam' : 'Name'" readonly />
            </div>
            <div class="col-12 col-sm-6">
              <q-input :model-value="profile.email" outlined dense :label="lang === 'af' ? 'E-pos' : 'Email'" readonly />
            </div>
          </div>
        </template>
      </q-card>

      <!-- Language Preference -->
      <q-card flat class="bee-card q-pa-lg q-mb-md">
        <div class="text-subtitle1 text-weight-bold q-mb-xs" style="color: #78350f;">
          <q-icon name="language" color="amber" class="q-mr-sm" />
          {{ lang === 'af' ? 'Voorkeur Taal' : 'Preferred Language' }}
        </div>
        <div class="text-caption text-grey-6 q-mb-md">
          {{ lang === 'af'
            ? 'Hierdie taal word gebruik vir die koppelvlak en as verstek vir nuwe kinders se toetse.'
            : 'This language is used for the interface and as the default for new children\'s tests.' }}
        </div>

        <div class="row q-gutter-sm">
          <q-btn
            v-for="l in languageOptions"
            :key="l.value"
            no-caps
            :outline="selectedLang !== l.value"
            :class="selectedLang === l.value ? 'btn-bee' : ''"
            :color="selectedLang === l.value ? undefined : 'grey-7'"
            @click="setPreferredLanguage(l.value)"
            :loading="savingLang === l.value"
            class="col"
            style="min-height: 56px;"
          >
            <div>
              <div class="text-weight-bold">{{ l.label }}</div>
              <div class="text-caption" style="opacity: 0.7;">{{ l.native }}</div>
            </div>
          </q-btn>
        </div>
      </q-card>

      <!-- Children (edit grade, language) -->
      <q-card v-if="children.length > 0" flat class="bee-card q-pa-lg q-mb-md">
        <div class="text-subtitle1 text-weight-bold q-mb-md" style="color: #78350f;">
          <q-icon name="child_care" color="amber" class="q-mr-sm" />
          {{ lang === 'af' ? 'Kinders' : 'Children' }}
        </div>

        <q-card
          v-for="child in children"
          :key="child.id"
          flat bordered
          class="q-pa-md q-mb-sm"
          style="border-color: #f5f0e8; border-radius: 8px;"
        >
          <div class="text-weight-bold q-mb-sm">{{ child.name }}</div>
          <div class="row q-gutter-sm">
            <q-select
              v-model="child.grade"
              outlined dense
              :label="lang === 'af' ? 'Graad' : 'Grade'"
              :options="gradeOptions"
              emit-value map-options
              class="col"
              @update:model-value="updateChild(child)"
            />
            <q-select
              v-model="child.language"
              outlined dense
              :label="lang === 'af' ? 'Taal' : 'Language'"
              :options="languageOptions.map(l => ({ label: l.label, value: l.value }))"
              emit-value map-options
              class="col"
              @update:model-value="updateChild(child)"
            />
          </div>
          <div v-if="child.saved" class="text-caption text-positive q-mt-xs">
            <q-icon name="check" size="14px" /> {{ lang === 'af' ? 'Gestoor' : 'Saved' }}
          </div>
        </q-card>
      </q-card>

      <!-- Learn a Language -->
      <q-card flat class="bee-card q-pa-lg q-mb-md">
        <div class="text-subtitle1 text-weight-bold q-mb-xs" style="color: #78350f;">
          <q-icon name="school" color="amber" class="q-mr-sm" />
          {{ lang === 'af' ? 'Leer \'n Taal' : 'Learn a Language' }}
        </div>
        <div class="text-caption text-grey-6 q-mb-md">
          {{ lang === 'af' ? 'Leer nuwe woorde met flitskaarte en vasvrae' : 'Learn new words with flashcards and quizzes' }}
        </div>
        <div class="row q-gutter-sm">
          <q-btn outline color="cyan-8" no-caps icon="translate" label="Setswana" class="col" to="/workspace/learn/setswana" />
          <q-btn outline color="orange-8" no-caps icon="auto_stories" label="Afrikaans" class="col" to="/workspace/learn/afrikaans" />
          <q-btn outline color="purple" no-caps icon="menu_book" label="English" class="col" to="/workspace/learn/english" />
        </div>
      </q-card>

      <!-- Change Password -->
      <q-card flat class="bee-card q-pa-lg q-mb-md">
        <div class="text-subtitle1 text-weight-bold q-mb-md" style="color: #78350f;">
          <q-icon name="lock" color="amber" class="q-mr-sm" />
          {{ lang === 'af' ? 'Verander Wagwoord' : 'Change Password' }}
        </div>

        <q-input
          v-model="currentPassword"
          outlined dense
          :type="showCurrent ? 'text' : 'password'"
          :label="lang === 'af' ? 'Huidige wagwoord' : 'Current password'"
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
          :label="lang === 'af' ? 'Nuwe wagwoord (min 8 karakters)' : 'New password (min 8 characters)'"
          class="q-mb-md"
          :disable="changingPassword"
        >
          <template #append>
            <q-icon :name="showNew ? 'visibility_off' : 'visibility'" class="cursor-pointer" @click="showNew = !showNew" />
          </template>
        </q-input>

        <q-btn
          class="btn-bee"
          no-caps
          :label="lang === 'af' ? 'Dateer Wagwoord Op' : 'Update Password'"
          :loading="changingPassword"
          :disable="!currentPassword || newPassword.length < 8"
          @click="handleChangePassword"
        />
      </q-card>

      <!-- Logout -->
      <q-btn
        flat no-caps
        color="red-4"
        icon="logout"
        :label="lang === 'af' ? 'Teken Uit' : 'Sign Out'"
        class="full-width q-mt-sm"
        @click="handleLogout"
      />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'src/i18n'
import { useAuthStore } from 'src/stores/auth'
import { backendApi } from 'src/boot/axios'
import { useChildren } from 'src/composables/useChildren'
import { Notify } from 'quasar'
import axios from 'axios'

const { lang, setLanguage } = useI18n()
const authStore = useAuthStore()
const router = useRouter()
const { listChildren, updateChild: updateChildApi } = useChildren()

// Profile
const profile = ref<any>(null)
const loadingProfile = ref(true)

// Language
const selectedLang = ref('af')
const savingLang = ref('')
const languageOptions = [
  { label: 'Afrikaans', native: 'Afrikaans', value: 'af' },
  { label: 'English', native: 'English', value: 'en' },
  { label: 'Setswana', native: 'Setswana', value: 'tn' },
]

// Children
const children = ref<any[]>([])
const gradeOptions = Array.from({ length: 12 }, (_, i) => ({
  label: `Gr ${i + 1}`,
  value: i + 1,
}))

// Password
const currentPassword = ref('')
const newPassword = ref('')
const showCurrent = ref(false)
const showNew = ref(false)
const changingPassword = ref(false)

async function setPreferredLanguage(newLang: string) {
  savingLang.value = newLang
  try {
    await backendApi.patch('/profile', { language: newLang })
    selectedLang.value = newLang
    setLanguage(newLang)
    Notify.create({
      type: 'positive',
      message: newLang === 'af' ? 'Taal opgedateer' : newLang === 'tn' ? 'Puo e fetoletswe' : 'Language updated',
      timeout: 1500,
    })
  } catch {
    Notify.create({ type: 'negative', message: 'Could not update language' })
  } finally {
    savingLang.value = ''
  }
}

async function updateChild(child: any) {
  try {
    await updateChildApi(child.id, { grade: child.grade, language: child.language })
    child.saved = true
    setTimeout(() => { child.saved = false }, 2000)
  } catch {
    Notify.create({ type: 'negative', message: lang.value === 'af' ? 'Kon nie opdateer nie' : 'Could not update' })
  }
}

async function handleChangePassword() {
  changingPassword.value = true
  try {
    await authStore.changePassword(currentPassword.value, newPassword.value)
    Notify.create({ type: 'positive', message: lang.value === 'af' ? 'Wagwoord opgedateer!' : 'Password updated!' })
    currentPassword.value = ''
    newPassword.value = ''
  } catch (err: any) {
    Notify.create({ type: 'negative', message: err?.response?.data?.error || 'Failed to change password' })
  } finally {
    changingPassword.value = false
  }
}

async function handleLogout() {
  await authStore.logout()
  router.push({ name: 'landing' })
}

onMounted(async () => {
  // Load auth profile
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

  // Load local profile (language preference)
  try {
    const { data } = await backendApi.get('/profile')
    selectedLang.value = data.language || 'af'
    setLanguage(data.language || 'af')
  } catch { /* use default */ }

  // Load children
  try {
    const data = await listChildren()
    children.value = (data.children || []).map((c: any) => ({ ...c, saved: false }))
  } catch { /* no children yet */ }
})
</script>
