<template>
  <div>
    <div class="row q-col-gutter-sm">
      <div v-for="(item, idx) in displayItems" :key="item.id" class="col-6 col-sm-4 col-md-3">
        <q-card flat bordered class="cursor-pointer gallery-item" @click="openLightbox(idx)">
          <q-img
            v-if="item.type === 'image'"
            :src="item.thumbnail_url || item.url"
            :alt="item.title || 'Portfolio item'"
            :ratio="1"
            class="rounded-borders"
          />
          <div v-else-if="item.type === 'video'" class="video-thumb flex flex-center" style="aspect-ratio: 1;">
            <q-icon name="play_circle" size="48px" color="white" />
          </div>
          <div v-else-if="item.type === 'embed'" class="embed-thumb flex flex-center column" style="aspect-ratio: 1;">
            <q-icon :name="platformIcon(item.platform)" size="36px" color="white" />
            <span class="text-caption text-white q-mt-xs">{{ item.platform }}</span>
          </div>
          <div v-if="item.title" class="text-caption text-center q-pa-xs ellipsis">{{ item.title }}</div>
        </q-card>
      </div>
    </div>

    <!-- Lightbox -->
    <q-dialog v-model="lightboxOpen" maximized>
      <q-card class="bg-black text-white column no-wrap">
        <q-bar class="bg-transparent">
          <q-space />
          <q-btn dense flat icon="close" color="white" v-close-popup />
        </q-bar>
        <div class="col flex flex-center q-pa-md">
          <template v-if="currentItem">
            <img
              v-if="currentItem.type === 'image'"
              :src="currentItem.url"
              :alt="currentItem.title || 'Portfolio image'"
              style="max-width: 100%; max-height: 80vh; object-fit: contain;"
            />
            <video
              v-else-if="currentItem.type === 'video'"
              :src="currentItem.url"
              controls
              style="max-width: 100%; max-height: 80vh;"
            />
            <iframe
              v-else-if="currentItem.type === 'embed'"
              :src="currentItem.embed_url || ''"
              frameborder="0"
              allowfullscreen
              style="width: 100%; max-width: 500px; height: 70vh;"
            />
          </template>
        </div>
        <div class="row justify-center q-pa-sm q-gutter-sm">
          <q-btn flat round icon="chevron_left" color="white" :disable="currentIdx <= 0" @click="currentIdx--" />
          <span class="self-center">{{ currentIdx + 1 }} / {{ displayItems.length }}</span>
          <q-btn flat round icon="chevron_right" color="white" :disable="currentIdx >= displayItems.length - 1" @click="currentIdx++" />
        </div>
        <div v-if="currentItem?.title" class="text-center q-pb-md">
          <div class="text-subtitle1">{{ currentItem.title }}</div>
          <div v-if="currentItem.description" class="text-caption text-grey-5">{{ currentItem.description }}</div>
        </div>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { PortfolioItem } from 'src/stores/talent'

const props = withDefaults(defineProps<{
  items: PortfolioItem[]
  previewMode?: boolean
}>(), {
  previewMode: false,
})

const displayItems = computed(() => props.previewMode ? props.items.slice(0, 6) : props.items)

const lightboxOpen = ref(false)
const currentIdx = ref(0)
const currentItem = computed(() => displayItems.value[currentIdx.value] || null)

function openLightbox(idx: number) {
  currentIdx.value = idx
  lightboxOpen.value = true
}

function platformIcon(platform: string | null) {
  const map: Record<string, string> = {
    tiktok: 'fab fa-tiktok',
    instagram: 'fab fa-instagram',
    youtube: 'fab fa-youtube',
  }
  return platform ? (map[platform] || 'link') : 'link'
}
</script>

<style lang="scss" scoped>
.gallery-item {
  border-radius: 8px;
  overflow: hidden;
  transition: transform 0.2s;

  &:hover {
    transform: scale(1.03);
  }
}

.video-thumb {
  background: linear-gradient(135deg, #3e2723, #5d4037);
}

.embed-thumb {
  background: linear-gradient(135deg, #37474f, #546e7a);
}
</style>
