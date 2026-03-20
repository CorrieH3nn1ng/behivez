<template>
  <q-page v-if="talent">
    <!-- Header -->
    <div class="bg-brown-10 q-pa-lg">
      <div style="max-width: 1100px; margin: 0 auto;">
        <q-btn flat no-caps icon="arrow_back" :label="talent.name" color="amber" :to="'/' + talent.slug" class="q-mb-sm" />
        <h1 class="text-h4 text-weight-bold text-white q-mt-none q-mb-none">Gallery</h1>
      </div>
    </div>

    <div style="max-width: 1100px; margin: 0 auto;" class="q-pa-md">
      <!-- Filter Tabs -->
      <q-tabs v-model="filter" no-caps active-color="brown-8" indicator-color="amber" class="q-mb-md text-grey-8">
        <q-tab name="all" label="All" />
        <q-tab name="image" label="Photos" />
        <q-tab name="video" label="Videos" />
        <q-tab name="embed" label="Social" />
      </q-tabs>

      <div v-if="!filteredItems.length" class="text-center q-pa-xl text-grey-6">
        <q-icon name="photo_library" size="48px" class="q-mb-md" />
        <p class="text-h6">No items in this category</p>
      </div>

      <!-- Masonry-style Grid -->
      <div v-else class="gallery-grid">
        <div v-for="(item, idx) in filteredItems" :key="item.id" class="gallery-grid-item">
          <!-- Image -->
          <template v-if="item.type === 'image'">
            <q-img
              :src="item.thumbnail_url || item.url"
              :alt="item.title || talent.name + ' gallery'"
              class="rounded-borders cursor-pointer"
              @click="openLightbox(idx)"
            />
          </template>

          <!-- Video -->
          <template v-else-if="item.type === 'video'">
            <div class="video-thumb rounded-borders cursor-pointer" @click="openLightbox(idx)">
              <q-icon name="play_circle" size="48px" color="white" />
              <div v-if="item.title" class="text-caption text-white q-mt-xs">{{ item.title }}</div>
            </div>
          </template>

          <!-- Social Embed -->
          <template v-else-if="item.type === 'embed'">
            <div class="embed-container rounded-borders">
              <div class="embed-header q-pa-xs">
                <q-icon :name="platformIcon(item.platform)" size="16px" color="grey-7" />
                <span class="text-caption text-grey-7 q-ml-xs">{{ item.platform }}</span>
              </div>
              <iframe
                :src="item.embed_url || ''"
                frameborder="0"
                allowfullscreen
                loading="lazy"
                class="embed-iframe"
              />
            </div>
          </template>

          <div v-if="item.title && item.type !== 'embed'" class="text-caption text-center q-mt-xs ellipsis">{{ item.title }}</div>
        </div>
      </div>
    </div>

    <!-- Lightbox (images + videos only) -->
    <q-dialog v-model="lightboxOpen" maximized>
      <q-card class="bg-black text-white column no-wrap">
        <q-bar class="bg-transparent">
          <q-space />
          <q-btn dense flat icon="close" color="white" v-close-popup />
        </q-bar>
        <div class="col flex flex-center q-pa-md">
          <template v-if="lightboxItem">
            <img
              v-if="lightboxItem.type === 'image'"
              :src="lightboxItem.url"
              :alt="lightboxItem.title || ''"
              style="max-width: 100%; max-height: 80vh; object-fit: contain;"
            />
            <video v-else-if="lightboxItem.type === 'video'" :src="lightboxItem.url" controls style="max-width: 100%; max-height: 80vh;" />
          </template>
        </div>
        <div class="row justify-center q-pa-sm q-gutter-sm">
          <q-btn flat round icon="chevron_left" color="white" :disable="lightboxIdx <= 0" @click="lightboxIdx--" />
          <span class="self-center">{{ lightboxIdx + 1 }} / {{ lightboxItems.length }}</span>
          <q-btn flat round icon="chevron_right" color="white" :disable="lightboxIdx >= lightboxItems.length - 1" @click="lightboxIdx++" />
        </div>
        <div v-if="lightboxItem?.title" class="text-center q-pb-md">
          <div class="text-subtitle1">{{ lightboxItem.title }}</div>
          <div v-if="lightboxItem.description" class="text-caption text-grey-5">{{ lightboxItem.description }}</div>
        </div>
      </q-card>
    </q-dialog>
  </q-page>

  <!-- Loading -->
  <q-page v-else-if="loading" class="flex flex-center" style="min-height: 60vh;">
    <q-spinner-gears size="48px" color="brown-8" />
  </q-page>

  <!-- Not found -->
  <q-page v-else class="flex flex-center text-center" style="min-height: 60vh;">
    <div>
      <q-icon name="person_off" size="64px" color="grey-5" class="q-mb-md" />
      <p class="text-h6">Talent not found</p>
      <q-btn flat no-caps label="Browse Talents" to="/" color="brown-8" />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onServerPrefetch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useMeta } from 'quasar'
import { useTalentStore, type Talent, type PortfolioItem } from 'src/stores/talent'

const props = defineProps<{ slug: string }>()
const route = useRoute()
const talentStore = useTalentStore()

const talent = ref<Talent | null>(null)
const loading = ref(true)
const filter = ref('all')

const filteredItems = computed(() => {
  const items = talent.value?.portfolio || []
  if (filter.value === 'all') return items
  return items.filter(i => i.type === filter.value)
})

// Items eligible for lightbox (no embeds)
const lightboxItems = computed(() => filteredItems.value.filter(i => i.type !== 'embed'))

const lightboxOpen = ref(false)
const lightboxIdx = ref(0)
const lightboxItem = computed(() => lightboxItems.value[lightboxIdx.value] || null)

function openLightbox(filteredIdx: number) {
  const item = filteredItems.value[filteredIdx]
  if (!item || item.type === 'embed') return
  const lbIdx = lightboxItems.value.findIndex(i => i.id === item.id)
  if (lbIdx >= 0) {
    lightboxIdx.value = lbIdx
    lightboxOpen.value = true
  }
}

function platformIcon(platform: string | null) {
  const map: Record<string, string> = {
    tiktok: 'fab fa-tiktok',
    instagram: 'fab fa-instagram',
    youtube: 'fab fa-youtube',
  }
  return platform ? (map[platform] || 'link') : 'link'
}

// SEO
useMeta(() => {
  if (!talent.value) return { title: 'Gallery — Broodz' }
  const t = talent.value
  return {
    title: `${t.name} Gallery — Broodz`,
    meta: {
      ogTitle: { name: 'og:title', content: `${t.name} Gallery — Broodz` },
      ogDescription: { name: 'og:description', content: `Browse ${t.name}'s portfolio on Broodz` },
      ogImage: { name: 'og:image', content: t.profile_image || '' },
      ogUrl: { name: 'og:url', content: `https://broodz.co.za/${t.slug}/gallery` },
      ogType: { name: 'og:type', content: 'website' },
    },
    script: {
      ldJson: {
        type: 'application/ld+json',
        innerHTML: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'ImageGallery',
          name: `${t.name} Gallery`,
          url: `https://broodz.co.za/${t.slug}/gallery`,
          description: `Portfolio gallery of ${t.name} on Broodz`,
          creator: {
            '@type': 'Person',
            name: t.name,
          },
        }),
      },
    },
  }
})

async function loadTalent() {
  const slug = props.slug || (route.params.slug as string)
  try {
    talent.value = await talentStore.fetchBySlug(slug)
  } catch {
    talent.value = null
  } finally {
    loading.value = false
  }
}

onServerPrefetch(async () => { await loadTalent() })
onMounted(async () => {
  if (!talent.value) await loadTalent()
})
</script>

<style lang="scss" scoped>
.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
}

.gallery-grid-item {
  break-inside: avoid;
}

.video-thumb {
  aspect-ratio: 1;
  background: linear-gradient(135deg, #3e2723, #5d4037);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.embed-container {
  border: 1px solid #e0e0e0;
  overflow: hidden;
  background: #fafafa;
}

.embed-header {
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  align-items: center;
}

.embed-iframe {
  width: 100%;
  min-height: 320px;
  display: block;
}

@media (max-width: 599px) {
  .gallery-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }

  .embed-iframe {
    min-height: 280px;
  }
}
</style>
