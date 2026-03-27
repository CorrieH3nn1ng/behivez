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
              <div class="text-h6 text-amber-8">Toets My</div>
              <div class="text-caption text-grey-6 q-mt-xs">Gr 1 — 12</div>
            </div>

            <q-list dense class="q-mb-lg">
              <q-item v-for="f in gradesFeatures" :key="f">
                <q-item-section avatar><q-icon name="check_circle" color="positive" size="16px" /></q-item-section>
                <q-item-section><span style="font-size: 13px;">{{ f }}</span></q-item-section>
              </q-item>
            </q-list>

            <div class="text-center q-mb-sm">
              <q-badge color="green-2" text-color="green-9" class="q-pa-xs" style="font-size: 12px;">
                Maaltafel &bull; Plus Minus &bull; Probleemoplossing
              </q-badge>
            </div>
            <div class="text-center q-mb-sm">
              <q-badge color="blue-1" text-color="blue-8" class="q-pa-xs" style="font-size: 11px;">
                Afrikaans &bull; English &bull; Setswana
              </q-badge>
            </div>

            <q-btn class="btn-bee full-width" size="lg" no-caps icon="flash_on" label="Begin" @click.stop="goGrades" />
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

            <q-btn outline color="blue-8" class="full-width" size="lg" no-caps icon="description" label="Begin" @click.stop="goPapers" />
          </q-card>
        </div>

        <div class="text-center q-mt-lg">
          <q-btn flat no-caps color="grey-7" label="Already registered? Sign in" to="/get-started" size="sm" />
        </div>
      </div>
    </section>

    <!-- Papers: How It Works (shown below for SEO / context) -->
    <section id="how-it-works" class="page-container q-py-xl">
      <h2 class="text-h4 text-weight-bold text-center q-mb-lg">How Papers Works</h2>
      <div class="row q-gutter-lg justify-center">
        <div v-for="step in steps" :key="step.num" class="col-auto">
          <q-card flat class="bee-card text-center q-pa-lg" style="width: 220px;">
            <div class="hex-badge q-mx-auto q-mb-md">{{ step.num }}</div>
            <div class="text-weight-bold q-mb-xs">{{ step.title }}</div>
            <div class="text-caption text-grey-7">{{ step.desc }}</div>
          </q-card>
        </div>
      </div>
    </section>

    <!-- Pricing -->
    <section id="pricing" class="q-py-xl" style="background: white;">
      <div class="page-container">
        <h2 class="text-h4 text-weight-bold text-center q-mb-sm">Papers Pricing</h2>
        <p class="text-grey-7 text-center q-mb-xl">From free sample to full workspace — pick what works for you.</p>

        <div class="row q-gutter-lg justify-center">
          <q-card flat class="bee-card q-pa-lg" style="max-width: 280px; width: 100%;">
            <div class="text-center q-mb-md">
              <q-icon name="science" size="36px" color="blue" />
              <div class="text-h6 text-weight-bold q-mt-sm">Free Sample</div>
              <div class="text-h3 text-weight-bold text-blue">R0</div>
              <div class="text-caption text-grey-6">1 per email</div>
            </div>
            <q-btn outline color="blue" class="full-width" no-caps label="Try Free" to="/free-sample" />
          </q-card>

          <q-card flat class="bee-card q-pa-lg" style="max-width: 280px; width: 100%; border: 2px solid #f59e0b;">
            <q-badge color="amber" floating label="POPULAR" />
            <div class="text-center q-mb-md">
              <q-icon name="token" size="36px" color="amber" />
              <div class="text-h6 text-weight-bold q-mt-sm">Token</div>
              <div class="text-h3 text-weight-bold text-amber-8">R25</div>
              <div class="text-caption text-grey-6">rubric + draft + final</div>
            </div>
            <q-btn class="btn-bee full-width" no-caps label="Buy Token" to="/buy-token" />
          </q-card>

          <q-card flat class="bee-card q-pa-lg" style="max-width: 280px; width: 100%;">
            <div class="text-center q-mb-md">
              <q-icon name="workspace_premium" size="36px" color="green" />
              <div class="text-h6 text-weight-bold q-mt-sm">Registered</div>
              <div class="text-h3 text-weight-bold text-green">R20</div>
              <div class="text-caption text-grey-6">per evaluation</div>
            </div>
            <q-btn outline color="green" class="full-width" no-caps label="Create Account" @click="goPapers" />
          </q-card>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="q-pa-xl text-center" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white;">
      <h2 class="text-h4 text-weight-bold q-mb-sm">Ready to get started?</h2>
      <p class="q-mb-lg" style="opacity: 0.9;">Choose Grades for school practice or Papers for university evaluation.</p>
      <div class="row justify-center q-gutter-md">
        <q-btn flat no-caps size="lg" class="bg-white text-amber-9 text-weight-bold" label="Grades — Toets My" icon="calculate" @click="goGrades" />
        <q-btn outline no-caps size="lg" class="text-white" style="border-color: white;" label="Papers — Evaluate" icon="description" @click="goPapers" />
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
  'Maaltafel speed tests (× ÷)',
  'Plus Minus drills (+ -)',
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

const steps = [
  { num: 1, title: 'Try Free', desc: 'Upload a paper, get a teaser report — free' },
  { num: 2, title: 'Buy Token', desc: 'Pay R25 to unlock your rubric + full report' },
  { num: 3, title: 'Upload Rubric', desc: "Upload your lecturer's rubric PDF" },
  { num: 4, title: 'Get Report', desc: 'Full evaluation in ~60 seconds' },
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
    router.push('/workspace')
  } else {
    localStorage.setItem('bg_product', 'papers')
    router.push('/get-started?redirect=/workspace')
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
</style>
