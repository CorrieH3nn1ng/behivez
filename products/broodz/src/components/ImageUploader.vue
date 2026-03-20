<template>
  <div
    class="image-uploader cursor-pointer"
    :class="{ wide: aspect === 'wide' }"
    @click="triggerUpload"
  >
    <input ref="fileInput" type="file" accept="image/*" :capture="isMobile ? 'environment' : undefined" hidden @change="handleFile" />
    <img v-if="currentUrl" :src="currentUrl" class="preview-img" alt="Upload preview" />
    <div v-else class="placeholder flex flex-center column">
      <q-icon name="add_photo_alternate" size="32px" color="brown-4" />
      <span class="text-caption text-grey-6">{{ isMobile ? 'Tap to upload' : 'Upload' }}</span>
    </div>
    <q-linear-progress v-if="uploading" :value="progress / 100" color="amber" class="progress-bar" />
    <div v-if="error" class="error-overlay flex flex-center column">
      <q-icon name="error" size="24px" color="negative" />
      <span class="text-caption text-negative">{{ error }}</span>
      <q-btn flat dense size="xs" label="Retry" color="negative" @click.stop="triggerUpload" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useQuasar } from 'quasar'
import { useApi } from 'src/composables/useApi'
import { Notify } from 'quasar'

const props = defineProps<{
  currentUrl?: string | null
  endpoint: string
  aspect?: 'square' | 'wide'
}>()

const emit = defineEmits<{ uploaded: [url: string] }>()

const $q = useQuasar()
const { upload } = useApi()
const fileInput = ref<HTMLInputElement | null>(null)
const uploading = ref(false)
const progress = ref(0)
const error = ref('')

const isMobile = computed(() => $q.platform.is.mobile)

function triggerUpload() {
  error.value = ''
  fileInput.value?.click()
}

async function handleFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return

  // Validate file size (max 10MB)
  if (file.size > 10 * 1024 * 1024) {
    error.value = 'Max 10MB'
    Notify.create({ type: 'warning', message: 'Image must be under 10MB' })
    return
  }

  // Validate file type
  if (!file.type.startsWith('image/')) {
    error.value = 'Images only'
    Notify.create({ type: 'warning', message: 'Please select an image file' })
    return
  }

  uploading.value = true
  progress.value = 0
  error.value = ''

  const fd = new FormData()
  fd.append('file', file)

  try {
    const data = await upload<{ url: string }>(props.endpoint, fd, (pct) => { progress.value = pct })
    emit('uploaded', data.url)
  } catch {
    error.value = 'Upload failed'
    Notify.create({ type: 'negative', message: 'Upload failed. Please try again.' })
  } finally {
    uploading.value = false
    progress.value = 0
    if (fileInput.value) fileInput.value.value = ''
  }
}
</script>

<style lang="scss" scoped>
.image-uploader {
  width: 120px;
  height: 120px;
  border: 2px dashed #bcaaa4;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  transition: border-color 0.2s;

  &:hover {
    border-color: #5d4037;
  }

  &.wide {
    width: 100%;
    height: 140px;
  }
}

.preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.placeholder {
  width: 100%;
  height: 100%;
}

.progress-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
}

.error-overlay {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.9);
}
</style>
