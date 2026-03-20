<template>
  <div class="row q-gutter-sm q-mt-sm" v-if="hasLinks">
    <q-btn
      v-for="(url, platform) in links"
      :key="platform"
      flat round dense
      :icon="iconMap[platform] || 'link'"
      :href="url"
      target="_blank"
      rel="noopener noreferrer"
      color="brown-8"
      size="sm"
    >
      <q-tooltip>{{ String(platform).charAt(0).toUpperCase() + String(platform).slice(1) }}</q-tooltip>
    </q-btn>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ links: Record<string, string> }>()

const iconMap: Record<string, string> = {
  facebook: 'fab fa-facebook',
  instagram: 'fab fa-instagram',
  tiktok: 'fab fa-tiktok',
  twitter: 'fab fa-twitter',
  youtube: 'fab fa-youtube',
  linkedin: 'fab fa-linkedin',
  whatsapp: 'fab fa-whatsapp',
  website: 'language',
}

const hasLinks = computed(() => Object.values(props.links).some(v => !!v))
</script>
