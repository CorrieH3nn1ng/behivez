<template>
  <q-page class="q-pa-lg">
    <div style="max-width: 1000px; margin: 0 auto;">
      <q-btn flat no-caps icon="arrow_back" label="All Categories" to="/" class="q-mb-md" color="brown-8" />

      <h1 class="text-h4 text-weight-bold q-mb-md q-mt-none">{{ categoryName }}</h1>

      <div v-if="loading" class="flex flex-center q-pa-xl">
        <q-spinner-gears size="48px" color="brown-8" />
      </div>

      <div v-else-if="talentStore.browseTalents.length" class="row q-col-gutter-md">
        <div
          v-for="talent in talentStore.browseTalents"
          :key="talent.id"
          class="col-12 col-sm-6 col-md-4"
        >
          <talent-card :talent="talent" />
        </div>
      </div>

      <div v-else class="text-center q-pa-xl text-grey-6">
        <q-icon name="search_off" size="48px" class="q-mb-md" />
        <p class="text-h6">No talents in this category yet</p>
        <p>Be the first! <router-link to="/login" class="text-brown-8">Create your storefront</router-link></p>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useTalentStore } from 'src/stores/talent'
import TalentCard from 'src/components/TalentCard.vue'

const props = defineProps<{ slug: string }>()
const talentStore = useTalentStore()
const loading = ref(true)

const categoryName = computed(() => {
  const cat = talentStore.categories.find(c => c.slug === props.slug)
  return cat?.name || props.slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
})

async function load() {
  loading.value = true
  try {
    if (!talentStore.categories.length) {
      await talentStore.fetchCategories()
    }
    await talentStore.fetchBrowse(props.slug)
  } catch {
    // API may not be ready
  } finally {
    loading.value = false
  }
}

onMounted(load)
watch(() => props.slug, load)
</script>
