<template>
  <q-page>
    <!-- Hero -->
    <section class="hero-section q-pa-xl text-center">
      <h1 class="text-h3 text-weight-bold q-mb-sm" style="color: #fff8f0;">Your Talent. Your <span style="color: #f0a030;">Storefront.</span></h1>
      <p class="text-h6 text-weight-light q-mb-lg" style="max-width: 600px; margin: 0 auto; color: #c0b0a0;">
        Can't afford a website? Broodz gives young South African talents a professional profile page
        to showcase work, list services, and get enquiries.
      </p>
      <q-btn
        no-caps
        size="lg"
        label="Get Your Storefront"
        to="/login"
        class="btn-broodz text-weight-bold"
      />
    </section>

    <!-- Categories -->
    <section class="q-pa-lg bz-surface">
      <h2 class="text-h5 text-weight-bold text-center q-mb-md" style="color: #2d2013;">Browse by Category</h2>
      <div class="row q-col-gutter-md justify-center">
        <div v-for="cat in talentStore.categories" :key="cat.id" class="col-6 col-sm-4 col-md-2">
          <q-card
            flat bordered
            class="cursor-pointer text-center q-pa-md category-card"
            @click="$router.push({ name: 'category', params: { slug: cat.slug } })"
          >
            <q-icon :name="cat.icon" size="36px" style="color: #e85d04;" />
            <div class="text-subtitle2 q-mt-sm" style="color: #2d2013;">{{ cat.name }}</div>
          </q-card>
        </div>
      </div>
    </section>

    <!-- Featured Talents -->
    <section class="q-pa-lg" style="background: #fff;" v-if="talentStore.browseTalents.length">
      <h2 class="text-h5 text-weight-bold text-center q-mb-md" style="color: #2d2013;">Featured Talents</h2>
      <div class="row q-col-gutter-md justify-center">
        <div
          v-for="talent in talentStore.browseTalents"
          :key="talent.id"
          class="col-12 col-sm-6 col-md-4 col-lg-3"
        >
          <talent-card :talent="talent" />
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="q-pa-xl text-center" style="background: #1a1520;">
      <h3 class="text-h5 text-weight-bold q-mb-sm" style="color: #fff8f0;">Ready to showcase your talent?</h3>
      <p class="text-body1 q-mb-md" style="color: #b0a090;">
        It takes 5 minutes. No tech skills needed. Share your link on WhatsApp, Instagram, or TikTok.
      </p>
      <q-btn no-caps label="Start Free" to="/login" class="btn-broodz" />
    </section>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useTalentStore } from 'src/stores/talent'
import TalentCard from 'src/components/TalentCard.vue'

const talentStore = useTalentStore()

onMounted(async () => {
  try {
    await Promise.all([
      talentStore.fetchCategories(),
      talentStore.fetchBrowse(),
    ])
  } catch {
    // API may not be ready yet
  }
})
</script>

<style lang="scss" scoped>
.hero-section {
  background: linear-gradient(135deg, #1a1520 0%, #2a1e30 40%, #3a2520 100%);
  min-height: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: 60px;
  padding-bottom: 60px;
  gap: 8px;
}

.category-card {
  transition: transform 0.2s, box-shadow 0.2s;
  border-radius: 12px;
  border-color: #e8ddd0;
  background: #fff;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
}
</style>
