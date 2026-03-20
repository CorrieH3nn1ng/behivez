<template>
  <q-page class="honeycomb-bg">
    <!-- Hero -->
    <section class="hero-section q-pa-xl text-center">
      <div class="hero-content" style="max-width: 700px; margin: 0 auto;">
        <q-icon name="hive" size="64px" color="amber" class="q-mb-md" />
        <h1 class="text-h3 text-weight-bold q-mb-sm" style="color: #1c1917;">
          Get <span class="text-amber-8">BeeGraded</span> before you get graded
        </h1>
        <p class="text-subtitle1 text-grey-7 q-mb-lg" style="max-width: 540px; margin: 0 auto;">
          Upload your paper with your actual rubric. Get an honest evaluation report with scores, fix list, and examples — before you submit.
        </p>
        <div class="row justify-center q-gutter-md">
          <q-btn class="btn-bee" size="lg" no-caps label="Try Free Sample" to="/free-sample" icon="hive" />
          <q-btn outline color="amber-8" size="lg" no-caps label="Buy Token — R25" to="/buy-token" icon="token" />
        </div>
        <div class="q-mt-sm text-center">
          <q-btn flat no-caps color="grey-7" label="Already registered? Sign in" to="/get-started" size="sm" />
        </div>
      </div>
    </section>

    <!-- Stats bar -->
    <section class="q-pa-lg" style="background: #1c1917; color: white;">
      <div class="row justify-center q-gutter-xl text-center">
        <div>
          <div class="text-h4 text-weight-bold text-amber">FREE</div>
          <div class="text-caption text-grey-5">sample evaluation</div>
        </div>
        <div>
          <div class="text-h4 text-weight-bold text-amber">R25</div>
          <div class="text-caption text-grey-5">per token (with your rubric)</div>
        </div>
        <div>
          <div class="text-h4 text-weight-bold text-amber">R20</div>
          <div class="text-caption text-grey-5">registered users</div>
        </div>
        <div>
          <div class="text-h4 text-weight-bold text-amber">60s</div>
          <div class="text-caption text-grey-5">average turnaround</div>
        </div>
      </div>
    </section>

    <!-- How It Works -->
    <section id="how-it-works" class="page-container q-py-xl">
      <h2 class="text-h4 text-weight-bold text-center q-mb-lg">How It Works</h2>
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

    <!-- 3-Tier Pricing -->
    <section id="pricing" class="q-py-xl" style="background: white;">
      <div class="page-container">
        <h2 class="text-h4 text-weight-bold text-center q-mb-sm">Choose Your Plan</h2>
        <p class="text-grey-7 text-center q-mb-xl">From free sample to full workspace — pick what works for you.</p>

        <div class="row q-gutter-lg justify-center">
          <!-- Tier 1: Free Sample -->
          <q-card flat class="bee-card q-pa-lg" style="max-width: 320px; width: 100%;">
            <div class="text-center q-mb-md">
              <q-icon name="science" size="36px" color="blue" />
              <div class="text-h6 text-weight-bold q-mt-sm">Free Sample</div>
              <div class="text-h3 text-weight-bold text-blue">R0</div>
              <div class="text-caption text-grey-6">1 per email, default rubric</div>
            </div>
            <q-list dense class="q-mb-lg">
              <q-item v-for="f in tier1Features" :key="f">
                <q-item-section avatar><q-icon name="check_circle" color="positive" size="16px" /></q-item-section>
                <q-item-section><span style="font-size: 13px;">{{ f }}</span></q-item-section>
              </q-item>
              <q-item>
                <q-item-section avatar><q-icon name="blur_on" color="grey-5" size="16px" /></q-item-section>
                <q-item-section><span style="font-size: 13px; color: #9ca3af;">Teaser report (details blurred)</span></q-item-section>
              </q-item>
            </q-list>
            <q-btn outline color="blue" class="full-width" size="lg" no-caps label="Try Free Sample" to="/free-sample" />
          </q-card>

          <!-- Tier 2: Token (highlighted) -->
          <q-card flat class="bee-card q-pa-lg" style="max-width: 320px; width: 100%; border: 2px solid #f59e0b;">
            <q-badge color="amber" floating label="POPULAR" />
            <div class="text-center q-mb-md">
              <q-icon name="token" size="36px" color="amber" />
              <div class="text-h6 text-weight-bold q-mt-sm">One-off Token</div>
              <div class="text-h3 text-weight-bold text-amber-8">R25</div>
              <div class="text-caption text-grey-6">Your rubric PDF + draft + final</div>
            </div>
            <q-list dense class="q-mb-lg">
              <q-item v-for="f in tier2Features" :key="f">
                <q-item-section avatar><q-icon name="check_circle" color="positive" size="16px" /></q-item-section>
                <q-item-section><span style="font-size: 13px;">{{ f }}</span></q-item-section>
              </q-item>
            </q-list>
            <q-btn class="btn-bee full-width" size="lg" no-caps label="Buy Token" to="/buy-token" />
          </q-card>

          <!-- Tier 3: Registered -->
          <q-card flat class="bee-card q-pa-lg" style="max-width: 320px; width: 100%;">
            <div class="text-center q-mb-md">
              <q-icon name="workspace_premium" size="36px" color="green" />
              <div class="text-h6 text-weight-bold q-mt-sm">Registered</div>
              <div class="text-h3 text-weight-bold text-green">R20</div>
              <div class="text-caption text-grey-6">per evaluation</div>
            </div>
            <q-list dense class="q-mb-lg">
              <q-item v-for="f in tier3Features" :key="f">
                <q-item-section avatar><q-icon name="check_circle" color="positive" size="16px" /></q-item-section>
                <q-item-section><span style="font-size: 13px;">{{ f }}</span></q-item-section>
              </q-item>
            </q-list>
            <q-btn outline color="green" class="full-width" size="lg" no-caps label="Create Account" to="/get-started" />
          </q-card>
        </div>

        <!-- Affiliate note -->
        <div class="text-center q-mt-lg text-caption text-grey-6">
          <q-icon name="redeem" size="14px" class="q-mr-xs" />
          Have an affiliate coupon? Get 25% off any tier.
          <q-btn flat no-caps color="amber-8" label="Apply Coupon" to="/buy-token" size="sm" class="q-ml-xs" />
        </div>
      </div>
    </section>

    <!-- Modes -->
    <section class="q-py-xl">
      <div class="page-container">
        <h2 class="text-h4 text-weight-bold text-center q-mb-lg">Choose Your Report Mode</h2>
        <div class="row q-gutter-lg justify-center">
          <!-- Mode A -->
          <q-card flat class="bee-card q-pa-lg" style="max-width: 420px;">
            <div class="row items-center q-mb-md">
              <q-icon name="school" size="32px" color="blue" class="q-mr-sm" />
              <div>
                <div class="text-h6 text-weight-bold">Mode A — Academic Quality</div>
                <div class="text-caption text-grey-7">Structure, references, critical thinking</div>
              </div>
            </div>
            <q-list dense>
              <q-item v-for="f in modeAFeatures" :key="f">
                <q-item-section avatar><q-icon name="check_circle" color="positive" size="18px" /></q-item-section>
                <q-item-section><span style="font-size: 13px;">{{ f }}</span></q-item-section>
              </q-item>
            </q-list>
          </q-card>

          <!-- Mode B -->
          <q-card flat class="bee-card q-pa-lg" style="max-width: 420px; border: 2px solid #ef4444;">
            <div class="row items-center q-mb-md">
              <q-icon name="shield" size="32px" color="red" class="q-mr-sm" />
              <div>
                <div class="text-h6 text-weight-bold">Mode B — Full Turnitin Ready</div>
                <div class="text-caption text-red">Everything in Mode A + AI detection</div>
              </div>
            </div>
            <q-list dense>
              <q-item v-for="f in modeBFeatures" :key="f">
                <q-item-section avatar><q-icon name="check_circle" color="positive" size="18px" /></q-item-section>
                <q-item-section><span style="font-size: 13px;">{{ f }}</span></q-item-section>
              </q-item>
            </q-list>
          </q-card>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="q-pa-xl text-center" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white;">
      <h2 class="text-h4 text-weight-bold q-mb-sm">Don't guess your grade. Know it.</h2>
      <p class="q-mb-lg" style="opacity: 0.9;">Upload your paper now and get your evaluation in under 60 seconds.</p>
      <div class="row justify-center q-gutter-md">
        <q-btn flat no-caps size="lg" class="bg-white text-amber-9 text-weight-bold" label="Try Free Sample" to="/free-sample" />
        <q-btn outline no-caps size="lg" class="text-white" style="border-color: white;" label="Buy Token — R25" to="/buy-token" />
      </div>
    </section>
  </q-page>
</template>

<script setup lang="ts">
const steps = [
  { num: 1, title: 'Try Free', desc: 'Upload a paper, get a teaser report — free' },
  { num: 2, title: 'Buy Token', desc: 'Pay R25 to unlock your rubric + full report' },
  { num: 3, title: 'Upload Rubric', desc: 'Upload your lecturer\'s rubric PDF' },
  { num: 4, title: 'Get Report', desc: 'Full evaluation in ~60 seconds' },
]

const tier1Features = [
  'Upload your paper',
  'Default rubric evaluation',
  'Overall score visible',
]

const tier2Features = [
  'Upload your own rubric PDF',
  'AI extracts questions & criteria',
  'Full detailed report (no blur)',
  'Draft + final evaluation',
  'Draft-to-final comparison',
  'No account needed',
]

const tier3Features = [
  'Everything in Token',
  'Personal workspace & history',
  'Rubric reuse across papers',
  'R20/eval (save R5 each)',
  'Previous results imported',
]

const modeAFeatures = [
  'Score breakdown per criterion',
  'Per-question evaluation',
  'Reference integrity audit',
  'Structure & formatting check',
  'Critical thinking analysis',
  'Before/after writing examples',
  'Prioritised fix list',
]

const modeBFeatures = [
  'Everything in Mode A',
  'AI detection risk assessment',
  'AI indicators breakdown',
  'Turnitin readiness score',
  'Specific AI-reduction guidance',
  'Submission recommendation',
]
</script>

<style scoped>
.hero-section {
  padding-top: 80px;
  padding-bottom: 60px;
}
</style>
