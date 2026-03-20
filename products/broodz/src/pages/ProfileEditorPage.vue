<template>
  <q-page class="q-pa-lg">
    <h4 class="text-h5 text-weight-bold q-mb-md q-mt-none">Edit Profile</h4>

    <div v-if="loading" class="flex flex-center q-pa-xl">
      <q-spinner-gears size="48px" color="brown-8" />
    </div>

    <q-form v-else @submit.prevent="handleSave" style="max-width: 700px;">
      <!-- Images -->
      <div class="row q-col-gutter-md q-mb-lg">
        <div class="col-12 col-sm-4">
          <div class="text-subtitle2 q-mb-xs">Profile Photo</div>
          <image-uploader
            :current-url="form.profile_image"
            endpoint="/bz-profile-image"
            @uploaded="url => form.profile_image = url"
          />
          <div class="text-caption text-grey-6 q-mt-xs">Square photo works best</div>
        </div>
        <div class="col-12 col-sm-8">
          <div class="text-subtitle2 q-mb-xs">Cover Image</div>
          <image-uploader
            :current-url="form.cover_image"
            endpoint="/bz-cover-image"
            aspect="wide"
            @uploaded="url => form.cover_image = url"
          />
          <div class="text-caption text-grey-6 q-mt-xs">Wide banner shown at top of your storefront</div>
        </div>
      </div>

      <!-- Basic Info -->
      <q-input v-model="form.name" label="Display Name" outlined dense class="q-mb-md" :rules="[v => !!v || 'Required']" hint="Your name or business name" />

      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-12 col-sm-6">
          <q-input v-model="form.slug" label="URL slug" outlined dense hint="Letters, numbers, hyphens only">
            <template #prepend>
              <span class="text-caption text-grey-7">broodz.co.za/</span>
            </template>
            <template #append>
              <q-btn flat dense icon="check_circle" :color="slugAvailable === true ? 'positive' : 'grey'" @click="checkSlug" :loading="checkingSlug" />
            </template>
          </q-input>
          <div v-if="form.slug" class="text-caption text-brown-6 q-mt-xs">
            Preview: <strong>broodz.co.za/{{ form.slug }}</strong>
          </div>
        </div>
        <div class="col-12 col-sm-6">
          <q-select v-model="form.category_id" :options="categoryOptions" label="Category" outlined dense emit-value map-options />
        </div>
      </div>

      <q-input v-model="form.tagline" label="Tagline" outlined dense class="q-mb-md" hint="One-liner about what you do — shows below your name" />
      <q-input v-model="form.bio" label="What I Do" type="textarea" outlined dense autogrow class="q-mb-md" hint="Tell visitors about you — this is the first thing they read" />
      <q-input v-model="form.location" label="Location" outlined dense class="q-mb-md" placeholder="e.g. Johannesburg, Gauteng" hint="Helps people find you in their area" />

      <!-- Contact Details -->
      <div class="text-subtitle2 q-mb-sm q-mt-md">Contact Details</div>
      <div class="text-caption text-grey-6 q-mb-sm">These will be shown on your public storefront</div>
      <div class="row q-col-gutter-sm q-mb-lg">
        <div class="col-12 col-sm-4">
          <q-input v-model="form.phone" label="Phone" outlined dense placeholder="+27..." />
        </div>
        <div class="col-12 col-sm-4">
          <q-input v-model="form.email" label="Email" outlined dense />
        </div>
        <div class="col-12 col-sm-4">
          <q-input v-model="form.whatsapp" label="WhatsApp Number" outlined dense placeholder="+27..." hint="For the WhatsApp button" />
        </div>
      </div>

      <!-- Theme Picker -->
      <div class="q-mb-lg">
        <theme-picker v-model="form.theme" />
      </div>

      <!-- Social Links -->
      <div class="text-subtitle2 q-mb-sm">Social Links</div>
      <div class="row q-col-gutter-sm q-mb-lg">
        <div v-for="platform in socialPlatforms" :key="platform" class="col-12 col-sm-6">
          <q-input
            v-model="form.social_links[platform]"
            :label="platform.charAt(0).toUpperCase() + platform.slice(1)"
            outlined dense
            :placeholder="'https://...'"
          />
        </div>
      </div>

      <!-- Publish Toggle -->
      <q-toggle v-model="form.is_published" label="Publish storefront (visible to everyone)" color="positive" class="q-mb-lg" />

      <div class="row q-gutter-sm">
        <q-btn type="submit" color="brown-8" no-caps label="Save Profile" :loading="saving" />
        <q-btn v-if="talentStore.mine?.slug" flat no-caps :label="'Preview: /' + talentStore.mine.slug" :to="'/' + talentStore.mine.slug" color="brown-8" />
      </div>
    </q-form>
  </q-page>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useTalentStore } from 'src/stores/talent'
import ImageUploader from 'src/components/ImageUploader.vue'
import ThemePicker from 'src/components/ThemePicker.vue'
import { Notify } from 'quasar'

const talentStore = useTalentStore()
const loading = ref(true)
const saving = ref(false)
const checkingSlug = ref(false)
const slugAvailable = ref<boolean | null>(null)

const socialPlatforms = ['instagram', 'facebook', 'tiktok', 'whatsapp', 'youtube', 'linkedin', 'twitter', 'website']

const form = reactive({
  name: '',
  slug: '',
  tagline: '',
  bio: '',
  category_id: null as number | null,
  location: '',
  profile_image: '',
  cover_image: '',
  social_links: {} as Record<string, string>,
  is_published: false,
  theme: 'earth',
  phone: '',
  email: '',
  whatsapp: '',
})

const categoryOptions = computed(() =>
  talentStore.categories.map(c => ({ label: c.name, value: c.id }))
)

onMounted(async () => {
  try {
    await talentStore.fetchCategories()
    const t = await talentStore.fetchMine()
    if (t) {
      Object.assign(form, {
        name: t.name || '',
        slug: t.slug || '',
        tagline: t.tagline || '',
        bio: t.bio || '',
        category_id: t.category_id,
        location: t.location || '',
        profile_image: t.profile_image || '',
        cover_image: t.cover_image || '',
        social_links: { ...t.social_links },
        is_published: t.is_published,
        theme: t.theme || 'earth',
        phone: t.phone || '',
        email: t.email || '',
        whatsapp: t.whatsapp || '',
      })
    }
  } catch {
    // New user — form stays empty
  } finally {
    loading.value = false
  }
})

async function checkSlug() {
  if (!form.slug) return
  checkingSlug.value = true
  try {
    const res = await talentStore.checkSlug(form.slug)
    slugAvailable.value = res.available
    if (!res.available) {
      Notify.create({ type: 'warning', message: 'This slug is already taken' })
    }
  } catch {
    // ignore
  } finally {
    checkingSlug.value = false
  }
}

async function handleSave() {
  saving.value = true
  try {
    await talentStore.updateProfile({ ...form })
    if (form.is_published) {
      await talentStore.publish()
    } else {
      await talentStore.unpublish()
    }
    Notify.create({ type: 'positive', message: 'Profile saved!' })
  } catch {
    Notify.create({ type: 'negative', message: 'Failed to save profile' })
  } finally {
    saving.value = false
  }
}
</script>
