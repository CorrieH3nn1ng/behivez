<template>
  <q-page v-if="talent">
    <!-- 1. HERO — cover, avatar, name, tagline, location, category, theme -->
    <section class="profile-hero" :style="heroStyle">
      <div class="hero-overlay q-pa-xl" :style="overlayStyle">
        <div class="row items-end q-col-gutter-md" style="max-width: 900px; margin: 0 auto;">
          <div class="col-auto">
            <q-avatar size="120px" class="shadow-4">
              <img v-if="talent.profile_image" :src="talent.profile_image" :alt="talent.name" />
              <q-icon v-else name="person" size="60px" color="brown-3" />
            </q-avatar>
          </div>
          <div class="col">
            <h1 class="text-h4 text-weight-bold q-mb-none q-mt-none" :style="{ color: heroTextColor }">{{ talent.name }}</h1>
            <p v-if="talent.tagline" class="text-subtitle1 q-mb-xs" :style="{ color: themeAccent }">{{ talent.tagline }}</p>
            <div class="row items-center q-gutter-sm" :style="{ color: heroSubTextColor }">
              <q-chip v-if="talent.category_name" dense outline :color="isLightTheme ? 'brown-8' : 'white'" :text-color="isLightTheme ? 'brown-8' : 'white'">
                {{ talent.category_name }}
              </q-chip>
              <q-chip v-if="talent.location" dense outline :color="isLightTheme ? 'brown-8' : 'white'" :text-color="isLightTheme ? 'brown-8' : 'white'" icon="place">
                {{ talent.location }}
              </q-chip>
            </div>
          </div>
        </div>
      </div>
    </section>

    <div style="max-width: 900px; margin: 0 auto;" class="q-pa-md">
      <!-- 2. WHAT I DO — bio + social links -->
      <section v-if="talent.bio" class="q-mb-lg">
        <h2 class="text-h6 text-weight-bold q-mb-sm">What I Do</h2>
        <p class="text-body1" style="white-space: pre-line;">{{ talent.bio }}</p>
        <social-links v-if="talent.social_links" :links="talent.social_links" />
      </section>

      <!-- 3. SERVICES -->
      <section v-if="talent.services?.length" class="q-mb-lg">
        <h2 class="text-h6 text-weight-bold q-mb-sm">Services</h2>
        <div class="row q-col-gutter-md">
          <div v-for="svc in talent.services" :key="svc.id" class="col-12 col-sm-6 col-md-4">
            <service-card :service="svc" />
          </div>
        </div>
      </section>

      <!-- 4. SHOP — products for sale -->
      <section v-if="talent.products?.length" class="q-mb-lg">
        <h2 class="text-h6 text-weight-bold q-mb-sm">Shop</h2>
        <div class="row q-col-gutter-md">
          <div v-for="prod in talent.products" :key="prod.id" class="col-12 col-sm-6 col-md-4">
            <product-card :product="prod" @enquire="handleProductEnquiry" />
          </div>
        </div>
      </section>

      <!-- 5. GALLERY PREVIEW — first 6 items + "View Full Gallery" link -->
      <section v-if="talent.portfolio?.length" class="q-mb-lg">
        <div class="row items-center q-mb-sm">
          <h2 class="text-h6 text-weight-bold q-mb-none col">Gallery</h2>
          <q-btn v-if="talent.portfolio.length > 6" flat no-caps color="brown-8" :to="'/' + talent.slug + '/gallery'" label="View Full Gallery →" />
        </div>
        <portfolio-gallery :items="previewItems" :preview-mode="true" />
        <div v-if="talent.portfolio.length > 6" class="text-center q-mt-md">
          <q-btn outline no-caps color="brown-8" :to="'/' + talent.slug + '/gallery'" label="View Full Gallery →" />
        </div>
      </section>

      <!-- 6. CONTACT — WhatsApp button + enquiry form + contact details -->
      <section class="q-mb-lg">
        <h2 class="text-h6 text-weight-bold q-mb-sm">Get in Touch</h2>

        <!-- WhatsApp CTA -->
        <q-btn
          v-if="whatsappUrl"
          color="green"
          no-caps
          icon="fab fa-whatsapp"
          :label="'WhatsApp ' + talent.name"
          :href="whatsappUrl"
          target="_blank"
          class="full-width q-mb-md"
          size="lg"
        />

        <!-- Contact details -->
        <div v-if="talent.phone || talent.email" class="row q-gutter-md q-mb-md">
          <q-chip v-if="talent.phone" icon="phone" color="brown-1" text-color="brown-8" clickable @click="callPhone">
            {{ talent.phone }}
          </q-chip>
          <q-chip v-if="talent.email" icon="email" color="brown-1" text-color="brown-8" clickable @click="sendEmail">
            {{ talent.email }}
          </q-chip>
        </div>

        <enquiry-form ref="enquiryFormRef" :talent-id="talent.id" :talent-name="talent.name" :pre-message="enquiryPreMessage" />
      </section>

      <!-- 7. SHARE — copy link + WhatsApp share -->
      <section class="q-mb-lg">
        <h2 class="text-h6 text-weight-bold q-mb-sm">Share</h2>
        <div class="row q-gutter-sm">
          <q-btn outline no-caps icon="content_copy" label="Copy Link" color="brown-8" @click="copyLink" />
          <q-btn outline no-caps icon="fab fa-whatsapp" label="Share on WhatsApp" color="green" :href="whatsappShareUrl" target="_blank" />
        </div>
      </section>
    </div>
  </q-page>

  <!-- Loading state -->
  <q-page v-else-if="loading" class="flex flex-center" style="min-height: 60vh;">
    <q-spinner-gears size="48px" color="brown-8" />
  </q-page>

  <!-- Not found -->
  <q-page v-else class="flex flex-center text-center" style="min-height: 60vh;">
    <div>
      <q-icon name="person_off" size="64px" color="grey-5" class="q-mb-md" />
      <p class="text-h6">Talent not found</p>
      <q-btn flat no-caps label="Browse Talents" to="/" color="brown-8" />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onServerPrefetch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useMeta, copyToClipboard, Notify } from 'quasar'
import { useTalentStore, type Talent, type Product } from 'src/stores/talent'
import ServiceCard from 'src/components/ServiceCard.vue'
import PortfolioGallery from 'src/components/PortfolioGallery.vue'
import ProductCard from 'src/components/ProductCard.vue'
import SocialLinks from 'src/components/SocialLinks.vue'
import EnquiryForm from 'src/components/EnquiryForm.vue'

const props = defineProps<{ slug: string }>()
const route = useRoute()
const talentStore = useTalentStore()

const talent = ref<Talent | null>(null)
const loading = ref(true)
const enquiryPreMessage = ref('')

// Theme config
const themeMap: Record<string, { heroBg: string; accent: string }> = {
  earth: { heroBg: '#3e2723', accent: '#ffc107' },
  'earth-light': { heroBg: '#efebe9', accent: '#8d6e63' },
  ocean: { heroBg: '#37474f', accent: '#00bcd4' },
  'ocean-light': { heroBg: '#e0f7fa', accent: '#00838f' },
  sunset: { heroBg: '#bf360c', accent: '#ff9800' },
  'sunset-light': { heroBg: '#fff3e0', accent: '#e65100' },
  forest: { heroBg: '#1b5e20', accent: '#8bc34a' },
  'forest-light': { heroBg: '#e8f5e9', accent: '#2e7d32' },
  slate: { heroBg: '#263238', accent: '#90a4ae' },
  'slate-light': { heroBg: '#eceff1', accent: '#455a64' },
  blossom: { heroBg: '#880e4f', accent: '#f48fb1' },
  'blossom-light': { heroBg: '#fce4ec', accent: '#e91e63' },
}

const currentTheme = computed(() => themeMap[talent.value?.theme || 'earth'] || themeMap.earth)
const themeAccent = computed(() => currentTheme.value.accent)
const isLightTheme = computed(() => (talent.value?.theme || '').includes('-light'))
const heroTextColor = computed(() => isLightTheme.value ? '#2d2013' : '#ffffff')
const heroSubTextColor = computed(() => isLightTheme.value ? '#5d4037' : 'rgba(255,255,255,0.85)')

const heroStyle = computed(() => {
  if (talent.value?.cover_image) {
    return { backgroundImage: `url(${talent.value.cover_image})` }
  }
  return { backgroundColor: currentTheme.value.heroBg }
})

const overlayStyle = computed(() => {
  if (isLightTheme.value) {
    return { background: 'rgba(255,255,255,0.3)' }
  }
  return { background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.2) 100%)' }
})

// Gallery preview — first 6 items
const previewItems = computed(() => (talent.value?.portfolio || []).slice(0, 6))

// WhatsApp URL from social links or whatsapp field
const whatsappUrl = computed(() => {
  if (!talent.value) return ''
  const wa = talent.value.whatsapp || talent.value.social_links?.whatsapp
  if (!wa) return ''
  // If it's already a URL, use it; otherwise build wa.me link
  if (wa.startsWith('http')) return wa
  const num = wa.replace(/\D/g, '')
  return `https://wa.me/${num}`
})

const storefrontUrl = computed(() => talent.value ? `https://broodz.co.za/${talent.value.slug}` : '')
const whatsappShareUrl = computed(() => {
  if (!talent.value) return ''
  const text = encodeURIComponent(`Check out ${talent.value.name} on Broodz: ${storefrontUrl.value}`)
  return `https://wa.me/?text=${text}`
})

function handleProductEnquiry(product: Product) {
  enquiryPreMessage.value = `Hi! I'm interested in "${product.name}"${product.price != null ? ` (R${Number(product.price).toFixed(0)})` : ''}. `
  // Scroll to enquiry form
  document.querySelector('.enquiry-section')?.scrollIntoView({ behavior: 'smooth' })
}

async function copyLink() {
  await copyToClipboard(storefrontUrl.value)
  Notify.create({ type: 'positive', message: 'Link copied!' })
}

function callPhone() {
  if (talent.value?.phone) window.open(`tel:${talent.value.phone}`)
}

function sendEmail() {
  if (talent.value?.email) window.open(`mailto:${talent.value.email}`)
}

// JSON-LD + full SEO meta
useMeta(() => {
  if (!talent.value) return { title: 'Broodz' }
  const t = talent.value
  const url = `https://broodz.co.za/${t.slug}`
  const desc = t.tagline || `${t.name} on Broodz`

  return {
    title: `${t.name} — Broodz`,
    meta: {
      description: { name: 'description', content: desc },
      ogTitle: { name: 'og:title', content: `${t.name} — Broodz` },
      ogDescription: { name: 'og:description', content: desc },
      ogImage: { name: 'og:image', content: t.profile_image || '' },
      ogUrl: { name: 'og:url', content: url },
      ogType: { name: 'og:type', content: 'profile' },
      ogSiteName: { name: 'og:site_name', content: 'Broodz' },
      twitterCard: { name: 'twitter:card', content: 'summary_large_image' },
      twitterTitle: { name: 'twitter:title', content: `${t.name} — Broodz` },
      twitterDescription: { name: 'twitter:description', content: desc },
      twitterImage: { name: 'twitter:image', content: t.profile_image || '' },
    },
    link: {
      canonical: { rel: 'canonical', href: url },
    },
    script: {
      ldJson: {
        type: 'application/ld+json',
        innerHTML: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'ProfessionalService',
          name: t.name,
          url,
          description: desc,
          image: t.profile_image || undefined,
          address: t.location ? {
            '@type': 'PostalAddress',
            addressLocality: t.location,
            addressCountry: 'ZA',
          } : undefined,
          ...(t.category_name ? { serviceType: t.category_name } : {}),
          ...(t.services?.length ? {
            hasOfferCatalog: {
              '@type': 'OfferCatalog',
              name: 'Services',
              itemListElement: t.services.map(s => ({
                '@type': 'Offer',
                itemOffered: {
                  '@type': 'Service',
                  name: s.name,
                  description: s.description || undefined,
                },
                ...(s.price != null ? {
                  price: s.price,
                  priceCurrency: 'ZAR',
                } : {}),
              })),
            },
          } : {}),
        }),
      },
    },
  }
})

async function loadTalent() {
  const slug = props.slug || (route.params.slug as string)
  try {
    talent.value = await talentStore.fetchBySlug(slug)
  } catch {
    talent.value = null
  } finally {
    loading.value = false
  }
}

// SSR prefetch
onServerPrefetch(async () => { await loadTalent() })

// Client-side fetch (hydration or navigation)
onMounted(async () => {
  if (!talent.value) await loadTalent()
})
</script>

<style lang="scss" scoped>
.profile-hero {
  min-height: 280px;
  background-size: cover;
  background-position: center;
  background-color: #3e2723;
}

.hero-overlay {
  min-height: 280px;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0.2) 100%);
  display: flex;
  align-items: flex-end;
}
</style>
