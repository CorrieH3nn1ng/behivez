<template>
  <q-page class="q-pa-xl" style="max-width: 1000px; margin: 0 auto;">
    <div class="text-h4 text-weight-bold text-grey-9 q-mb-xs">AI Content Creator</div>
    <p class="text-body2 text-grey-6 q-mb-lg">Create punchy social media content with AI. Download and share.</p>

    <!-- Step 1: Topic -->
    <q-card flat bordered class="q-mb-lg card-themed">
      <q-card-section>
        <div class="text-subtitle1 text-weight-bold text-grey-8 q-mb-sm">What's the topic?</div>
        <div class="row q-gutter-md items-end">
          <q-input
            v-model="topic"
            outlined
            dense
            placeholder="Type a subject or question..."
            class="col"
            @keyup.enter="generate"
          />
          <q-btn
            label="What's Trending?"
            color="amber-8"
            text-color="white"
            no-caps
            unelevated
            :loading="store.loading"
            @click="loadTrending"
          />
        </div>

        <!-- Trending topics -->
        <div v-if="store.topics.length" class="q-mt-md">
          <div class="text-caption text-grey-6 q-mb-sm">Trending in South Africa:</div>
          <div class="row q-gutter-sm">
            <q-chip
              v-for="t in store.topics"
              :key="t.title"
              clickable
              color="amber-1"
              text-color="amber-9"
              @click="topic = t.title"
            >
              {{ t.title }}
              <q-tooltip>{{ t.description }}</q-tooltip>
            </q-chip>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Step 2: Style -->
    <q-card v-if="topic" flat bordered class="q-mb-lg card-themed">
      <q-card-section>
        <div class="text-subtitle1 text-weight-bold text-grey-8 q-mb-sm">Pick a style</div>
        <q-btn-toggle
          v-model="style"
          no-caps
          unelevated
          toggle-color="amber-8"
          toggle-text-color="white"
          color="grey-3"
          text-color="grey-8"
          :options="[
            { label: 'Witty', value: 'witty' },
            { label: 'Inspirational', value: 'inspirational' },
            { label: 'Provocative', value: 'provocative' },
          ]"
        />

        <q-btn
          label="Generate Content"
          color="amber-8"
          text-color="white"
          no-caps
          unelevated
          size="lg"
          class="q-mt-md full-width"
          :loading="store.generating"
          :disable="!topic"
          @click="generate"
        />
      </q-card-section>
    </q-card>

    <!-- Error -->
    <q-banner v-if="error" class="bg-red-1 text-red-8 q-mb-lg" rounded>
      {{ error }}
      <template #action>
        <q-btn flat no-caps label="Dismiss" @click="error = ''" />
      </template>
    </q-banner>

    <!-- Result -->
    <q-card v-if="result" flat bordered class="q-mb-lg card-themed">
      <q-card-section>
        <div class="text-subtitle1 text-weight-bold text-grey-8 q-mb-md">Your Content</div>

        <div class="row q-gutter-lg">
          <!-- Image preview -->
          <div class="col-12 col-md-6">
            <div class="image-preview">
              <img
                v-if="result.imageBase64"
                :src="result.imageBase64.startsWith('data:') ? result.imageBase64 : 'data:image/svg+xml;base64,' + result.imageBase64"
                alt="Generated content"
                style="width: 100%; border-radius: 8px;"
              />
              <div
                v-else-if="result.imageSvg"
                v-html="result.imageSvg"
                class="svg-preview"
              />
              <div v-else class="placeholder-image flex flex-center">
                <q-icon name="image" size="64px" color="grey-4" />
              </div>
            </div>
          </div>

          <!-- Text content -->
          <div class="col-12 col-md-6">
            <div class="text-h6 text-weight-bold text-grey-9 q-mb-sm">{{ result.message }}</div>
            <div v-if="result.insight" class="text-body2 text-grey-7 text-italic q-mb-md">{{ result.insight }}</div>
            <div v-if="result.caption" class="text-body2 text-grey-8 q-mb-md">{{ result.caption }}</div>
            <div v-if="result.hashtags?.length" class="q-mb-md">
              <q-chip v-for="tag in result.hashtags" :key="tag" dense color="amber-1" text-color="amber-9" size="sm">
                {{ tag.startsWith('#') ? tag : '#' + tag }}
              </q-chip>
            </div>
          </div>
        </div>
      </q-card-section>

      <q-separator />

      <q-card-actions class="q-pa-md">
        <q-btn
          label="Download Image"
          icon="download"
          color="amber-8"
          text-color="white"
          no-caps
          unelevated
          @click="downloadImage"
        />
        <q-btn
          label="Save Draft"
          icon="save"
          color="grey-7"
          text-color="white"
          no-caps
          unelevated
          :loading="saving"
          @click="saveDraft"
        />
        <q-btn
          label="Copy Caption"
          icon="content_copy"
          color="grey-7"
          text-color="white"
          no-caps
          unelevated
          @click="copyCaption"
        />
        <q-space />
        <q-btn
          label="Start Over"
          flat
          no-caps
          color="grey-6"
          @click="reset"
        />
      </q-card-actions>
    </q-card>

    <!-- Link to drafts -->
    <div class="text-center q-mt-md">
      <q-btn flat no-caps label="View Saved Drafts" color="amber-9" icon="folder" to="/my/content-drafts" />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Notify, copyToClipboard } from 'quasar'
import { useContentStore, type GeneratedContent } from 'stores/content'

const store = useContentStore()

const topic = ref('')
const style = ref('witty')
const error = ref('')
const saving = ref(false)
const result = ref<GeneratedContent | null>(null)

async function loadTrending() {
  error.value = ''
  try {
    await store.fetchTrending()
  } catch {
    error.value = 'Failed to load trending topics. Try again.'
  }
}

async function generate() {
  if (!topic.value.trim()) return
  error.value = ''
  result.value = null
  try {
    result.value = await store.generateContent(topic.value.trim(), style.value)
  } catch {
    error.value = 'Content generation failed. Please try again.'
  }
}

async function saveDraft() {
  if (!result.value) return
  saving.value = true
  try {
    await store.saveDraft({
      topic: topic.value,
      insight: result.value.insight,
      message: result.value.message,
      caption: result.value.caption,
      hashtags: result.value.hashtags,
      imageData: result.value.imageBase64 || result.value.imageSvg || '',
      style: style.value,
      status: 'generated',
    })
    Notify.create({ type: 'positive', message: 'Draft saved!' })
  } catch {
    Notify.create({ type: 'negative', message: 'Failed to save draft.' })
  } finally {
    saving.value = false
  }
}

async function copyCaption() {
  if (!result.value) return
  const text = [result.value.caption, result.value.hashtags?.map(h => h.startsWith('#') ? h : '#' + h).join(' ')].filter(Boolean).join('\n\n')
  await copyToClipboard(text)
  Notify.create({ type: 'positive', message: 'Caption copied!' })
}

function downloadImage() {
  if (!result.value) return

  const imgData = result.value.imageBase64 || result.value.imageSvg
  if (!imgData) return

  const link = document.createElement('a')
  if (imgData.startsWith('data:')) {
    link.href = imgData
  } else {
    link.href = 'data:image/svg+xml;base64,' + btoa(imgData)
  }
  link.download = `behivez-content-${Date.now()}.png`
  link.click()
}

function reset() {
  result.value = null
  topic.value = ''
  style.value = 'witty'
  store.topics = []
}
</script>

<style lang="scss" scoped>
.card-themed {
  background: #fffbeb;
  border-color: rgba(245, 158, 11, 0.2) !important;
}

.placeholder-image {
  width: 100%;
  aspect-ratio: 1;
  background: #f5f0e8;
  border-radius: 8px;
}

.svg-preview {
  width: 100%;
  :deep(svg) {
    width: 100%;
    height: auto;
    border-radius: 8px;
  }
}
</style>
