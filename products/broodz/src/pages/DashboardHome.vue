<template>
  <q-page class="q-pa-lg" style="background: #faf5ef;">
    <h4 class="text-h4 text-weight-bold q-mb-md q-mt-none" style="color: #2d2013;">
      Welcome{{ talentStore.mine?.name ? ', ' + talentStore.mine.name : '' }}!
    </h4>

    <div class="row q-col-gutter-md">
      <!-- Onboarding Checklist -->
      <div class="col-12 col-md-6">
        <q-card flat bordered class="q-pa-lg">
          <div class="text-subtitle1 text-weight-bold q-mb-sm">Setup Checklist</div>
          <q-list dense>
            <q-item v-for="step in checklist" :key="step.label">
              <q-item-section avatar>
                <q-icon :name="step.done ? 'check_circle' : 'radio_button_unchecked'" :color="step.done ? 'positive' : 'grey-5'" />
              </q-item-section>
              <q-item-section>
                <q-item-label :class="{ 'text-grey-5': step.done }">{{ step.label }}</q-item-label>
              </q-item-section>
              <q-item-section side v-if="!step.done && step.to">
                <q-btn flat dense no-caps size="sm" label="Do this" color="deep-orange-8" :to="step.to" />
              </q-item-section>
            </q-item>
          </q-list>
          <div class="q-mt-md">
            <q-linear-progress :value="checklistProgress" color="orange-8" class="q-mb-xs" />
            <div class="text-caption text-grey-7">{{ completedCount }}/{{ checklist.length }} completed</div>
          </div>
        </q-card>
      </div>

      <!-- Quick Links -->
      <div class="col-12 col-md-6">
        <q-card flat bordered class="q-pa-lg">
          <div class="text-subtitle1 text-weight-bold q-mb-sm">Quick Actions</div>
          <q-list>
            <q-item clickable v-ripple to="/dashboard/services">
              <q-item-section avatar><q-icon name="handyman" color="deep-orange-8" /></q-item-section>
              <q-item-section>
                <q-item-label>Manage Services</q-item-label>
                <q-item-label caption>Add or edit what you offer</q-item-label>
              </q-item-section>
            </q-item>
            <q-item clickable v-ripple to="/dashboard/shop">
              <q-item-section avatar><q-icon name="shopping_bag" color="deep-orange-8" /></q-item-section>
              <q-item-section>
                <q-item-label>Manage Shop</q-item-label>
                <q-item-label caption>Add products for sale</q-item-label>
              </q-item-section>
            </q-item>
            <q-item clickable v-ripple to="/dashboard/portfolio">
              <q-item-section avatar><q-icon name="photo_library" color="deep-orange-8" /></q-item-section>
              <q-item-section>
                <q-item-label>Upload Portfolio</q-item-label>
                <q-item-label caption>Showcase your best work</q-item-label>
              </q-item-section>
            </q-item>
            <q-item clickable v-ripple to="/dashboard/enquiries">
              <q-item-section avatar><q-icon name="mail" color="deep-orange-8" /></q-item-section>
              <q-item-section>
                <q-item-label>View Enquiries</q-item-label>
                <q-item-label caption>See messages from visitors</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card>
      </div>

      <!-- Storefront Link -->
      <div class="col-12 col-md-6" v-if="talentStore.mine?.slug">
        <q-card flat bordered class="q-pa-lg">
          <div class="text-subtitle1 text-weight-bold q-mb-sm">Your Storefront Link</div>
          <q-input :model-value="storefrontUrl" readonly outlined dense>
            <template #append>
              <q-btn flat dense icon="content_copy" @click="copyLink" />
            </template>
          </q-input>
          <div class="row q-gutter-sm q-mt-sm">
            <q-btn outline no-caps icon="fab fa-whatsapp" label="Share on WhatsApp" color="green" :href="whatsappShareUrl" target="_blank" size="sm" />
          </div>
          <p class="text-caption text-grey-7 q-mt-xs">
            Share this link on WhatsApp, Instagram, TikTok — anywhere!
          </p>
        </q-card>
      </div>

      <!-- My Finances (Pollenz link) -->
      <div class="col-12 col-md-6">
        <q-card flat bordered class="q-pa-lg">
          <div class="text-subtitle1 text-weight-bold q-mb-sm">My Finances</div>
          <p class="text-grey-7">Track your income, expenses, and invoices on Pollenz — your free financial dashboard.</p>
          <q-btn
            outline no-caps
            icon="payments"
            label="Open Pollenz"
            color="deep-orange-8"
            @click="openFinances"
          />
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useTalentStore } from 'src/stores/talent'
import { Notify, copyToClipboard } from 'quasar'

const talentStore = useTalentStore()

const storefrontUrl = computed(() => {
  const slug = talentStore.mine?.slug
  return slug ? `https://broodz.co.za/${slug}` : ''
})

const whatsappShareUrl = computed(() => {
  if (!talentStore.mine) return ''
  const text = encodeURIComponent(`Check out ${talentStore.mine.name} on Broodz: ${storefrontUrl.value}`)
  return `https://wa.me/?text=${text}`
})

const checklist = computed(() => {
  const t = talentStore.mine
  return [
    { label: 'Upload profile photo', done: !!t?.profile_image, to: '/dashboard/profile' },
    { label: 'Write your bio', done: !!t?.bio, to: '/dashboard/profile' },
    { label: 'Add at least 1 service', done: !!(t?.services?.length), to: '/dashboard/services' },
    { label: 'Upload portfolio item', done: !!(t?.portfolio?.length), to: '/dashboard/portfolio' },
    { label: 'Publish your storefront', done: !!t?.is_published, to: '/dashboard/profile' },
  ]
})

const completedCount = computed(() => checklist.value.filter(s => s.done).length)
const checklistProgress = computed(() => completedCount.value / checklist.value.length)

function openFinances() {
  const token = localStorage.getItem('bz_access_token') || ''
  const refresh = localStorage.getItem('bz_refresh_token') || ''
  window.open(`https://pollenz.co.za/sso?token=${token}&refresh=${refresh}`, '_blank')
}

async function copyLink() {
  await copyToClipboard(storefrontUrl.value)
  Notify.create({ type: 'positive', message: 'Link copied!' })
}
</script>
