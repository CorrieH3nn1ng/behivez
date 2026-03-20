<template>
  <q-page>
    <!-- Hero Section with Hexagon Hive -->
    <section class="hero-section flex flex-center column text-center q-pa-xl">
      <div class="hive-container">
        <!-- Connecting lines (SVG behind hexagons) -->
        <svg class="hive-lines" viewBox="0 0 600 520" xmlns="http://www.w3.org/2000/svg">
          <!-- Lines from center to each product -->
          <line x1="300" y1="260" x2="300" y2="80" stroke="rgba(245,158,11,0.25)" stroke-width="2" />
          <line x1="300" y1="260" x2="458" y2="170" stroke="rgba(245,158,11,0.25)" stroke-width="2" />
          <line x1="300" y1="260" x2="458" y2="350" stroke="rgba(245,158,11,0.25)" stroke-width="2" />
          <line x1="300" y1="260" x2="300" y2="440" stroke="rgba(245,158,11,0.25)" stroke-width="2" />
          <line x1="300" y1="260" x2="142" y2="350" stroke="rgba(245,158,11,0.25)" stroke-width="2" />
          <line x1="300" y1="260" x2="142" y2="170" stroke="rgba(245,158,11,0.25)" stroke-width="2" />
        </svg>

        <!-- Center: BeHivez (large) -->
        <div class="hex hex-center" @click="scrollTo('about')">
          <div class="hex-inner hex-behivez">
            <q-icon name="hexagon" size="42px" color="amber-8" />
            <div class="hex-title-lg">BeHivez</div>
            <div class="hex-subtitle">The Hive</div>
          </div>
        </div>

        <!-- Top: BeeGraded -->
        <a class="hex hex-satellite hex-pos-top" href="https://beegraded.co.za" target="_blank">
          <div class="hex-inner hex-live">
            <q-icon name="grading" size="28px" color="amber-8" />
            <div class="hex-title">BeeGraded</div>
            <q-badge color="green-8" class="hex-badge">Live</q-badge>
          </div>
        </a>

        <!-- Top-Right: Pollenz -->
        <a class="hex hex-satellite hex-pos-tr" href="https://pollenz.co.za" target="_blank">
          <div class="hex-inner hex-live">
            <q-icon name="account_balance_wallet" size="28px" color="amber-8" />
            <div class="hex-title">Pollenz</div>
            <q-badge color="green-8" class="hex-badge">Live</q-badge>
          </div>
        </a>

        <!-- Bottom-Right: Swarmz -->
        <a class="hex hex-satellite hex-pos-br" href="https://swarmz.co.za" target="_blank">
          <div class="hex-inner hex-live">
            <q-icon name="local_shipping" size="28px" color="amber-8" />
            <div class="hex-title">Swarmz</div>
            <q-badge color="green-8" class="hex-badge">Live</q-badge>
          </div>
        </a>

        <!-- Bottom: Broodz -->
        <a class="hex hex-satellite hex-pos-bottom" href="https://broodz.co.za" target="_blank">
          <div class="hex-inner hex-live">
            <q-icon name="person_search" size="28px" color="amber-8" />
            <div class="hex-title">Broodz</div>
            <q-badge color="green-8" class="hex-badge">Live</q-badge>
          </div>
        </a>

        <!-- Bottom-Left: Future -->
        <div class="hex hex-satellite hex-pos-bl">
          <div class="hex-inner hex-future">
            <q-icon name="add" size="28px" color="grey-5" />
            <div class="hex-title text-grey-5">More</div>
          </div>
        </div>

        <!-- Top-Left: Future -->
        <div class="hex hex-satellite hex-pos-tl">
          <div class="hex-inner hex-future">
            <q-icon name="add" size="28px" color="grey-5" />
            <div class="hex-title text-grey-5">More</div>
          </div>
        </div>
      </div>

      <h1 class="text-h3 text-weight-bold text-grey-9 q-mt-xl q-mb-sm">
        A Hive of Smart Tools
      </h1>
      <p class="text-body1 text-grey-7" style="max-width: 500px;">
        SaaS products built for South African entrepreneurs.
        Each tool does one thing well. Pick what you need.
      </p>
    </section>

    <!-- Products Detail Section -->
    <section id="products" class="q-pa-xl" style="background: #ffffff;">
      <div class="text-center q-mb-xl">
        <h2 class="text-h4 text-grey-9 q-mb-sm">The Hive</h2>
        <p class="text-grey-6">Our products — live and coming soon</p>
      </div>

      <div class="row justify-center q-gutter-lg">
        <div v-for="product in products" :key="product.name" class="col-auto">
          <q-card class="product-card" flat bordered>
            <q-card-section class="text-center">
              <q-icon :name="product.icon" size="48px" color="amber-8" />
              <div class="text-h5 text-weight-bold text-grey-9 q-mt-md">{{ product.name }}</div>
              <q-badge :color="product.live ? 'green-8' : 'blue-grey-7'" class="q-mt-sm">
                {{ product.live ? 'Live' : 'Coming Soon' }}
              </q-badge>
            </q-card-section>
            <q-card-section class="text-grey-7 text-center">
              <span v-html="product.desc" />
            </q-card-section>
            <q-card-section class="text-center text-weight-medium" :class="product.live ? 'text-amber-9' : 'text-grey-5'">
              {{ product.price }}
            </q-card-section>
            <q-card-actions align="center" class="q-pb-md">
              <q-btn
                :color="product.live ? 'amber-8' : 'grey-5'"
                :text-color="product.live ? 'white' : 'white'"
                :label="product.live ? 'Go to ' + product.name : 'Coming Soon'"
                no-caps
                unelevated
                :href="product.url"
                target="_blank"
              />
            </q-card-actions>
          </q-card>
        </div>
      </div>
    </section>

    <!-- How It Works -->
    <section class="q-pa-xl" style="background: var(--bg-primary);">
      <div class="text-center q-mb-xl">
        <h2 class="text-h4 text-grey-9 q-mb-sm">How It Works</h2>
        <p class="text-grey-6">Three steps. That's it.</p>
      </div>

      <div class="row justify-center q-gutter-xl">
        <div v-for="step in steps" :key="step.num" class="col-auto text-center" style="max-width: 220px;">
          <q-icon :name="step.icon" size="48px" color="amber-8" />
          <div class="text-h6 text-grey-9 q-mt-md q-mb-sm">{{ step.num }}. {{ step.title }}</div>
          <p class="text-grey-7">{{ step.text }}</p>
        </div>
      </div>
    </section>

    <!-- Why BeHivez -->
    <section id="about" class="q-pa-xl" style="background: #ffffff;">
      <div class="text-center q-mb-xl">
        <h2 class="text-h4 text-grey-9 q-mb-sm">Why BeHivez?</h2>
      </div>

      <div class="row justify-center q-gutter-xl">
        <div v-for="reason in reasons" :key="reason.title" class="col-auto text-center" style="max-width: 250px;">
          <q-icon :name="reason.icon" size="48px" color="amber-8" />
          <div class="text-h6 text-grey-9 q-mt-md q-mb-sm">{{ reason.title }}</div>
          <p class="text-grey-7">{{ reason.text }}</p>
        </div>
      </div>
    </section>

    <!-- Bottom CTA -->
    <section class="q-pa-xl text-center" style="background: var(--honey);">
      <h3 class="text-h5 text-amber-10 q-mb-md">Built in South Africa. For South Africa.</h3>
      <p class="text-grey-8" style="max-width: 500px; margin: 0 auto;">
        Simple tools. Fair pricing. No nonsense.
      </p>
    </section>
  </q-page>
</template>

<script setup lang="ts">
const products = [
  {
    name: 'BeeGraded',
    icon: 'grading',
    desc: 'AI-powered paper evaluation.<br>Upload a document, get a rubric-based report in minutes.',
    price: 'R20 per paper',
    live: true,
    url: 'https://beegraded.co.za',
  },
  {
    name: 'Pollenz',
    icon: 'account_balance_wallet',
    desc: 'Income &amp; expense tracking for freelancers.<br>Auto-generate your SARS tax submission pack.',
    price: 'Pricing TBA',
    live: true,
    url: 'https://pollenz.co.za',
  },
  {
    name: 'Swarmz',
    icon: 'local_shipping',
    desc: 'Fleet operations management.<br>Track vehicles, bookings, maintenance and costs in one place.',
    price: 'Pricing TBA',
    live: true,
    url: 'https://swarmz.co.za',
  },
  {
    name: 'Broodz',
    icon: 'person_search',
    desc: 'Recruitment made simple.<br>Post jobs, screen candidates, hire the right people.',
    price: 'Pricing TBA',
    live: true,
    url: 'https://broodz.co.za',
  },
]

const steps = [
  { num: 1, icon: 'search', title: 'Browse', text: 'Check out the hive. Find the tool that fits your business.' },
  { num: 2, icon: 'touch_app', title: 'Pick', text: 'Sign up for only what you need. No bundles, no bloat.' },
  { num: 3, icon: 'rocket_launch', title: 'Go', text: 'Start using your tool straight away. Pay as you go.' },
]

const reasons = [
  { icon: 'savings', title: 'Affordable', text: 'Built for SA budgets. No dollar pricing, no surprises.' },
  { icon: 'flag', title: 'SA-Built', text: 'Made here, hosted here. We understand your business.' },
  { icon: 'lock_open', title: 'No Lock-In', text: 'Use one tool or all of them. Cancel anytime, no contracts.' },
]

function scrollTo(id: string) {
  const el = document.getElementById(id)
  if (el) el.scrollIntoView({ behavior: 'smooth' })
}
</script>

<style lang="scss" scoped>
.hero-section {
  background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 50%, #fffbeb 100%);
  min-height: 80vh;
  padding-top: 80px;
  padding-bottom: 60px;
}

/* ── Hive layout ── */
.hive-container {
  position: relative;
  width: 600px;
  height: 520px;
}

.hive-lines {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

/* ── Hexagon shape ── */
.hex {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
  transition: transform 0.3s, filter 0.3s;
  cursor: pointer;
  text-decoration: none;
  color: inherit;

  &:hover {
    transform: scale(1.08);
    filter: brightness(1.05);
  }
}

.hex-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: calc(100% - 6px);
  height: calc(100% - 6px);
  margin: 3px;
  clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
  padding: 20px;
}

/* ── Center hex ── */
.hex-center {
  width: 180px;
  height: 200px;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  background: #78350f;
  z-index: 2;

  &:hover {
    transform: translate(-50%, -50%) scale(1.08);
  }

  .hex-inner {
    background: linear-gradient(135deg, #ffffff, #fef3c7);
  }
}

.hex-title-lg {
  font-size: 1.3rem;
  font-weight: 700;
  color: #b45309;
  margin-top: 4px;
}

.hex-subtitle {
  font-size: 0.75rem;
  color: rgba(180, 83, 9, 0.6);
  letter-spacing: 2px;
  text-transform: uppercase;
}

/* ── Satellite hexes ── */
.hex-satellite {
  width: 130px;
  height: 145px;
  background: #78350f;
  z-index: 1;

  .hex-inner {
    background: #ffffff;
  }
}

.hex-live {
  background: #78350f;
}

.hex-title {
  font-size: 0.8rem;
  font-weight: 600;
  color: #1c1917;
  margin-top: 4px;
}

.hex-badge {
  margin-top: 4px;
  font-size: 0.6rem;
}

.hex-future {
  background: rgba(0, 0, 0, 0.03);
}

/* ── Satellite positions (around center) ── */
$r: 190px; // radius from center

.hex-pos-top {
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%) translate(0, -$r);
  &:hover { transform: translate(-50%, -50%) translate(0, -$r) scale(1.08); }
}

.hex-pos-tr {
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%) translate($r * 0.866, -$r * 0.5);
  &:hover { transform: translate(-50%, -50%) translate($r * 0.866, -$r * 0.5) scale(1.08); }
}

.hex-pos-br {
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%) translate($r * 0.866, $r * 0.5);
  &:hover { transform: translate(-50%, -50%) translate($r * 0.866, $r * 0.5) scale(1.08); }
}

.hex-pos-bottom {
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%) translate(0, $r);
  &:hover { transform: translate(-50%, -50%) translate(0, $r) scale(1.08); }
}

.hex-pos-bl {
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%) translate(-$r * 0.866, $r * 0.5);
  &:hover { transform: translate(-50%, -50%) translate(-$r * 0.866, $r * 0.5) scale(1.08); }
}

.hex-pos-tl {
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%) translate(-$r * 0.866, -$r * 0.5);
  &:hover { transform: translate(-50%, -50%) translate(-$r * 0.866, -$r * 0.5) scale(1.08); }
}

/* ── Product cards (detail section) ── */
.product-card {
  width: 280px;
  background: #fffbeb;
  border-color: rgba(245, 158, 11, 0.2) !important;
  transition: transform 0.2s, border-color 0.2s;

  &:hover {
    transform: translateY(-4px);
    border-color: rgba(245, 158, 11, 0.5) !important;
  }
}

/* ── Pulse animation for center hex ── */
.hex-center {
  animation: hex-pulse 4s ease-in-out infinite;
}

@keyframes hex-pulse {
  0%, 100% { background: #78350f; }
  50% { background: #92400e; }
}

/* ── Mobile responsive ── */
@media (max-width: 650px) {
  .hive-container {
    width: 340px;
    height: 320px;
  }

  .hex-center {
    width: 120px;
    height: 134px;
  }

  .hex-satellite {
    width: 85px;
    height: 95px;
  }

  .hex-title-lg { font-size: 1rem; }
  .hex-title { font-size: 0.65rem; }
  .hex-badge { font-size: 0.5rem; }
  .hex-subtitle { font-size: 0.6rem; }

  .hive-lines { display: none; }

  $r-sm: 120px;

  .hex-pos-top {
    transform: translate(-50%, -50%) translate(0, -$r-sm);
    &:hover { transform: translate(-50%, -50%) translate(0, -$r-sm) scale(1.08); }
  }
  .hex-pos-tr {
    transform: translate(-50%, -50%) translate($r-sm * 0.866, -$r-sm * 0.5);
    &:hover { transform: translate(-50%, -50%) translate($r-sm * 0.866, -$r-sm * 0.5) scale(1.08); }
  }
  .hex-pos-br {
    transform: translate(-50%, -50%) translate($r-sm * 0.866, $r-sm * 0.5);
    &:hover { transform: translate(-50%, -50%) translate($r-sm * 0.866, $r-sm * 0.5) scale(1.08); }
  }
  .hex-pos-bottom {
    transform: translate(-50%, -50%) translate(0, $r-sm);
    &:hover { transform: translate(-50%, -50%) translate(0, $r-sm) scale(1.08); }
  }
  .hex-pos-bl {
    transform: translate(-50%, -50%) translate(-$r-sm * 0.866, $r-sm * 0.5);
    &:hover { transform: translate(-50%, -50%) translate(-$r-sm * 0.866, $r-sm * 0.5) scale(1.08); }
  }
  .hex-pos-tl {
    transform: translate(-50%, -50%) translate(-$r-sm * 0.866, -$r-sm * 0.5);
    &:hover { transform: translate(-50%, -50%) translate(-$r-sm * 0.866, -$r-sm * 0.5) scale(1.08); }
  }
}
</style>
