<template>
  <q-page class="q-pa-lg">
    <div class="row items-center q-mb-md">
      <h4 class="text-h5 text-weight-bold q-mt-none q-mb-none col">Portfolio</h4>
      <q-btn-dropdown color="brown-8" no-caps icon="add" label="Add">
        <q-list>
          <q-item clickable v-close-popup @click="() => triggerUpload()">
            <q-item-section avatar><q-icon name="cloud_upload" /></q-item-section>
            <q-item-section>Upload Photo / Video</q-item-section>
          </q-item>
          <q-item clickable v-close-popup @click="() => triggerUpload(true)">
            <q-item-section avatar><q-icon name="photo_camera" /></q-item-section>
            <q-item-section>Take Photo / Record Video</q-item-section>
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

    <!-- Hidden file inputs -->
    <input ref="fileInput" type="file" accept="image/*,video/*" multiple hidden @change="handleFiles" />
    <input ref="cameraInput" type="file" accept="image/*,video/*" capture="environment" hidden @change="handleFiles" />

    <!-- Drop Zone -->
    <div
      class="drop-zone q-mb-md rounded-borders q-pa-lg text-center"
      :class="{ 'drop-zone--active': isDragging }"
      @dragenter.prevent="isDragging = true"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="handleDrop"
    >
      <q-icon name="cloud_upload" size="40px" :color="isDragging ? 'amber' : 'grey-5'" />
      <p class="text-body2 q-mt-sm q-mb-none" :class="isDragging ? 'text-brown-8' : 'text-grey-6'">
        {{ isDragging ? 'Drop files here' : 'Drag & drop photos or videos here' }}
      </p>
      <p class="text-caption text-grey-5 q-mb-none">Photos up to 20MB · Videos up to 100MB</p>
    </div>

    <!-- Upload Progress -->
    <div v-if="uploadQueue.length" class="q-mb-md">
      <div v-for="(job, idx) in uploadQueue" :key="idx" class="row items-center q-mb-xs q-pa-sm bg-grey-1 rounded-borders">
        <q-icon
          :name="job.status === 'done' ? 'check_circle' : job.status === 'error' ? 'error' : 'upload_file'"
          :color="job.status === 'done' ? 'positive' : job.status === 'error' ? 'negative' : 'grey-6'"
          size="20px"
          class="q-mr-sm"
        />
        <span class="text-body2 col ellipsis">{{ job.name }}</span>
        <span class="text-caption text-grey-6 q-mr-sm">{{ formatFileSize(job.size) }}</span>
        <q-linear-progress
          v-if="job.status === 'uploading'"
          :value="job.progress / 100"
          color="amber"
          style="width: 80px;"
          rounded
        />
        <q-icon v-if="job.status === 'error'" name="replay" color="negative" class="cursor-pointer" @click="retryUpload(idx)" />
      </div>
    </div>

    <div v-if="loading" class="flex flex-center q-pa-xl">
      <q-spinner-gears size="48px" color="brown-8" />
    </div>

    <div v-else-if="!filteredItems.length" class="text-center q-pa-xl text-grey-6">
      <q-icon name="photo_library" size="48px" class="q-mb-md" />
      <p class="text-h6">No portfolio items yet</p>
      <p>Upload your best work or add social posts to showcase on your storefront.</p>
    </div>

    <!-- Draggable Grid -->
    <draggable
      v-else
      v-model="items"
      item-key="id"
      handle=".drag-handle"
      ghost-class="drag-ghost"
      class="row q-col-gutter-md"
      @end="onDragEnd"
    >
      <template #item="{ element: item }">
        <div v-show="filter === 'all' || item.type === filter" class="col-6 col-sm-4 col-md-3">
          <q-card flat bordered class="portfolio-card" style="border-radius: 8px;">
            <!-- Drag Handle -->
            <div class="drag-handle q-pa-xs text-center cursor-grab" style="background: #f5f5f5; border-bottom: 1px solid #e0e0e0;">
              <q-icon name="drag_indicator" size="16px" color="grey-5" />
            </div>

            <!-- Image thumbnail -->
            <q-img
              v-if="item.type === 'image'"
              :src="item.thumbnail_url || item.url"
              :ratio="1"
              :alt="item.title || 'Portfolio item'"
              class="cursor-pointer"
              @click="previewItem(item)"
            />

            <!-- Video thumbnail with play overlay -->
            <div
              v-else-if="item.type === 'video'"
              class="video-thumb cursor-pointer"
              style="aspect-ratio: 1; position: relative; overflow: hidden;"
              @click="previewItem(item)"
            >
              <q-img
                v-if="item.thumbnail_url"
                :src="item.thumbnail_url"
                :ratio="1"
                :alt="item.title || 'Video'"
              />
              <div v-else class="flex flex-center bg-brown-1" style="width: 100%; height: 100%;">
                <q-icon name="videocam" size="36px" color="brown-4" />
              </div>
              <!-- Play button overlay -->
              <div class="absolute-center">
                <q-icon name="play_circle_filled" size="48px" color="white" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));" />
              </div>
              <!-- Duration badge -->
              <div v-if="item.duration" class="absolute-bottom-right q-pa-xs">
                <q-badge color="dark" class="text-caption">{{ formatDuration(item.duration) }}</q-badge>
              </div>
            </div>

            <!-- Social embed icon -->
            <div
              v-else-if="item.type === 'embed'"
              class="flex flex-center column bg-blue-grey-1 cursor-pointer"
              style="aspect-ratio: 1;"
              @click="previewItem(item)"
            >
              <q-icon :name="platformIcon(item.platform)" size="36px" color="blue-grey-6" />
              <span class="text-caption text-grey-7 q-mt-xs">{{ item.platform }}</span>
            </div>

            <!-- Title -->
            <div v-if="item.title" class="text-caption text-center ellipsis q-pa-xs">{{ item.title }}</div>

            <!-- Actions -->
            <q-card-actions class="q-pa-xs justify-end">
              <q-btn flat dense size="sm" icon="edit" @click="editItem(item)" />
              <q-btn flat dense size="sm" icon="delete" color="negative" @click="deleteItem(item.id)" />
            </q-card-actions>
          </q-card>
        </div>
      </template>
    </draggable>

    <!-- Preview Dialog -->
    <q-dialog v-model="previewDialog" maximized>
      <q-card class="bg-black text-white column no-wrap">
        <q-bar class="bg-transparent">
          <span v-if="previewTarget?.title" class="text-body2">{{ previewTarget.title }}</span>
          <q-space />
          <q-btn dense flat icon="close" color="white" v-close-popup />
        </q-bar>
        <div class="col flex flex-center q-pa-md">
          <template v-if="previewTarget">
            <img
              v-if="previewTarget.type === 'image'"
              :src="previewTarget.url"
              :alt="previewTarget.title || ''"
              style="max-width: 100%; max-height: 80vh; object-fit: contain;"
            />
            <video
              v-else-if="previewTarget.type === 'video'"
              :src="previewTarget.url"
              controls
              autoplay
              style="max-width: 100%; max-height: 80vh;"
            />
            <iframe
              v-else-if="previewTarget.type === 'embed'"
              :src="previewTarget.embed_url || previewTarget.url"
              frameborder="0"
              allowfullscreen
              style="width: 100%; max-width: 500px; height: 70vh;"
            />
          </template>
        </div>
        <div v-if="previewTarget?.description" class="text-center q-pb-md text-caption text-grey-5">
          {{ previewTarget.description }}
        </div>
      </q-card>
    </q-dialog>

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
import draggable from 'vuedraggable'

const { upload: apiUpload } = useApi()

const loading = ref(true)
const items = ref<(PortfolioItem & { duration?: number })[]>([])
const fileInput = ref<HTMLInputElement | null>(null)
const cameraInput = ref<HTMLInputElement | null>(null)
const filter = ref('all')
const isDragging = ref(false)

// Upload queue
interface UploadJob {
  name: string
  size: number
  file: File
  progress: number
  status: 'pending' | 'uploading' | 'done' | 'error'
}
const uploadQueue = ref<UploadJob[]>([])

// Edit dialog
const editDialog = ref(false)
const savingEdit = ref(false)
const editForm = reactive({ id: 0, title: '', description: '' })

// Social dialog
const socialDialog = ref(false)
const savingSocial = ref(false)
const socialForm = reactive({ platform: 'tiktok', url: '', title: '' })

// Preview dialog
const previewDialog = ref(false)
const previewTarget = ref<(PortfolioItem & { duration?: number }) | null>(null)

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
    Notify.create({ type: 'negative', message: 'Failed to load portfolio' })
  } finally {
    loading.value = false
  }
}

onMounted(loadItems)

// --- Upload ---

function triggerUpload(camera = false) {
  if (camera) {
    cameraInput.value?.click()
  } else {
    fileInput.value?.click()
  }
}

function handleDrop(e: DragEvent) {
  isDragging.value = false
  const files = e.dataTransfer?.files
  if (files?.length) {
    processFiles(Array.from(files))
  }
}

function handleFiles(e: Event) {
  const files = (e.target as HTMLInputElement).files
  if (files?.length) {
    processFiles(Array.from(files))
  }
  // Reset input so same file can be re-selected
  if (fileInput.value) fileInput.value.value = ''
  if (cameraInput.value) cameraInput.value.value = ''
}

async function processFiles(files: File[]) {
  // Validate file sizes
  const validFiles: File[] = []
  for (const file of files) {
    const isVideo = file.type.startsWith('video')
    const maxSize = isVideo ? 100 * 1024 * 1024 : 20 * 1024 * 1024
    if (file.size > maxSize) {
      Notify.create({
        type: 'warning',
        message: `${file.name} is too large (${formatFileSize(file.size)}). Max: ${isVideo ? '100MB' : '20MB'}`,
      })
      continue
    }
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      Notify.create({ type: 'warning', message: `${file.name} is not a photo or video` })
      continue
    }
    validFiles.push(file)
  }

  if (!validFiles.length) return

  // Add to queue
  const startIdx = uploadQueue.value.length
  for (const file of validFiles) {
    uploadQueue.value.push({
      name: file.name,
      size: file.size,
      file,
      progress: 0,
      status: 'pending',
    })
  }

  // Upload sequentially
  for (let i = startIdx; i < uploadQueue.value.length; i++) {
    await uploadFile(i)
  }

  // Reload items after all uploads
  await loadItems()

  // Clear completed after a delay
  setTimeout(() => {
    uploadQueue.value = uploadQueue.value.filter(j => j.status !== 'done')
  }, 3000)
}

async function uploadFile(idx: number) {
  const job = uploadQueue.value[idx]
  if (!job) return

  job.status = 'uploading'
  job.progress = 0

  const fd = new FormData()
  fd.append('file', job.file)
  fd.append('type', job.file.type.startsWith('video') ? 'video' : 'image')

  try {
    await apiUpload('/bz-media-upload', fd, (pct) => {
      job.progress = pct
    })
    job.status = 'done'
    job.progress = 100
  } catch {
    job.status = 'error'
    Notify.create({ type: 'negative', message: `Failed to upload ${job.name}` })
  }
}

async function retryUpload(idx: number) {
  await uploadFile(idx)
  if (uploadQueue.value[idx]?.status === 'done') {
    await loadItems()
  }
}

// --- Drag & Drop Reorder ---

async function onDragEnd() {
  // Send batch reorder with new indices
  const reorderItems = items.value.map((item, idx) => ({
    id: item.id,
    sort_order: idx,
  }))

  try {
    await api.post('/bz-media-reorder', { items: reorderItems })
  } catch {
    Notify.create({ type: 'negative', message: 'Failed to save order' })
    await loadItems() // reload to reset
  }
}

// --- Preview ---

function previewItem(item: PortfolioItem & { duration?: number }) {
  previewTarget.value = item
  previewDialog.value = true
}

// --- Edit ---

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

// --- Delete ---

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

// --- Social Embed ---

function openSocialEmbed() {
  socialForm.platform = 'tiktok'
  socialForm.url = ''
  socialForm.title = ''
  socialDialog.value = true
}

function extractEmbedUrl(platform: string, url: string): string {
  if (platform === 'youtube') {
    const match = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
    if (match) return `https://www.youtube.com/embed/${match[1]}`
  }
  if (platform === 'tiktok') {
    const match = url.match(/video\/(\d+)/)
    if (match) return `https://www.tiktok.com/embed/v2/${match[1]}`
  }
  if (platform === 'instagram') {
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

// --- Helpers ---

function platformIcon(platform: string | null) {
  const map: Record<string, string> = {
    tiktok: 'fab fa-tiktok',
    instagram: 'fab fa-instagram',
    youtube: 'fab fa-youtube',
  }
  return platform ? (map[platform] || 'link') : 'link'
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}
</script>

<style lang="scss" scoped>
.drop-zone {
  border: 2px dashed #bcaaa4;
  transition: all 0.2s;
  background: #fafaf8;

  &--active {
    border-color: #f59e0b;
    background: #fffbeb;
  }

  &:hover {
    border-color: #5d4037;
  }
}

.portfolio-card {
  transition: box-shadow 0.2s;

  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
  }
}

.drag-ghost {
  opacity: 0.4;
}

.drag-handle {
  &:active {
    cursor: grabbing;
  }
}

.cursor-grab {
  cursor: grab;
}
</style>
