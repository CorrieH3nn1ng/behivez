<template>
  <q-page class="q-pa-lg">
    <div class="row items-center q-mb-md">
      <h4 class="text-h5 text-weight-bold q-mt-none q-mb-none col">Portfolio</h4>
      <q-btn-dropdown color="brown-8" no-caps icon="add" label="Add">
        <q-list>
          <q-item clickable v-close-popup @click="triggerUpload">
            <q-item-section avatar><q-icon name="cloud_upload" /></q-item-section>
            <q-item-section>Upload Photo / Video</q-item-section>
          </q-item>
          <q-item clickable v-close-popup @click="openSocialEmbed">
            <q-item-section avatar><q-icon name="link" /></q-item-section>
            <q-item-section>Add Social Post</q-item-section>
          </q-item>
        </q-list>
      </q-btn-dropdown>
    </div>

    <!-- Filter Tabs -->
    <q-tabs v-model="filter" no-caps active-color="brown-8" indicator-color="amber" class="q-mb-md text-grey-8">
      <q-tab name="all" label="All" />
      <q-tab name="image" label="Photos" />
      <q-tab name="video" label="Videos" />
      <q-tab name="embed" label="Social" />
    </q-tabs>

    <!-- Upload Zone (hidden input) -->
    <input ref="fileInput" type="file" accept="image/*,video/*" multiple hidden @change="handleFiles" />

    <q-linear-progress v-if="uploading" :value="uploadProgress / 100" color="amber" class="q-mb-md" />

    <div v-if="loading" class="flex flex-center q-pa-xl">
      <q-spinner-gears size="48px" color="brown-8" />
    </div>

    <div v-else-if="!filteredItems.length" class="text-center q-pa-xl text-grey-6">
      <q-icon name="photo_library" size="48px" class="q-mb-md" />
      <p class="text-h6">No portfolio items yet</p>
      <p>Upload your best work or add social posts to showcase on your storefront.</p>
    </div>

    <!-- Grid -->
    <div v-else class="row q-col-gutter-md">
      <div v-for="(item, idx) in filteredItems" :key="item.id" class="col-6 col-sm-4 col-md-3">
        <q-card flat bordered class="q-pa-xs" style="border-radius: 8px;">
          <q-img v-if="item.type === 'image'" :src="item.thumbnail_url || item.url" :ratio="1" :alt="item.title || 'Portfolio item'" />
          <div v-else-if="item.type === 'video'" class="flex flex-center bg-brown-1" style="aspect-ratio: 1;">
            <q-icon name="videocam" size="36px" color="brown-4" />
          </div>
          <div v-else-if="item.type === 'embed'" class="flex flex-center column bg-blue-grey-1" style="aspect-ratio: 1;">
            <q-icon :name="platformIcon(item.platform)" size="36px" color="blue-grey-6" />
            <span class="text-caption text-grey-7 q-mt-xs">{{ item.platform }}</span>
          </div>
          <q-card-actions class="q-pa-xs">
            <q-btn flat dense size="sm" icon="arrow_back" :disable="idx === 0" @click="reorder(item.id, idx - 1)" />
            <q-btn flat dense size="sm" icon="arrow_forward" :disable="idx === filteredItems.length - 1" @click="reorder(item.id, idx + 1)" />
            <q-space />
            <q-btn flat dense size="sm" icon="edit" @click="editItem(item)" />
            <q-btn flat dense size="sm" icon="delete" color="negative" @click="deleteItem(item.id)" />
          </q-card-actions>
        </q-card>
      </div>
    </div>

    <!-- Edit Dialog -->
    <q-dialog v-model="editDialog">
      <q-card style="min-width: 350px;">
        <q-card-section class="text-h6">Edit Item</q-card-section>
        <q-card-section>
          <q-input v-model="editForm.title" label="Title" outlined dense class="q-mb-sm" />
          <q-input v-model="editForm.description" label="Description" type="textarea" outlined dense autogrow />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn color="brown-8" no-caps label="Save" @click="saveEdit" :loading="savingEdit" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Social Embed Dialog -->
    <q-dialog v-model="socialDialog">
      <q-card style="min-width: 400px;">
        <q-card-section class="text-h6">Add Social Post</q-card-section>
        <q-card-section>
          <q-select
            v-model="socialForm.platform"
            :options="['tiktok', 'instagram', 'youtube']"
            label="Platform"
            outlined dense
            class="q-mb-sm"
          />
          <q-input
            v-model="socialForm.url"
            label="Post URL"
            outlined dense
            placeholder="Paste the URL of your social post"
            hint="e.g. https://www.tiktok.com/@user/video/123..."
            class="q-mb-sm"
          />
          <q-input v-model="socialForm.title" label="Title (optional)" outlined dense />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn color="brown-8" no-caps label="Add" @click="saveSocialEmbed" :loading="savingSocial" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { api } from 'src/boot/axios'
import { useApi } from 'src/composables/useApi'
import { Notify, Dialog } from 'quasar'
import type { PortfolioItem } from 'src/stores/talent'

const { upload } = useApi()

const loading = ref(true)
const uploading = ref(false)
const uploadProgress = ref(0)
const items = ref<PortfolioItem[]>([])
const fileInput = ref<HTMLInputElement | null>(null)
const filter = ref('all')

const editDialog = ref(false)
const savingEdit = ref(false)
const editForm = reactive({ id: 0, title: '', description: '' })

const socialDialog = ref(false)
const savingSocial = ref(false)
const socialForm = reactive({ platform: 'tiktok', url: '', title: '' })

const filteredItems = computed(() => {
  if (filter.value === 'all') return items.value
  return items.value.filter(i => i.type === filter.value)
})

async function loadItems() {
  loading.value = true
  try {
    const { data } = await api.get('/bz-talent-mine')
    items.value = data.portfolio || []
  } catch {
    // ignore
  } finally {
    loading.value = false
  }
}

onMounted(loadItems)

function triggerUpload() {
  fileInput.value?.click()
}

async function handleFiles(e: Event) {
  const files = (e.target as HTMLInputElement).files
  if (!files?.length) return

  uploading.value = true
  uploadProgress.value = 0
  const total = files.length
  let done = 0

  for (const file of Array.from(files)) {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('type', file.type.startsWith('video') ? 'video' : 'image')
    try {
      await upload('/bz-media-upload', fd, (pct) => {
        uploadProgress.value = ((done + pct / 100) / total) * 100
      })
      done++
    } catch {
      Notify.create({ type: 'negative', message: `Failed to upload ${file.name}` })
    }
  }

  uploading.value = false
  uploadProgress.value = 0
  if (fileInput.value) fileInput.value.value = ''
  await loadItems()
}

function editItem(item: PortfolioItem) {
  editForm.id = item.id
  editForm.title = item.title || ''
  editForm.description = item.description || ''
  editDialog.value = true
}

async function saveEdit() {
  savingEdit.value = true
  try {
    await api.post('/bz-media-update', editForm)
    editDialog.value = false
    await loadItems()
    Notify.create({ type: 'positive', message: 'Updated' })
  } catch {
    Notify.create({ type: 'negative', message: 'Failed to update' })
  } finally {
    savingEdit.value = false
  }
}

function deleteItem(id: number) {
  Dialog.create({
    title: 'Delete Item',
    message: 'Remove this from your portfolio?',
    cancel: true,
  }).onOk(async () => {
    try {
      await api.post('/bz-media-delete', { id })
      items.value = items.value.filter(i => i.id !== id)
      Notify.create({ type: 'positive', message: 'Deleted' })
    } catch {
      Notify.create({ type: 'negative', message: 'Failed to delete' })
    }
  })
}

async function reorder(id: number, newIndex: number) {
  try {
    await api.post('/bz-media-reorder', { id, sort_order: newIndex })
    await loadItems()
  } catch {
    Notify.create({ type: 'negative', message: 'Failed to reorder' })
  }
}

function openSocialEmbed() {
  socialForm.platform = 'tiktok'
  socialForm.url = ''
  socialForm.title = ''
  socialDialog.value = true
}

function extractEmbedUrl(platform: string, url: string): string {
  if (platform === 'youtube') {
    // Extract video ID from YouTube URL
    const match = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
    if (match) return `https://www.youtube.com/embed/${match[1]}`
  }
  if (platform === 'tiktok') {
    // TikTok embed URL
    const match = url.match(/video\/(\d+)/)
    if (match) return `https://www.tiktok.com/embed/v2/${match[1]}`
  }
  if (platform === 'instagram') {
    // Instagram embed
    const match = url.match(/\/(p|reel)\/([^/?]+)/)
    if (match) return `https://www.instagram.com/${match[1]}/${match[2]}/embed`
  }
  return url
}

async function saveSocialEmbed() {
  if (!socialForm.url) {
    Notify.create({ type: 'warning', message: 'Please paste a URL' })
    return
  }

  savingSocial.value = true
  try {
    const embedUrl = extractEmbedUrl(socialForm.platform, socialForm.url)
    await api.post('/bz-media-upload', {
      type: 'embed',
      url: socialForm.url,
      embed_url: embedUrl,
      platform: socialForm.platform,
      title: socialForm.title || undefined,
    })
    socialDialog.value = false
    await loadItems()
    Notify.create({ type: 'positive', message: 'Social post added' })
  } catch {
    Notify.create({ type: 'negative', message: 'Failed to add social post' })
  } finally {
    savingSocial.value = false
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
</script>

<style lang="scss" scoped>
.upload-zone {
  border: 2px dashed #bcaaa4;
  transition: border-color 0.2s;

  &:hover {
    border-color: #5d4037;
  }
}
</style>
