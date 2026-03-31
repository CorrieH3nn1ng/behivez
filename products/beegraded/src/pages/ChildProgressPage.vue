<template>
  <q-page class="honeycomb-bg">
    <div class="page-container" style="max-width: 700px;">
      <!-- Back button -->
      <q-btn
        flat dense no-caps
        icon="arrow_back"
        :label="lang === 'af' ? 'Terug na Kinders' : 'Back to Children'"
        color="amber-8"
        class="q-mb-md"
        to="/workspace/children"
      />

      <!-- Loading -->
      <div v-if="loading" class="text-center q-pa-xl">
        <q-spinner-gears color="amber" size="36px" />
      </div>

      <!-- Error -->
      <q-banner v-if="error" class="bg-red-1 text-red-8 q-mb-md" rounded>
        <template v-slot:avatar><q-icon name="error" color="red" /></template>
        {{ error }}
      </q-banner>

      <template v-if="!loading && child">
        <!-- Child header with delete -->
        <q-card flat class="bee-card q-pa-md q-mb-md">
          <div class="row items-center">
            <q-icon name="child_care" color="amber-8" size="32px" class="q-mr-sm" />
            <div>
              <div class="text-h5 text-weight-bold" style="color: #78350f;">{{ child.name }}</div>
              <div class="text-caption text-grey-6">
                {{ lang === 'af' ? 'Graad' : 'Grade' }} {{ child.grade }}
              </div>
            </div>
            <q-space />
            <q-btn
              flat dense
              icon="delete_outline"
              color="red-4"
              @click.stop="handleRemoveChild"
            >
              <q-tooltip>{{ lang === 'af' ? 'Verwyder kind' : 'Remove child' }}</q-tooltip>
            </q-btn>
          </div>
        </q-card>

        <!-- Stats cards -->
        <div class="row q-gutter-sm q-mb-md">
          <q-card flat class="bee-card q-pa-md col">
            <div class="text-caption text-grey-6">{{ lang === 'af' ? 'Totale Toetse' : 'Total Tests' }}</div>
            <div class="text-h4 text-weight-bold" style="color: #78350f;">{{ stats.total_tests }}</div>
          </q-card>
          <q-card flat class="bee-card q-pa-md col">
            <div class="text-caption text-grey-6">{{ lang === 'af' ? 'Gemiddeld' : 'Average' }}</div>
            <div class="text-h4 text-weight-bold" style="color: #f59e0b;">{{ stats.average_score }}%</div>
          </q-card>
          <q-card flat class="bee-card q-pa-md col">
            <div class="text-caption text-grey-6">{{ lang === 'af' ? 'Beste Telling' : 'Best Score' }}</div>
            <div class="text-h4 text-weight-bold" style="color: #16a34a;">{{ stats.best_score }}%</div>
          </q-card>
        </div>

        <!-- Speed vs Accuracy Insight -->
        <q-card v-if="analysis?.speed?.fast_answers > 0" flat class="bee-card q-pa-md q-mb-md">
          <div class="text-weight-bold q-mb-sm" style="color: #78350f;">
            <q-icon name="speed" class="q-mr-xs" />
            {{ lang === 'af' ? 'Spoed vs Akkuraatheid' : 'Speed vs Accuracy' }}
          </div>
          <div class="row q-gutter-sm q-mb-sm">
            <div class="col text-center q-pa-sm" style="background: #fef3c7; border-radius: 8px;">
              <div class="text-weight-bold" :style="{ color: analysis.speed.fast_accuracy < 60 ? '#ef4444' : '#f59e0b' }">
                {{ analysis.speed.fast_accuracy }}%
              </div>
              <div class="text-caption text-grey-6">
                {{ lang === 'af' ? 'Vinnig (&lt;5s)' : 'Fast (&lt;5s)' }}
              </div>
            </div>
            <div class="col text-center q-pa-sm" style="background: #dcfce7; border-radius: 8px;">
              <div class="text-weight-bold text-positive">{{ analysis.speed.slow_accuracy }}%</div>
              <div class="text-caption text-grey-6">
                {{ lang === 'af' ? 'Stadig (&gt;10s)' : 'Careful (&gt;10s)' }}
              </div>
            </div>
          </div>
          <div v-if="analysis.speed.rushing" class="text-caption q-pa-sm" style="background: #fef2f2; border-radius: 6px; color: #991b1b;">
            <q-icon name="warning" size="14px" class="q-mr-xs" />
            {{ lang === 'af'
              ? `${child.name} jaag deur vrae — ${analysis.speed.fast_wrong} van ${analysis.speed.fast_answers} vinnige antwoorde was verkeerd. Stadiger = beter punte.`
              : `${child.name} rushes through questions — ${analysis.speed.fast_wrong} of ${analysis.speed.fast_answers} fast answers were wrong. Slower = better scores.` }}
          </div>
          <div v-else class="text-caption text-positive q-mt-xs">
            <q-icon name="check_circle" size="14px" class="q-mr-xs" />
            {{ lang === 'af' ? 'Goeie tempo — nie te haastig nie.' : 'Good pace — not rushing.' }}
          </div>
        </q-card>

        <!-- Weak Areas -->
        <q-card v-if="analysis?.weak_areas?.length > 0" flat class="bee-card q-pa-md q-mb-md">
          <div class="text-weight-bold q-mb-sm" style="color: #78350f;">
            <q-icon name="target" class="q-mr-xs" />
            {{ lang === 'af' ? 'Areas om te Verbeter' : 'Areas to Improve' }}
          </div>
          <q-list dense>
            <q-item v-for="w in analysis.weak_areas" :key="w.area">
              <q-item-section avatar>
                <q-icon name="highlight_off" color="red-4" size="20px" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ w.area }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-badge color="red-2" text-color="red-8">
                  {{ w.wrong_count }}x {{ lang === 'af' ? 'verkeerd' : 'wrong' }}
                </q-badge>
              </q-item-section>
            </q-item>
          </q-list>
          <div class="text-caption text-grey-6 q-mt-sm q-pa-xs" style="background: #fef9ee; border-radius: 4px;">
            <q-icon name="lightbulb" size="14px" class="q-mr-xs" color="amber" />
            {{ lang === 'af'
              ? 'Fokus oefen op hierdie areas sal die meeste punte verbeter.'
              : 'Focused practice on these areas will improve scores the most.' }}
          </div>
        </q-card>

        <!-- Progress chart (last 10) -->
        <q-card v-if="attempts.length > 1" flat class="bee-card q-pa-md q-mb-md">
          <div class="text-weight-bold q-mb-sm" style="color: #78350f;">
            <q-icon name="trending_up" class="q-mr-xs" />
            {{ lang === 'af' ? 'Vordering (Laaste 10)' : 'Progress (Last 10)' }}
          </div>
          <div class="row items-end q-gutter-xs" style="height: 120px;">
            <div
              v-for="(a, i) in progressBars"
              :key="i"
              class="col text-center"
            >
              <div
                :style="{
                  height: Math.max(4, a.percentage * 1.1) + 'px',
                  background: a.percentage >= 80 ? '#16a34a' : a.percentage >= 50 ? '#f59e0b' : '#ef4444',
                  borderRadius: '4px 4px 0 0',
                  transition: 'height 0.3s',
                }"
              />
              <div class="text-caption" style="font-size: 10px;">{{ a.percentage }}%</div>
            </div>
          </div>
        </q-card>

        <!-- Attempt history -->
        <q-card flat class="bee-card q-pa-md">
          <div class="text-weight-bold q-mb-sm" style="color: #78350f;">
            <q-icon name="history" class="q-mr-xs" />
            {{ lang === 'af' ? 'Toets Geskiedenis' : 'Test History' }}
          </div>

          <div v-if="attempts.length === 0" class="text-center text-grey-5 q-pa-lg">
            {{ lang === 'af' ? 'Nog geen toetse voltooi nie' : 'No tests completed yet' }}
          </div>

          <q-list v-else separator>
            <q-item v-for="a in attempts" :key="a.id" clickable @click="viewAttempt(a)">
              <q-item-section avatar>
                <q-icon
                  :name="a.percentage >= 80 ? 'star' : a.percentage >= 50 ? 'thumb_up' : 'fitness_center'"
                  :color="a.percentage >= 80 ? 'amber' : a.percentage >= 50 ? 'green' : 'grey'"
                />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ a.template_name }}</q-item-label>
                <q-item-label caption>
                  {{ formatDate(a.date) }} &bull;
                  {{ Math.floor(a.time_used_sec / 60) }}m {{ a.time_used_sec % 60 }}s
                </q-item-label>
              </q-item-section>
              <q-item-section side class="text-right">
                <div class="text-weight-bold" :style="{ color: a.percentage >= 80 ? '#16a34a' : a.percentage >= 50 ? '#f59e0b' : '#ef4444' }">
                  {{ a.score }}/{{ a.total }} ({{ a.percentage }}%)
                </div>
              </q-item-section>
              <q-item-section side style="padding-left: 4px;">
                <q-btn
                  flat dense round
                  icon="delete_outline"
                  size="sm"
                  color="red-3"
                  @click="handleDeleteAttempt(a)"
                >
                  <q-tooltip>{{ lang === 'af' ? 'Verwyder toets' : 'Remove test' }}</q-tooltip>
                </q-btn>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card>

        <!-- Play link -->
        <q-card flat class="bee-card q-pa-md q-mt-md">
          <div class="text-caption text-grey-6 q-mb-xs">
            <q-icon name="link" size="14px" class="q-mr-xs" />
            {{ lang === 'af' ? 'Speel-skakel (WhatsApp dit na jou kind)' : 'Play link (WhatsApp this to your child)' }}
          </div>
          <div class="row items-center">
            <code style="font-size: 13px; word-break: break-all;">{{ baseUrl }}/#/play/{{ child.play_slug }}</code>
            <q-space />
            <q-btn flat dense icon="content_copy" size="sm" @click="copyLink" />
            <q-btn flat dense icon="share" size="sm" color="green" @click="shareWhatsApp" />
          </div>
        </q-card>
      </template>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'src/i18n'
import { useChildren } from 'src/composables/useChildren'
import { Notify, Dialog } from 'quasar'

const props = defineProps<{ childId: string }>()
const router = useRouter()
const { lang } = useI18n()
const { getChildProgress, deleteAttempt, removeChild } = useChildren()

const loading = ref(true)
const error = ref('')
const child = ref<any>(null)
const stats = ref({ total_tests: 0, average_score: 0, best_score: 0 })
const analysis = ref<any>(null)
const attempts = ref<any[]>([])

const baseUrl = 'https://beegraded.co.za'

const progressBars = computed(() => {
  return [...attempts.value].reverse().slice(-10)
})

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString(lang.value === 'af' ? 'af-ZA' : 'en-ZA', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function copyLink() {
  if (!child.value) return
  navigator.clipboard.writeText(`${baseUrl}/#/play/${child.value.play_slug}`)
  Notify.create({
    type: 'positive',
    message: lang.value === 'af' ? 'Skakel gekopieer!' : 'Link copied!',
    timeout: 1500,
  })
}

function shareWhatsApp() {
  if (!child.value) return
  const url = `${baseUrl}/#/play/${child.value.play_slug}`
  const msg = lang.value === 'af'
    ? `Hi ${child.value.name}! Hier is jou oefen-skakel vir Wiskunde: ${url}`
    : `Hi ${child.value.name}! Here is your practice link for Maths: ${url}`
  window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')
}

function handleDeleteAttempt(attempt: any) {
  Dialog.create({
    title: lang.value === 'af' ? 'Verwyder toets?' : 'Remove test?',
    message: lang.value === 'af'
      ? `${attempt.template_name} — ${attempt.score}/${attempt.total} (${attempt.percentage}%)`
      : `${attempt.template_name} — ${attempt.score}/${attempt.total} (${attempt.percentage}%)`,
    cancel: { label: lang.value === 'af' ? 'Nee' : 'No', flat: true },
    ok: { label: lang.value === 'af' ? 'Ja, verwyder' : 'Yes, remove', color: 'negative' },
  }).onOk(async () => {
    try {
      await deleteAttempt(parseInt(props.childId), attempt.id)
      attempts.value = attempts.value.filter(a => a.id !== attempt.id)
      // Recalculate stats
      const total = attempts.value.length
      stats.value = {
        total_tests: total,
        average_score: total > 0 ? Math.round(attempts.value.reduce((s, a) => s + a.percentage, 0) / total) : 0,
        best_score: total > 0 ? Math.max(...attempts.value.map(a => a.percentage)) : 0,
      }
      Notify.create({
        type: 'positive',
        message: lang.value === 'af' ? 'Toets verwyder' : 'Test removed',
        timeout: 1500,
      })
    } catch {
      Notify.create({ type: 'negative', message: lang.value === 'af' ? 'Kon nie verwyder nie' : 'Could not remove' })
    }
  })
}

function viewAttempt(attempt: any) {
  router.push({
    name: 'math-result',
    params: { attemptId: attempt.id },
    query: { templateId: attempt.template_id, returnTo: `/workspace/child/${props.childId}/progress` },
  })
}

function handleRemoveChild() {
  if (!child.value) return
  Dialog.create({
    title: lang.value === 'af' ? 'Verwyder kind?' : 'Remove child?',
    message: lang.value === 'af'
      ? `Dit sal ${child.value.name} se profiel en alle toetsresultate permanent verwyder.`
      : `This will permanently remove ${child.value.name}'s profile and all test results.`,
    cancel: { label: lang.value === 'af' ? 'Nee' : 'No', flat: true },
    ok: { label: lang.value === 'af' ? 'Ja, verwyder' : 'Yes, remove', color: 'negative' },
  }).onOk(async () => {
    try {
      await removeChild(parseInt(props.childId))
      Notify.create({
        type: 'positive',
        message: lang.value === 'af' ? 'Kind verwyder' : 'Child removed',
      })
      router.push('/workspace/children')
    } catch {
      Notify.create({ type: 'negative', message: lang.value === 'af' ? 'Kon nie verwyder nie' : 'Could not remove' })
    }
  })
}

async function loadProgress() {
  try {
    const data = await getChildProgress(parseInt(props.childId))
    child.value = data.child
    stats.value = data.stats
    analysis.value = data.analysis || null
    attempts.value = data.attempts
  } catch (err: any) {
    error.value = err.response?.status === 404
      ? (lang.value === 'af' ? 'Kind nie gevind nie' : 'Child not found')
      : (lang.value === 'af' ? 'Kon nie vordering laai nie' : 'Could not load progress')
  } finally {
    loading.value = false
  }
}

onMounted(loadProgress)
</script>
