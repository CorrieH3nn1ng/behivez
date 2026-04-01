<template>
  <q-layout view="hHh lpR fFf">
    <q-header class="text-white" :style="headerStyle" bordered>
      <q-toolbar>
        <q-btn flat dense round icon="menu" @click="drawer = !drawer" />
        <q-btn flat dense no-caps to="/" class="q-ml-sm" :style="{ color: accentColor }">
          <q-icon name="storefront" size="24px" class="q-mr-xs" />
          <span class="text-weight-bold">Broodz</span>
        </q-btn>

        <q-space />

        <q-btn
          v-if="talentStore.mine?.slug"
          flat dense no-caps
          icon="visibility"
          :label="$q.screen.gt.xs ? 'View Storefront' : ''"
          :to="'/' + talentStore.mine.slug"
          class="q-mr-sm"
          :style="{ color: subtleColor }"
        />
        <q-btn flat dense icon="logout" :style="{ color: subtleColor }" @click="handleLogout" />
      </q-toolbar>
    </q-header>

    <q-drawer v-model="drawer" bordered :width="240" :style="sidebarStyle">
      <q-list padding>
        <q-item-label header class="text-weight-bold" :style="{ color: accentColor }">Dashboard</q-item-label>

        <q-item clickable v-ripple to="/dashboard" exact @click="closeMobile" :active-class="'bz-nav-active-' + themeKey">
          <q-item-section avatar><q-icon name="home" :color="iconColor" /></q-item-section>
          <q-item-section :style="{ color: navTextColor }">Home</q-item-section>
        </q-item>

        <q-item clickable v-ripple to="/dashboard/profile" @click="closeMobile" :active-class="'bz-nav-active-' + themeKey">
          <q-item-section avatar><q-icon name="person" :color="iconColor" /></q-item-section>
          <q-item-section :style="{ color: navTextColor }">My Profile</q-item-section>
        </q-item>

        <q-item clickable v-ripple to="/dashboard/services" @click="closeMobile" :active-class="'bz-nav-active-' + themeKey">
          <q-item-section avatar><q-icon name="handyman" :color="iconColor" /></q-item-section>
          <q-item-section :style="{ color: navTextColor }">Services</q-item-section>
        </q-item>

        <q-item clickable v-ripple to="/dashboard/shop" @click="closeMobile" :active-class="'bz-nav-active-' + themeKey">
          <q-item-section avatar><q-icon name="shopping_bag" :color="iconColor" /></q-item-section>
          <q-item-section :style="{ color: navTextColor }">Shop</q-item-section>
        </q-item>

        <q-item clickable v-ripple to="/dashboard/portfolio" @click="closeMobile" :active-class="'bz-nav-active-' + themeKey">
          <q-item-section avatar><q-icon name="photo_library" :color="iconColor" /></q-item-section>
          <q-item-section :style="{ color: navTextColor }">Portfolio</q-item-section>
        </q-item>

        <q-item clickable v-ripple to="/dashboard/video-editor" @click="closeMobile" :active-class="'bz-nav-active-' + themeKey">
          <q-item-section avatar><q-icon name="movie" :color="iconColor" /></q-item-section>
          <q-item-section :style="{ color: navTextColor }">Video Editor</q-item-section>
          <q-item-section side><q-badge color="amber-8" text-color="white" label="New" /></q-item-section>
        </q-item>

        <q-item clickable v-ripple to="/dashboard/enquiries" @click="closeMobile" :active-class="'bz-nav-active-' + themeKey">
          <q-item-section avatar><q-icon name="mail" :color="iconColor" /></q-item-section>
          <q-item-section :style="{ color: navTextColor }">Enquiries</q-item-section>
        </q-item>

        <q-separator class="q-my-sm" :style="{ background: separatorColor }" />

        <q-item clickable v-ripple @click="openFinances">
          <q-item-section avatar><q-icon name="payments" :color="iconColor" /></q-item-section>
          <q-item-section :style="{ color: navTextColor }">My Finances</q-item-section>
          <q-item-section side><q-icon name="open_in_new" size="16px" :style="{ color: subtleColor }" /></q-item-section>
        </q-item>

        <q-separator class="q-my-sm" :style="{ background: separatorColor }" />

        <q-item clickable v-ripple to="/dashboard/account" @click="closeMobile" :active-class="'bz-nav-active-' + themeKey">
          <q-item-section avatar><q-icon name="manage_accounts" :color="iconColor" /></q-item-section>
          <q-item-section :style="{ color: navTextColor }">Account</q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useAuthStore } from 'src/stores/auth'
import { useTalentStore } from 'src/stores/talent'

const drawer = ref(true)
const authStore = useAuthStore()
const talentStore = useTalentStore()
const router = useRouter()
const $q = useQuasar()

// Theme configuration — matches the storefront themes
const themes: Record<string, {
  headerBg: string
  sidebarBg: string
  accent: string
  navText: string
  subtle: string
  icon: string
  separator: string
  activeClass: string
}> = {
  earth: {
    headerBg: '#2d2013',
    sidebarBg: '#2d2013',
    accent: '#f0a030',
    navText: '#c0b0a0',
    subtle: '#806858',
    icon: 'grey-5',
    separator: '#3a3040',
    activeClass: 'rgba(240, 160, 48, 0.1)',
  },
  ocean: {
    headerBg: '#1a2f38',
    sidebarBg: '#1a2f38',
    accent: '#00bcd4',
    navText: '#90caf9',
    subtle: '#546e7a',
    icon: 'blue-grey-4',
    separator: '#263d47',
    activeClass: 'rgba(0, 188, 212, 0.1)',
  },
  sunset: {
    headerBg: '#3e1a0a',
    sidebarBg: '#3e1a0a',
    accent: '#ff9800',
    navText: '#ffcc80',
    subtle: '#8d6e63',
    icon: 'orange-3',
    separator: '#4a2510',
    activeClass: 'rgba(255, 152, 0, 0.1)',
  },
  forest: {
    headerBg: '#0d2818',
    sidebarBg: '#0d2818',
    accent: '#8bc34a',
    navText: '#a5d6a7',
    subtle: '#4a6741',
    icon: 'green-4',
    separator: '#1a3a22',
    activeClass: 'rgba(139, 195, 74, 0.1)',
  },
  slate: {
    headerBg: '#1a2027',
    sidebarBg: '#1a2027',
    accent: '#90a4ae',
    navText: '#b0bec5',
    subtle: '#546e7a',
    icon: 'blue-grey-4',
    separator: '#2a3540',
    activeClass: 'rgba(144, 164, 174, 0.1)',
  },
  blossom: {
    headerBg: '#2d0a1e',
    sidebarBg: '#2d0a1e',
    accent: '#f48fb1',
    navText: '#f8bbd0',
    subtle: '#8e4162',
    icon: 'pink-3',
    separator: '#3d1a2e',
    activeClass: 'rgba(244, 143, 177, 0.1)',
  },
}

const themeKey = computed(() => {
  const raw = talentStore.mine?.theme || 'earth'
  // Strip "-light" suffix — dashboard always uses the dark variant
  return raw.replace('-light', '')
})

const currentTheme = computed(() => themes[themeKey.value] || themes.earth)

const headerStyle = computed(() => ({ background: currentTheme.value.headerBg }))
const sidebarStyle = computed(() => ({ background: currentTheme.value.sidebarBg }))
const accentColor = computed(() => currentTheme.value.accent)
const navTextColor = computed(() => currentTheme.value.navText)
const subtleColor = computed(() => currentTheme.value.subtle)
const iconColor = computed(() => currentTheme.value.icon)
const separatorColor = computed(() => currentTheme.value.separator)

onMounted(async () => {
  try {
    await talentStore.fetchMine()
  } catch {
    // talent stub may not exist yet
  }
})

function closeMobile() {
  if ($q.screen.lt.md) {
    drawer.value = false
  }
}

function openFinances() {
  closeMobile()
  const token = process.env.CLIENT ? localStorage.getItem('bz_access_token') : ''
  const refresh = process.env.CLIENT ? localStorage.getItem('bz_refresh_token') : ''
  window.open(`https://pollenz.co.za/sso?token=${token}&refresh=${refresh}`, '_blank')
}

function handleLogout() {
  authStore.logout()
  router.push({ name: 'landing' })
}
</script>

<style lang="scss">
// Dynamic active classes for each theme
.bz-nav-active-earth {
  background: rgba(240, 160, 48, 0.1) !important;
  .q-item-section--side .q-icon { color: #f0a030 !important; }
  .q-item-section:not(.q-item-section--side) { color: #f0a030 !important; font-weight: 700; }
}
.bz-nav-active-ocean {
  background: rgba(0, 188, 212, 0.1) !important;
  .q-item-section--side .q-icon { color: #00bcd4 !important; }
  .q-item-section:not(.q-item-section--side) { color: #00bcd4 !important; font-weight: 700; }
}
.bz-nav-active-sunset {
  background: rgba(255, 152, 0, 0.1) !important;
  .q-item-section--side .q-icon { color: #ff9800 !important; }
  .q-item-section:not(.q-item-section--side) { color: #ff9800 !important; font-weight: 700; }
}
.bz-nav-active-forest {
  background: rgba(139, 195, 74, 0.1) !important;
  .q-item-section--side .q-icon { color: #8bc34a !important; }
  .q-item-section:not(.q-item-section--side) { color: #8bc34a !important; font-weight: 700; }
}
.bz-nav-active-slate {
  background: rgba(144, 164, 174, 0.1) !important;
  .q-item-section--side .q-icon { color: #90a4ae !important; }
  .q-item-section:not(.q-item-section--side) { color: #90a4ae !important; font-weight: 700; }
}
.bz-nav-active-blossom {
  background: rgba(244, 143, 177, 0.1) !important;
  .q-item-section--side .q-icon { color: #f48fb1 !important; }
  .q-item-section:not(.q-item-section--side) { color: #f48fb1 !important; font-weight: 700; }
}
</style>
