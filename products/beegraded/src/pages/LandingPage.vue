<template>
  <q-page class="honeycomb-bg">
    <!-- Hero -->
    <section class="hero-section q-pa-xl text-center">
      <div class="hero-content" style="max-width: 700px; margin: 0 auto;">
        <q-icon name="hive" size="64px" color="amber" class="q-mb-md" />
        <h1 class="text-h3 text-weight-bold q-mb-sm" style="color: #1c1917;">
          <span class="text-amber-8">BeeGraded</span>
        </h1>
        <p class="text-subtitle1 text-grey-7 q-mb-lg" style="max-width: 540px; margin: 0 auto;">
          AI-powered education tools for South African learners and students.
        </p>
      </div>
    </section>

    <!-- Two Product Cards -->
    <section class="q-py-xl" style="background: white;">
      <div class="page-container">
        <h2 class="text-h4 text-weight-bold text-center q-mb-sm">What are you looking for?</h2>
        <p class="text-grey-7 text-center q-mb-xl">Choose your path — each is built for a different need.</p>

        <div class="row q-gutter-lg justify-center">
          <!-- Grades Card -->
          <q-card flat class="product-card bee-card q-pa-lg" style="max-width: 380px; width: 100%; border: 2px solid #f59e0b; cursor: pointer;" @click="goGrades">
            <q-badge color="amber" floating label="NEW" />
            <div class="text-center q-mb-md">
              <q-icon name="calculate" size="56px" color="amber-8" class="q-mb-sm" />
              <div class="text-h5 text-weight-bold" style="color: #78350f;">Grades</div>
              <div class="text-h6 text-amber-8">Test Me</div>
              <div class="text-caption text-grey-6 q-mt-xs">Grade 1 — 12</div>
            </div>

            <q-list dense class="q-mb-lg">
              <q-item v-for="f in gradesFeatures" :key="f">
                <q-item-section avatar><q-icon name="check_circle" color="positive" size="16px" /></q-item-section>
                <q-item-section><span style="font-size: 13px;">{{ f }}</span></q-item-section>
              </q-item>
            </q-list>

            <div class="text-center q-mb-sm">
              <q-badge color="green-2" text-color="green-9" class="q-pa-xs" style="font-size: 12px;">
                Times Tables &bull; Plus Minus &bull; Problem Solving
              </q-badge>
            </div>
            <div class="text-center q-mb-sm">
              <q-badge color="blue-1" text-color="blue-8" class="q-pa-xs" style="font-size: 11px;">
                Afrikaans &bull; English &bull; Setswana
              </q-badge>
            </div>

            <q-btn class="btn-bee full-width" size="lg" no-caps icon="flash_on" label="Start" @click.stop="goGrades" />
          </q-card>

          <!-- Papers Card -->
          <q-card flat class="product-card bee-card q-pa-lg" style="max-width: 380px; width: 100%; cursor: pointer;" @click="goPapers">
            <div class="text-center q-mb-md">
              <q-icon name="description" size="56px" color="blue-8" class="q-mb-sm" />
              <div class="text-h5 text-weight-bold" style="color: #1e3a5f;">Papers</div>
              <div class="text-h6 text-blue-8">Paper Evaluation</div>
              <div class="text-caption text-grey-6 q-mt-xs">University &bull; College &bull; TVET</div>
            </div>

            <q-list dense class="q-mb-lg">
              <q-item v-for="f in papersFeatures" :key="f">
                <q-item-section avatar><q-icon name="check_circle" color="positive" size="16px" /></q-item-section>
                <q-item-section><span style="font-size: 13px;">{{ f }}</span></q-item-section>
              </q-item>
            </q-list>

            <div class="text-center q-mb-sm">
              <q-badge color="blue-1" text-color="blue-8" class="q-pa-xs" style="font-size: 12px;">
                Mode A: Academic &bull; Mode B: AI Detection
              </q-badge>
            </div>

            <q-btn outline color="blue-8" class="full-width" size="lg" no-caps icon="description" label="Start" @click.stop="goPapers" />
          </q-card>
        </div>

        <div class="text-center q-mt-lg">
          <q-btn flat no-caps color="grey-7" label="Already registered? Login" to="/get-started" size="sm" />
        </div>
      </div>
    </section>

    <!-- Pricing: Grades -->
    <section id="pricing" class="q-py-xl" style="background: #fefbf3;">
      <div class="page-container">
        <h2 class="text-h4 text-weight-bold text-center q-mb-xs">Pricing</h2>

        <!-- Grades Pricing -->
        <div class="text-center q-mb-md q-mt-lg">
          <q-icon name="calculate" size="28px" color="amber-8" class="q-mr-xs" />
          <span class="text-h5 text-weight-bold" style="color: #78350f;">Grades — Test Me</span>
        </div>
        <p class="text-grey-7 text-center q-mb-lg">Speed drills are free. Unlock AI problem solving and more subjects with a plan.</p>

        <div class="row q-gutter-md justify-center q-mb-xl">
          <q-card v-for="g in gradesTiers" :key="g.name" flat class="bee-card q-pa-lg pricing-card" :style="g.highlight ? 'border: 2px solid #f59e0b;' : ''">
            <q-badge v-if="g.badge" :color="g.badgeColor" floating :label="g.badge" />
            <div class="text-center q-mb-md">
              <div class="text-h6 text-weight-bold" style="color: #78350f;">{{ g.name }}</div>
              <div class="text-h3 text-weight-bold text-amber-8">{{ g.price }}</div>
              <div class="text-caption text-grey-6">{{ g.period }}</div>
            </div>
            <q-list dense class="pricing-features q-mb-md">
              <q-item v-for="f in g.features" :key="f"><q-item-section avatar><q-icon name="check" color="green" size="16px" /></q-item-section><q-item-section><span style="font-size: 13px;">{{ f }}</span></q-item-section></q-item>
            </q-list>
            <q-btn :class="g.highlight ? 'btn-bee' : ''" :outline="!g.highlight" :color="g.highlight ? undefined : 'amber-8'" class="full-width" no-caps :label="g.cta" @click="goGrades" />
          </q-card>
        </div>

        <!-- Papers Pricing -->
        <div class="text-center q-mb-md">
          <q-icon name="description" size="28px" color="blue-8" class="q-mr-xs" />
          <span class="text-h5 text-weight-bold" style="color: #1e3a5f;">Papers — Evaluation</span>
        </div>
        <p class="text-grey-7 text-center q-mb-lg">AI-powered academic paper evaluation for university and college students.</p>

        <div class="row q-gutter-md justify-center">
          <q-card v-for="p in papersTiers" :key="p.name" flat class="bee-card q-pa-lg pricing-card" :style="p.highlight ? 'border: 2px solid #3b82f6;' : ''">
            <q-badge v-if="p.badge" :color="p.badgeColor" floating :label="p.badge" />
            <div class="text-center q-mb-md">
              <div class="text-h6 text-weight-bold" style="color: #1e3a5f;">{{ p.name }}</div>
              <div class="text-h3 text-weight-bold text-blue-8">{{ p.price }}</div>
              <div class="text-caption text-grey-6">{{ p.period }}</div>
            </div>
            <q-list dense class="pricing-features q-mb-md">
              <q-item v-for="f in p.features" :key="f"><q-item-section avatar><q-icon name="check" color="green" size="16px" /></q-item-section><q-item-section><span style="font-size: 13px;">{{ f }}</span></q-item-section></q-item>
            </q-list>
            <q-btn :class="p.highlight ? '' : ''" :outline="!p.highlight" :color="p.highlight ? 'blue-8' : 'blue-8'" class="full-width" no-caps :label="p.cta" @click="p.action ? p.action() : goPapers()" />
          </q-card>
        </div>

      </div>
    </section>

    <!-- CTA -->
    <section class="q-pa-xl text-center" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white;">
      <h2 class="text-h4 text-weight-bold q-mb-sm">Ready to get started?</h2>
      <p class="q-mb-lg" style="opacity: 0.9;">Choose Grades for school practice or Papers for university evaluation.</p>
      <div class="row justify-center q-gutter-md">
        <q-btn flat no-caps size="lg" class="bg-white text-amber-9 text-weight-bold" label="Grades — Free" icon="calculate" @click="goGrades" />
        <q-btn outline no-caps size="lg" class="text-white" style="border-color: white;" label="Papers — From R20" icon="description" @click="goPapers" />
      </div>
    </section>
  </q-page>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from 'src/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const gradesFeatures = [
  'Times tables speed tests (× ÷)',
  'Addition & subtraction drills (+ −)',
  'AI problem solving (AMESA-style)',
  'Parent dashboard with child tracking',
  'Magic links — WhatsApp to your child',
  'Leaderboards and progress charts',
  'Afrikaans, English, Setswana',
  'Grade 1 to Grade 12',
]

const papersFeatures = [
  'Upload your paper + rubric PDF',
  'AI evaluation in 60 seconds',
  'Score breakdown per criterion',
  'Reference integrity audit',
  'Draft vs final comparison',
  'AI detection risk assessment',
  'Before/after writing examples',
  'Prioritised fix list',
]

const gradesTiers = [
  {
    name: 'Free', price: 'R0', period: 'forever', badge: null, badgeColor: '', highlight: false,
    features: ['Speed drills (× ÷ + −)', 'Leaderboard', '1 child', 'Basic progress'],
    cta: 'Start Free',
  },
  {
    name: 'Per Subject', price: 'R29', period: 'per month', badge: 'POPULAR', badgeColor: 'amber', highlight: true,
    features: ['Everything in Free', 'AI problem solving', 'Progress tracking', 'Unlimited children'],
    cta: 'Choose Subject',
  },
  {
    name: '3 Subjects', price: 'R69', period: 'per month', badge: 'SAVE R18', badgeColor: 'green', highlight: false,
    features: ['Pick any 3 subjects', 'AI problem solving', 'Progress tracking', 'Unlimited children'],
    cta: 'Get 3 Subjects',
  },
  {
    name: 'All Subjects', price: 'R99', period: 'per month', badge: null, badgeColor: '', highlight: false,
    features: ['Every subject, every grade', 'All 11 languages', 'Priority AI generation', 'Unlimited everything'],
    cta: 'Get All Subjects',
  },
]

const papersTiers = [
  {
    name: 'Free Sample', price: 'R0', period: 'once per email', badge: null, badgeColor: '', highlight: false,
    features: ['Upload 1 paper', 'Teaser report', 'Score overview', 'No rubric needed'],
    cta: 'Try Free', action: () => router.push('/free-sample'),
  },
  {
    name: 'Token', price: 'R25', period: 'per evaluation', badge: null, badgeColor: '', highlight: false,
    features: ['Upload rubric + paper', 'Full AI evaluation', 'Score breakdown', 'Reference audit'],
    cta: 'Buy Token', action: () => router.push('/buy-token'),
  },
  {
    name: 'Registered', price: 'R20', period: 'per evaluation', badge: 'BEST VALUE', badgeColor: 'blue', highlight: true,
    features: ['Everything in Token', 'Paper history', 'Saved rubrics', 'Draft vs final comparison'],
    cta: 'Create Account', action: null,
  },
  {
    name: 'Bulk 5-Pack', price: 'R85', period: 'R17 each', badge: 'SAVE R40', badgeColor: 'green', highlight: false,
    features: ['5 evaluations', 'Everything in Registered', 'AI detection report', 'Priority processing'],
    cta: 'Buy 5-Pack', action: null,
  },
]

function goGrades() {
  if (authStore.isLoggedIn) {
    router.push('/workspace/children')
  } else {
    localStorage.setItem('bg_product', 'grades')
    router.push('/get-started?redirect=/workspace/children')
  }
}

function goPapers() {
  if (authStore.isLoggedIn) {
    router.push('/workspace/papers')
  } else {
    localStorage.setItem('bg_product', 'papers')
    router.push('/get-started?redirect=/workspace/papers')
  }
}
</script>

<style scoped>
.hero-section {
  padding-top: 60px;
  padding-bottom: 40px;
}
.product-card {
  transition: transform 0.2s, box-shadow 0.2s;
}
.product-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
}
.pricing-card {
  width: 100%;
  max-width: 240px;
  min-height: 340px;
  display: flex;
  flex-direction: column;
}
.pricing-card .pricing-features {
  flex: 1;
}
</style>
