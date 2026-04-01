<template>
  <q-page class="q-pa-md q-pa-lg-lg">
    <div class="row items-center q-mb-md">
      <h4 class="text-h5 text-weight-bold q-mt-none q-mb-none col">Video Editor</h4>
    </div>

    <!-- FFmpeg Loading Overlay -->
    <div v-if="ffmpegLoading" class="flex flex-center column q-pa-xl">
      <q-spinner-gears size="48px" color="brown-8" />
      <p class="text-body1 q-mt-md text-grey-7">Preparing video tools...</p>
      <p class="text-caption text-grey-5">First time may take a moment</p>
    </div>

    <q-stepper v-else v-model="step" animated color="brown-8" flat bordered class="rounded-borders">
      <!-- ========== STEP 1: Choose Clips ========== -->
      <q-step :name="1" title="Choose Clips" icon="video_library" :done="step > 1">
        <!-- Upload area -->
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
            {{ isDragging ? 'Drop videos here' : 'Drag & drop videos here' }}
          </p>
          <q-btn flat no-caps color="brown-8" label="Browse Files" icon="folder_open" class="q-mt-sm" @click="fileInput?.click()" />
          <q-btn flat no-caps color="brown-8" label="Record Video" icon="videocam" class="q-mt-sm q-ml-sm" @click="cameraInput?.click()" />
          <p class="text-caption text-grey-5 q-mb-none q-mt-xs">MP4, MOV, WebM — up to 100MB each</p>
        </div>

        <input ref="fileInput" type="file" accept="video/*" multiple hidden @change="handleFileInput" />
        <input ref="cameraInput" type="file" accept="video/*" capture="environment" hidden @change="handleFileInput" />

        <!-- Portfolio videos -->
        <div v-if="portfolioVideos.length" class="q-mb-md">
          <p class="text-subtitle2 text-grey-7 q-mb-sm">From your portfolio</p>
          <div class="row q-col-gutter-sm">
            <div v-for="vid in portfolioVideos" :key="'p-' + vid.id" class="col-6 col-sm-4 col-md-3">
              <q-card
                flat bordered
                class="clip-card cursor-pointer"
                :class="{ 'clip-card--selected': selectedIds.has('p-' + vid.id) }"
                @click="toggleSelect('p-' + vid.id)"
              >
                <div style="aspect-ratio: 16/9; position: relative; overflow: hidden; background: #1a1a1a;">
                  <q-img v-if="vid.thumbnail_url" :src="vid.thumbnail_url" :ratio="16/9" />
                  <div v-else class="flex flex-center" style="width:100%;height:100%;">
                    <q-icon name="videocam" size="32px" color="grey-6" />
                  </div>
                  <q-icon
                    v-if="selectedIds.has('p-' + vid.id)"
                    name="check_circle"
                    size="28px"
                    color="amber"
                    class="absolute-top-right q-ma-xs"
                    style="filter: drop-shadow(0 1px 3px rgba(0,0,0,0.5));"
                  />
                </div>
                <div class="text-caption text-center ellipsis q-pa-xs">{{ vid.title || 'Untitled' }}</div>
              </q-card>
            </div>
          </div>
        </div>

        <!-- Local uploads -->
        <div v-if="localClips.length" class="q-mb-md">
          <p class="text-subtitle2 text-grey-7 q-mb-sm">Uploaded clips</p>
          <div class="row q-col-gutter-sm">
            <div v-for="clip in localClips" :key="clip.id" class="col-6 col-sm-4 col-md-3">
              <q-card
                flat bordered
                class="clip-card cursor-pointer"
                :class="{ 'clip-card--selected': selectedIds.has(clip.id) }"
                @click="toggleSelect(clip.id)"
              >
                <div style="aspect-ratio: 16/9; position: relative; overflow: hidden; background: #1a1a1a;">
                  <video :src="clip.objectUrl" muted preload="metadata" style="width:100%;height:100%;object-fit:cover;" />
                  <q-icon
                    v-if="selectedIds.has(clip.id)"
                    name="check_circle"
                    size="28px"
                    color="amber"
                    class="absolute-top-right q-ma-xs"
                    style="filter: drop-shadow(0 1px 3px rgba(0,0,0,0.5));"
                  />
                </div>
                <div class="row items-center justify-between q-pa-xs">
                  <span class="text-caption ellipsis col">{{ clip.name }}</span>
                  <q-btn flat dense round size="xs" icon="close" color="negative" @click.stop="removeLocal(clip.id)" />
                </div>
              </q-card>
            </div>
          </div>
        </div>

        <div v-if="!portfolioVideos.length && !localClips.length && !loadingPortfolio" class="text-center q-pa-xl text-grey-6">
          <q-icon name="video_library" size="48px" class="q-mb-md" />
          <p class="text-h6">No videos yet</p>
          <p>Upload some video clips to get started, or add videos to your portfolio first.</p>
        </div>

        <q-stepper-navigation>
          <div class="row items-center">
            <q-badge v-if="selectedIds.size" color="brown-8" class="q-mr-sm">
              {{ selectedIds.size }} clip{{ selectedIds.size > 1 ? 's' : '' }} selected
            </q-badge>
            <q-space />
            <q-btn
              color="brown-8"
              no-caps
              label="Continue"
              icon-right="arrow_forward"
              :disable="!selectedIds.size"
              @click="goToTimeline"
            />
          </div>
        </q-stepper-navigation>
      </q-step>

      <!-- ========== STEP 2: Arrange & Trim ========== -->
      <q-step :name="2" title="Arrange & Trim" icon="content_cut" :done="step > 2">
        <p class="text-caption text-grey-6 q-mb-sm">Drag to reorder. Click a clip to trim it.</p>

        <div class="total-duration q-mb-md text-body2 text-grey-7">
          Total duration: <strong>{{ formatTime(totalTrimmedDuration) }}</strong>
        </div>

        <draggable v-model="timeline" item-key="id" handle=".drag-handle" ghost-class="drag-ghost" class="timeline-strip">
          <template #item="{ element: clip }">
            <div class="timeline-clip q-mb-sm">
              <q-card flat bordered class="rounded-borders">
                <div class="row items-center q-pa-sm" style="gap: 8px;">
                  <div class="drag-handle cursor-grab">
                    <q-icon name="drag_indicator" size="20px" color="grey-5" />
                  </div>
                  <div style="width: 80px; height: 45px; flex-shrink: 0; overflow: hidden; border-radius: 4px; background: #1a1a1a;">
                    <video
                      :src="clip.objectUrl"
                      muted preload="metadata"
                      style="width:100%;height:100%;object-fit:cover;"
                    />
                  </div>
                  <div class="col">
                    <div class="text-body2 ellipsis">{{ clip.name }}</div>
                    <div class="text-caption text-grey-6">
                      {{ formatTime(clip.trimStart) }} — {{ formatTime(clip.trimEnd) }}
                      ({{ formatTime(clip.trimEnd - clip.trimStart) }})
                    </div>
                  </div>
                  <q-btn
                    flat dense round
                    :icon="expandedClipId === clip.id ? 'expand_less' : 'expand_more'"
                    @click="expandedClipId = expandedClipId === clip.id ? null : clip.id"
                  />
                </div>

                <!-- Expanded trim controls -->
                <q-slide-transition>
                  <div v-if="expandedClipId === clip.id" class="q-pa-sm" style="border-top: 1px solid #e0e0e0;">
                    <video
                      :ref="(el) => { if (el) trimVideoRefs[clip.id] = el as HTMLVideoElement }"
                      :src="clip.objectUrl"
                      controls
                      preload="metadata"
                      style="width: 100%; max-height: 300px; background: #000; border-radius: 4px;"
                      @loadedmetadata="(e) => onTrimVideoLoaded(clip, e)"
                    />
                    <div class="q-mt-sm q-px-sm">
                      <div class="row items-center text-caption text-grey-6 q-mb-xs">
                        <span>{{ formatTime(clip.trimStart) }}</span>
                        <q-space />
                        <span>{{ formatTime(clip.trimEnd) }}</span>
                      </div>
                      <q-range
                        :model-value="{ min: clip.trimStart, max: clip.trimEnd }"
                        @update:model-value="(v) => updateTrim(clip, v)"
                        :min="0"
                        :max="clip.duration"
                        :step="0.1"
                        color="brown-8"
                        label
                        :left-label-value="formatTime(clip.trimStart)"
                        :right-label-value="formatTime(clip.trimEnd)"
                      />
                      <div class="row q-mt-xs q-gutter-sm">
                        <q-btn flat dense no-caps size="sm" label="Set start to current" @click="setTrimFromPlayhead(clip, 'start')" />
                        <q-btn flat dense no-caps size="sm" label="Set end to current" @click="setTrimFromPlayhead(clip, 'end')" />
                      </div>
                    </div>
                  </div>
                </q-slide-transition>
              </q-card>
            </div>
          </template>
        </draggable>

        <q-stepper-navigation>
          <q-btn flat no-caps label="Back" color="grey-7" @click="step = 1" class="q-mr-sm" />
          <q-btn color="brown-8" no-caps label="Continue" icon-right="arrow_forward" @click="step = 3" />
        </q-stepper-navigation>
      </q-step>

      <!-- ========== STEP 3: Add Title ========== -->
      <q-step :name="3" title="Add Title" icon="title" :done="step > 3">
        <q-toggle v-model="overlay.enabled" label="Add title overlay to video" color="brown-8" class="q-mb-md" />

        <div v-if="overlay.enabled" class="row q-col-gutter-md">
          <div class="col-12 col-md-6">
            <q-input v-model="overlay.title" label="Title text" outlined dense class="q-mb-sm" placeholder="e.g. Maggie's Garden Tours" />
            <q-input v-model="overlay.subtitle" label="Subtitle (optional)" outlined dense class="q-mb-sm" />
            <q-select
              v-model="overlay.position"
              :options="[{ label: 'Top', value: 'top' }, { label: 'Center', value: 'center' }, { label: 'Bottom', value: 'bottom' }]"
              label="Position"
              outlined dense emit-value map-options
              class="q-mb-sm"
            />
            <q-select
              v-model="overlay.fontSize"
              :options="[{ label: 'Small', value: 'small' }, { label: 'Medium', value: 'medium' }, { label: 'Large', value: 'large' }]"
              label="Font size"
              outlined dense emit-value map-options
              class="q-mb-sm"
            />
            <div class="row items-center q-mb-sm q-gutter-sm">
              <span class="text-body2 text-grey-7">Text colour:</span>
              <input v-model="overlay.color" type="color" style="width: 40px; height: 32px; border: 1px solid #ccc; border-radius: 4px; cursor: pointer;" />
            </div>
            <q-slider
              v-model="overlay.durationSec"
              :min="1" :max="15" :step="1"
              label :label-value="overlay.durationSec + 's'"
              color="brown-8"
              class="q-mb-sm"
            />
            <p class="text-caption text-grey-5">Title shows for the first {{ overlay.durationSec }} seconds</p>
          </div>

          <!-- Preview -->
          <div class="col-12 col-md-6">
            <p class="text-subtitle2 text-grey-7 q-mb-xs">Preview</p>
            <div class="title-preview rounded-borders" :style="{ background: '#1a1a1a' }">
              <div
                v-if="overlay.title"
                class="title-preview-text"
                :class="'title-pos-' + overlay.position"
                :style="{ color: overlay.color, fontSize: fontSizePx + 'px' }"
              >
                <div class="text-weight-bold">{{ overlay.title }}</div>
                <div v-if="overlay.subtitle" :style="{ fontSize: Math.round(fontSizePx * 0.7) + 'px' }">{{ overlay.subtitle }}</div>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="text-center q-pa-lg text-grey-6">
          <q-icon name="title" size="36px" class="q-mb-sm" />
          <p>No title overlay — your clips will be combined as-is.</p>
        </div>

        <q-stepper-navigation>
          <q-btn flat no-caps label="Back" color="grey-7" @click="step = 2" class="q-mr-sm" />
          <q-btn color="brown-8" no-caps label="Continue to Export" icon-right="arrow_forward" @click="step = 4" />
        </q-stepper-navigation>
      </q-step>

      <!-- ========== STEP 4: Export ========== -->
      <q-step :name="4" title="Export" icon="download">
        <!-- Summary -->
        <q-card flat bordered class="q-pa-md q-mb-md rounded-borders">
          <div class="row q-gutter-md items-center">
            <div>
              <q-icon name="movie" size="36px" color="brown-8" />
            </div>
            <div class="col">
              <div class="text-body1 text-weight-medium">{{ timeline.length }} clip{{ timeline.length > 1 ? 's' : '' }}</div>
              <div class="text-body2 text-grey-7">Total duration: {{ formatTime(totalTrimmedDuration) }}</div>
              <div v-if="overlay.enabled && overlay.title" class="text-body2 text-grey-7">Title: "{{ overlay.title }}"</div>
              <div v-if="totalClipSize > 150 * 1024 * 1024" class="text-body2 text-orange-8">
                <q-icon name="warning" size="16px" class="q-mr-xs" />
                Large files ({{ formatFileSize(totalClipSize) }}) — export may be slow or fail on some devices
              </div>
            </div>
          </div>
        </q-card>

        <!-- Export progress -->
        <div v-if="exporting" class="q-mb-md">
          <q-linear-progress :value="exportProgress / 100" color="amber" rounded size="24px" class="q-mb-sm">
            <div class="absolute-full flex flex-center">
              <span class="text-caption text-white text-weight-bold" style="text-shadow: 0 1px 2px rgba(0,0,0,0.5);">
                {{ exportProgress }}%
              </span>
            </div>
          </q-linear-progress>
          <p class="text-body2 text-grey-7">{{ exportStatus }}</p>
        </div>

        <!-- Result preview -->
        <div v-if="exportedUrl" class="q-mb-md">
          <p class="text-subtitle2 text-positive q-mb-sm">
            <q-icon name="check_circle" class="q-mr-xs" /> Video ready!
          </p>
          <video :src="exportedUrl" controls style="width: 100%; max-height: 400px; background: #000; border-radius: 8px;" />
          <q-btn
            color="brown-8"
            no-caps
            icon="download"
            label="Download Video"
            class="q-mt-md full-width"
            size="lg"
            @click="downloadResult"
          />
        </div>

        <!-- Export error -->
        <q-banner v-if="exportError" class="bg-red-1 text-red-8 q-mb-md rounded-borders">
          <template v-slot:avatar><q-icon name="error" color="red" /></template>
          {{ exportError }}
          <template v-slot:action>
            <q-btn flat no-caps label="Try Again" color="red" @click="processVideo" />
          </template>
        </q-banner>

        <q-stepper-navigation>
          <q-btn flat no-caps label="Back" color="grey-7" @click="step = 3" class="q-mr-sm" />
          <q-btn
            v-if="!exportedUrl"
            color="brown-8"
            no-caps
            icon="movie"
            label="Export Video"
            :loading="exporting"
            :disable="exporting"
            @click="processVideo"
          />
          <q-btn
            v-if="exportedUrl"
            flat no-caps
            label="Start Over"
            icon="refresh"
            color="grey-7"
            @click="resetAll"
          />
        </q-stepper-navigation>
      </q-step>
    </q-stepper>
  </q-page>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { api } from 'src/boot/axios'
import { Notify } from 'quasar'
import type { PortfolioItem } from 'src/stores/talent'
import draggable from 'vuedraggable'
// Dynamic imports — avoid loading FFmpeg at page load (large WASM bundle)
// and prevent SSR issues (FFmpeg needs browser APIs)
type FFmpegType = import('@ffmpeg/ffmpeg').FFmpeg

// ─── State ───

const step = ref(1)
const loadingPortfolio = ref(true)
const isDragging = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const cameraInput = ref<HTMLInputElement | null>(null)

// Step 1
const portfolioVideos = ref<PortfolioItem[]>([])
interface LocalClip {
  id: string
  name: string
  file: File
  objectUrl: string
  duration: number
}
const localClips = ref<LocalClip[]>([])
const selectedIds = ref<Set<string>>(new Set())

// Step 2
interface TimelineClip {
  id: string
  name: string
  source: 'portfolio' | 'local'
  objectUrl: string
  file?: File
  portfolioUrl?: string
  duration: number
  trimStart: number
  trimEnd: number
}
const timeline = ref<TimelineClip[]>([])
const expandedClipId = ref<string | null>(null)
const trimVideoRefs: Record<string, HTMLVideoElement> = {}

// Step 3
const overlay = reactive({
  enabled: false,
  title: '',
  subtitle: '',
  position: 'bottom' as 'top' | 'center' | 'bottom',
  fontSize: 'medium' as 'small' | 'medium' | 'large',
  color: '#ffffff',
  durationSec: 5,
})

// Step 4
const exporting = ref(false)
const exportProgress = ref(0)
const exportStatus = ref('')
const exportedUrl = ref<string | null>(null)
const exportError = ref<string | null>(null)

// FFmpeg
const ffmpegLoading = ref(false)
let ffmpeg: FFmpegType | null = null

// ─── Computed ───

const fontSizePx = computed(() => {
  return overlay.fontSize === 'small' ? 16 : overlay.fontSize === 'large' ? 28 : 22
})

const totalTrimmedDuration = computed(() => {
  return timeline.value.reduce((sum, c) => sum + (c.trimEnd - c.trimStart), 0)
})

const totalClipSize = computed(() => {
  let total = 0
  for (const clip of timeline.value) {
    if (clip.file) total += clip.file.size
  }
  return total
})

// ─── Lifecycle ───

onMounted(async () => {
  await loadPortfolioVideos()
})

onUnmounted(() => {
  // Clean up object URLs
  for (const clip of localClips.value) {
    URL.revokeObjectURL(clip.objectUrl)
  }
  if (exportedUrl.value) {
    URL.revokeObjectURL(exportedUrl.value)
  }
})

// ─── Step 1: Load & Select ───

async function loadPortfolioVideos() {
  loadingPortfolio.value = true
  try {
    const { data } = await api.get('/bz-talent-mine')
    portfolioVideos.value = (data.portfolio || []).filter((p: PortfolioItem) => p.type === 'video')
  } catch {
    // silently fail — portfolio may be empty
  } finally {
    loadingPortfolio.value = false
  }
}

function toggleSelect(id: string) {
  const s = new Set(selectedIds.value)
  if (s.has(id)) {
    s.delete(id)
  } else {
    s.add(id)
  }
  selectedIds.value = s
}

function handleDrop(e: DragEvent) {
  isDragging.value = false
  const files = e.dataTransfer?.files
  if (files?.length) {
    addLocalFiles(Array.from(files))
  }
}

function handleFileInput(e: Event) {
  const files = (e.target as HTMLInputElement).files
  if (files?.length) {
    addLocalFiles(Array.from(files))
  }
  if (fileInput.value) fileInput.value.value = ''
  if (cameraInput.value) cameraInput.value.value = ''
}

async function addLocalFiles(files: File[]) {
  for (const file of files) {
    if (!file.type.startsWith('video/')) {
      Notify.create({ type: 'warning', message: `${file.name} is not a video` })
      continue
    }
    if (file.size > 100 * 1024 * 1024) {
      Notify.create({ type: 'warning', message: `${file.name} is too large (max 100MB)` })
      continue
    }

    const objectUrl = URL.createObjectURL(file)
    const duration = await getVideoDuration(objectUrl)
    const id = 'l-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8)

    localClips.value.push({ id, name: file.name, file, objectUrl, duration })
    selectedIds.value = new Set([...selectedIds.value, id])
  }
}

function removeLocal(id: string) {
  const clip = localClips.value.find(c => c.id === id)
  if (clip) URL.revokeObjectURL(clip.objectUrl)
  localClips.value = localClips.value.filter(c => c.id !== id)
  const s = new Set(selectedIds.value)
  s.delete(id)
  selectedIds.value = s
}

function getVideoDuration(src: string): Promise<number> {
  return new Promise((resolve) => {
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.onloadedmetadata = () => {
      resolve(video.duration || 0)
      video.remove()
    }
    video.onerror = () => {
      resolve(0)
      video.remove()
    }
    video.src = src
  })
}

// ─── Step 1 → 2 transition ───

function goToTimeline() {
  const clips: TimelineClip[] = []

  for (const id of selectedIds.value) {
    if (id.startsWith('p-')) {
      const pId = parseInt(id.slice(2))
      const vid = portfolioVideos.value.find(v => v.id === pId)
      if (vid) {
        clips.push({
          id,
          name: vid.title || 'Portfolio video',
          source: 'portfolio',
          objectUrl: vid.url,
          portfolioUrl: vid.url,
          duration: 60, // placeholder — will update on metadata load
          trimStart: 0,
          trimEnd: 60,
        })
      }
    } else {
      const local = localClips.value.find(c => c.id === id)
      if (local) {
        clips.push({
          id: local.id,
          name: local.name,
          source: 'local',
          objectUrl: local.objectUrl,
          file: local.file,
          duration: local.duration,
          trimStart: 0,
          trimEnd: local.duration,
        })
      }
    }
  }

  timeline.value = clips
  step.value = 2
}

// ─── Step 2: Trim ───

function onTrimVideoLoaded(clip: TimelineClip, e: Event) {
  const video = e.target as HTMLVideoElement
  if (video.duration && isFinite(video.duration)) {
    clip.duration = video.duration
    if (clip.trimEnd > video.duration || clip.trimEnd === 60) {
      clip.trimEnd = video.duration
    }
  }
}

function updateTrim(clip: TimelineClip, val: { min: number; max: number }) {
  clip.trimStart = val.min
  clip.trimEnd = val.max
}

function setTrimFromPlayhead(clip: TimelineClip, point: 'start' | 'end') {
  const video = trimVideoRefs[clip.id]
  if (!video) return
  const time = video.currentTime
  if (point === 'start') {
    clip.trimStart = Math.min(time, clip.trimEnd - 0.5)
  } else {
    clip.trimEnd = Math.max(time, clip.trimStart + 0.5)
  }
}

// ─── Step 4: FFmpeg Export ───

async function initFFmpeg() {
  if (ffmpeg) return
  ffmpegLoading.value = true
  try {
    const { FFmpeg } = await import('@ffmpeg/ffmpeg')
    const { toBlobURL } = await import('@ffmpeg/util')
    ffmpeg = new FFmpeg()
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd'
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    })
  } catch (err) {
    ffmpeg = null
    throw new Error('Failed to load video processing tools. Please refresh and try again.')
  } finally {
    ffmpegLoading.value = false
  }
}

async function processVideo() {
  exportError.value = null
  exportProgress.value = 0
  exporting.value = true

  if (exportedUrl.value) {
    URL.revokeObjectURL(exportedUrl.value)
    exportedUrl.value = null
  }

  try {
    await initFFmpeg()
    if (!ffmpeg) throw new Error('FFmpeg not available')

    const totalSteps = timeline.value.length + 2 // trim each + concat + overlay
    let completedSteps = 0

    ffmpeg.on('progress', ({ progress }) => {
      const stepProg = Math.max(0, Math.min(1, progress))
      exportProgress.value = Math.round(((completedSteps + stepProg) / totalSteps) * 100)
    })

    // Write input files
    const { fetchFile } = await import('@ffmpeg/util')
    exportStatus.value = 'Loading clips...'
    for (let i = 0; i < timeline.value.length; i++) {
      const clip = timeline.value[i]
      let data: Uint8Array
      if (clip.file) {
        data = await fetchFile(clip.file)
      } else {
        data = await fetchFile(clip.objectUrl)
      }
      await ffmpeg.writeFile(`input${i}.mp4`, data)
    }

    // Trim each clip
    for (let i = 0; i < timeline.value.length; i++) {
      const clip = timeline.value[i]
      exportStatus.value = `Trimming clip ${i + 1} of ${timeline.value.length}...`

      const start = clip.trimStart
      const duration = clip.trimEnd - clip.trimStart

      // If no trimming needed, just copy
      if (start === 0 && Math.abs(duration - clip.duration) < 0.5) {
        await ffmpeg.exec(['-i', `input${i}.mp4`, '-c', 'copy', `trimmed${i}.mp4`])
      } else {
        await ffmpeg.exec([
          '-i', `input${i}.mp4`,
          '-ss', start.toFixed(2),
          '-t', duration.toFixed(2),
          '-c', 'copy',
          `trimmed${i}.mp4`,
        ])
      }
      completedSteps++
    }

    // Concatenate
    exportStatus.value = 'Combining clips...'
    const outputName = timeline.value.length > 1 ? 'merged.mp4' : 'merged.mp4'

    if (timeline.value.length > 1) {
      const concatList = timeline.value.map((_, i) => `file 'trimmed${i}.mp4'`).join('\n')
      await ffmpeg.writeFile('concat.txt', concatList)

      try {
        // Try fast copy first
        await ffmpeg.exec(['-f', 'concat', '-safe', '0', '-i', 'concat.txt', '-c', 'copy', 'merged.mp4'])
      } catch {
        // Fallback: re-encode for compatibility
        exportStatus.value = 'Re-encoding for compatibility...'
        await ffmpeg.exec([
          '-f', 'concat', '-safe', '0', '-i', 'concat.txt',
          '-vf', 'scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2',
          '-c:v', 'libx264', '-preset', 'fast', '-crf', '23',
          '-c:a', 'aac', '-b:a', '128k',
          'merged.mp4',
        ])
      }
    } else {
      await ffmpeg.exec(['-i', 'trimmed0.mp4', '-c', 'copy', 'merged.mp4'])
    }
    completedSteps++

    // Text overlay
    if (overlay.enabled && overlay.title.trim()) {
      exportStatus.value = 'Adding title overlay...'
      const fontSize = overlay.fontSize === 'small' ? 28 : overlay.fontSize === 'large' ? 56 : 40
      const yExpr = overlay.position === 'top' ? '50' : overlay.position === 'center' ? '(h-text_h)/2' : 'h-th-50'

      let vf = `drawtext=text='${escapeFfmpegText(overlay.title)}':fontsize=${fontSize}:fontcolor=${overlay.color}:x=(w-text_w)/2:y=${yExpr}:enable='between(t\\,0\\,${overlay.durationSec})':shadowcolor=black:shadowx=2:shadowy=2`

      if (overlay.subtitle.trim()) {
        const subFontSize = Math.round(fontSize * 0.65)
        const subY = overlay.position === 'top' ? `${60 + fontSize}` : overlay.position === 'center' ? `(h-text_h)/2+${fontSize + 10}` : `h-th-${60 - fontSize - 10}`
        vf += `,drawtext=text='${escapeFfmpegText(overlay.subtitle)}':fontsize=${subFontSize}:fontcolor=${overlay.color}:x=(w-text_w)/2:y=${subY}:enable='between(t\\,0\\,${overlay.durationSec})':shadowcolor=black:shadowx=1:shadowy=1`
      }

      await ffmpeg.exec([
        '-i', 'merged.mp4',
        '-vf', vf,
        '-c:a', 'copy',
        'output.mp4',
      ])
    } else {
      await ffmpeg.exec(['-i', 'merged.mp4', '-c', 'copy', 'output.mp4'])
    }
    completedSteps++
    exportProgress.value = 100

    // Read output
    exportStatus.value = 'Preparing download...'
    const outputData = await ffmpeg.readFile('output.mp4')
    const blob = new Blob([outputData], { type: 'video/mp4' })
    exportedUrl.value = URL.createObjectURL(blob)

    // Cleanup WASM FS
    for (let i = 0; i < timeline.value.length; i++) {
      try { await ffmpeg.deleteFile(`input${i}.mp4`) } catch { /* ignore */ }
      try { await ffmpeg.deleteFile(`trimmed${i}.mp4`) } catch { /* ignore */ }
    }
    try { await ffmpeg.deleteFile('concat.txt') } catch { /* ignore */ }
    try { await ffmpeg.deleteFile('merged.mp4') } catch { /* ignore */ }
    try { await ffmpeg.deleteFile('output.mp4') } catch { /* ignore */ }

    exportStatus.value = 'Done!'
    Notify.create({ type: 'positive', message: 'Video exported successfully!' })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Export failed'
    exportError.value = msg
    Notify.create({ type: 'negative', message: msg })
  } finally {
    exporting.value = false
  }
}

function downloadResult() {
  if (!exportedUrl.value) return
  const a = document.createElement('a')
  a.href = exportedUrl.value
  const titleSlug = overlay.title ? overlay.title.replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-').slice(0, 40) : 'broodz-video'
  a.download = `${titleSlug}-${Date.now()}.mp4`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

function resetAll() {
  if (exportedUrl.value) {
    URL.revokeObjectURL(exportedUrl.value)
    exportedUrl.value = null
  }
  exportError.value = null
  exportProgress.value = 0
  exportStatus.value = ''
  timeline.value = []
  selectedIds.value = new Set()
  overlay.enabled = false
  overlay.title = ''
  overlay.subtitle = ''
  overlay.position = 'bottom'
  overlay.fontSize = 'medium'
  overlay.color = '#ffffff'
  overlay.durationSec = 5
  step.value = 1
}

// ─── Helpers ───

function escapeFfmpegText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "'\\''")
    .replace(/:/g, '\\:')
    .replace(/%/g, '%%')
}

function formatTime(seconds: number): string {
  if (!seconds || !isFinite(seconds)) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(0) + ' MB'
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

.clip-card {
  border-radius: 8px;
  transition: all 0.2s;

  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
  }

  &--selected {
    border-color: #f59e0b !important;
    box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.3);
  }
}

.timeline-strip {
  max-width: 100%;
}

.timeline-clip {
  transition: transform 0.2s;
}

.drag-ghost {
  opacity: 0.4;
}

.cursor-grab {
  cursor: grab;
  &:active { cursor: grabbing; }
}

.title-preview {
  aspect-ratio: 16 / 9;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.title-preview-text {
  position: absolute;
  width: 100%;
  text-align: center;
  padding: 8px 16px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);

  &.title-pos-top { top: 12px; }
  &.title-pos-center { top: 50%; transform: translateY(-50%); }
  &.title-pos-bottom { bottom: 12px; }
}

.total-duration {
  padding: 8px 12px;
  background: #f5f0e8;
  border-radius: 6px;
  display: inline-block;
}
</style>
