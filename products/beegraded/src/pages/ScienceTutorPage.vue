<template>
  <q-page class="honeycomb-bg">
    <div class="page-container" style="max-width: 620px;">
      <q-btn flat dense no-caps icon="arrow_back" label="Back" color="amber-8" class="q-mb-md" to="/workspace/account" />

      <div class="text-center q-mb-md">
        <q-icon name="science" size="48px" color="amber" />
        <h2 class="text-h5 text-weight-bold q-mb-none" style="color: #78350f;">
          {{ subjectLabel }} — {{ lang === 'af' ? `Graad ${grade}` : `Grade ${grade}` }}
        </h2>
        <div class="text-caption text-grey-6">{{ strandLabel }}</div>
      </div>

      <!-- Setup (before lesson starts) -->
      <template v-if="!loading && !error && concepts.length === 0">
        <q-card flat class="bee-card q-pa-lg q-mb-md">
          <div class="text-subtitle2 text-weight-bold q-mb-md" style="color: #78350f;">
            {{ lang === 'af' ? "Kies 'n Onderwerp" : 'Choose a Topic' }}
          </div>

          <q-list>
            <q-item
              v-for="s in strands"
              :key="s.value"
              clickable
              :active="selectedStrand === s.value"
              active-color="amber-8"
              @click="selectedStrand = s.value"
              class="rounded-borders q-mb-xs"
              style="border: 1px solid #f0ebe0; border-radius: 8px;"
            >
              <q-item-section avatar>
                <q-icon :name="s.icon" :color="selectedStrand === s.value ? 'amber-8' : 'grey-5'" />
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-weight-medium">{{ lang === 'af' ? s.labelAf : s.labelEn }}</q-item-label>
                <q-item-label caption>{{ lang === 'af' ? s.descAf : s.descEn }}</q-item-label>
              </q-item-section>
              <q-item-section side v-if="selectedStrand === s.value">
                <q-icon name="check_circle" color="amber-8" />
              </q-item-section>
            </q-item>
          </q-list>
        </q-card>

        <q-btn class="btn-bee full-width" size="lg" no-caps icon="play_arrow"
          :label="lang === 'af' ? 'Begin Les' : 'Start Lesson'"
          @click="generateLesson" />
      </template>

      <!-- Loading -->
      <div v-if="loading" class="text-center q-pa-xl">
        <q-spinner-gears color="amber" size="48px" />
        <div class="q-mt-md text-grey-6">{{ lang === 'af' ? 'Genereer les...' : 'Generating lesson...' }}</div>
        <div class="text-caption text-grey-4 q-mt-xs">{{ lang === 'af' ? 'Dit kan 30 sekondes neem' : 'This may take up to 30 seconds' }}</div>
      </div>

      <!-- Error -->
      <q-banner v-if="error" class="bg-red-1 text-red-8 q-mb-md" rounded>
        <template #avatar><q-icon name="error" color="red" /></template>
        {{ error }}
        <template #action>
          <q-btn flat label="Try Again" color="red" @click="generateLesson" />
        </template>
      </q-banner>

      <!-- Phase 1: Flashcards -->
      <template v-if="!loading && !error && concepts.length > 0 && phase === 'learn'">
        <div class="text-center q-mb-sm">
          <q-badge color="amber" class="q-pa-xs">
            {{ currentIndex + 1 }} / {{ concepts.length }}
          </q-badge>
          <q-badge :color="categoryColor(currentConcept.category)" class="q-pa-xs q-ml-sm">
            {{ categoryLabel(currentConcept.category) }}
          </q-badge>
        </div>

        <q-card
          flat
          class="bee-card q-pa-xl q-mb-md text-center cursor-pointer"
          style="min-height: 260px; display: flex; flex-direction: column; justify-content: center;"
          @click="flipped = !flipped"
        >
          <template v-if="!flipped">
            <div class="text-h3 text-weight-bold" style="color: #78350f;">
              {{ lang === 'af' ? currentConcept.term_af : currentConcept.term_en }}
            </div>
            <div class="text-h6 text-grey-5 q-mt-xs" v-if="lang !== 'af'">
              {{ currentConcept.term_af }}
            </div>
            <div class="text-h6 text-grey-5 q-mt-xs" v-else>
              {{ currentConcept.term_en }}
            </div>
            <div class="text-caption text-grey-4 q-mt-md">{{ lang === 'af' ? 'Tik om definisie te wys' : 'tap to reveal definition' }}</div>
          </template>
          <template v-else>
            <div class="text-h6 text-weight-bold text-amber-8 q-mb-md">
              {{ lang === 'af' ? currentConcept.term_af : currentConcept.term_en }}
            </div>
            <div class="q-pa-sm q-mb-sm" style="background: #fef9ee; border-radius: 8px; text-align: left;">
              <div style="font-size: 15px; color: #333; line-height: 1.5;">
                {{ lang === 'af' ? currentConcept.definition_af : currentConcept.definition_en }}
              </div>
              <div class="text-caption text-grey-5 q-mt-xs">
                {{ lang === 'af' ? currentConcept.definition_en : currentConcept.definition_af }}
              </div>
            </div>
            <div class="q-pa-sm" style="background: #f0fdf4; border-radius: 8px; text-align: left;">
              <q-icon name="lightbulb" color="green-7" size="16px" class="q-mr-xs" />
              <span style="font-size: 13px; color: #444;">
                {{ lang === 'af' ? currentConcept.example_af : currentConcept.example_en }}
              </span>
            </div>
          </template>
        </q-card>

        <div class="row q-gutter-sm justify-center">
          <q-btn outline color="grey" icon="arrow_back" :disable="currentIndex === 0" @click="prevCard" no-caps :label="lang === 'af' ? 'Vorige' : 'Previous'" />
          <q-btn v-if="currentIndex < concepts.length - 1" class="btn-bee" icon-right="arrow_forward" @click="nextCard" no-caps :label="lang === 'af' ? 'Volgende' : 'Next'" />
          <q-btn v-else class="btn-bee" icon="quiz" @click="startQuiz" no-caps :label="lang === 'af' ? 'Neem Toets' : 'Take Quiz'" />
        </div>

        <div class="text-center q-mt-md">
          <span v-for="(_, i) in concepts" :key="i" class="q-mx-xs" :style="{
            display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%',
            background: i === currentIndex ? '#f59e0b' : i < currentIndex ? '#16a34a' : '#d1d5db',
          }" />
        </div>
      </template>

      <!-- Phase 2: Quiz -->
      <template v-if="phase === 'quiz'">
        <div class="text-center q-mb-md">
          <q-badge color="green">{{ lang === 'af' ? 'Vraag' : 'Question' }} {{ quizIndex + 1 }} / {{ concepts.length }}</q-badge>
        </div>

        <q-card flat class="bee-card q-pa-lg q-mb-md">
          <div class="text-center q-mb-lg">
            <div class="text-caption text-grey-5 q-mb-sm">{{ lang === 'af' ? 'Watter konsep beskryf dit?' : 'Which concept is being described?' }}</div>
            <div class="q-pa-md" style="background: #fef9ee; border-radius: 8px;">
              <div class="text-body1" style="color: #333; line-height: 1.5;">
                {{ lang === 'af' ? quizConcept.definition_af : quizConcept.definition_en }}
              </div>
            </div>
          </div>

          <div class="column q-gutter-sm">
            <q-btn
              v-for="(opt, i) in quizOptions"
              :key="i"
              no-caps
              :outline="quizAnswer !== i"
              :color="quizAnswered ? (opt.value === quizConcept.term_en ? 'positive' : quizAnswer === i ? 'negative' : 'grey') : 'amber-8'"
              class="full-width"
              style="font-size: 15px; padding: 12px;"
              :disable="quizAnswered"
              @click="answerQuiz(i, opt.value)"
            >
              {{ lang === 'af' ? opt.af : opt.en }}
            </q-btn>
          </div>

          <div v-if="quizAnswered" class="text-center q-mt-md">
            <div v-if="quizCorrect" class="text-positive text-weight-bold">
              <q-icon name="check_circle" /> {{ lang === 'af' ? 'Korrek!' : 'Correct!' }}
            </div>
            <div v-else class="text-negative">
              <q-icon name="cancel" /> {{ lang === 'af' ? 'Die antwoord is:' : 'The answer is:' }}
              <b>{{ lang === 'af' ? quizConcept.term_af : quizConcept.term_en }}</b>
            </div>
            <div class="text-caption text-grey-6 q-mt-xs">
              {{ lang === 'af' ? quizConcept.definition_af : quizConcept.definition_en }}
            </div>
            <q-btn class="btn-bee q-mt-md" no-caps
              :label="quizIndex < concepts.length - 1 ? (lang === 'af' ? 'Volgende' : 'Next') : (lang === 'af' ? 'Sien Resultate' : 'See Results')"
              @click="nextQuizQuestion" />
          </div>
        </q-card>
      </template>

      <!-- Phase 3: Results -->
      <template v-if="phase === 'results'">
        <q-card flat class="bee-card q-pa-xl q-mb-md text-center">
          <q-icon :name="quizScore >= 8 ? 'emoji_events' : quizScore >= 6 ? 'thumb_up' : 'fitness_center'"
            size="64px" :color="quizScore >= 8 ? 'amber' : quizScore >= 6 ? 'green' : 'grey'" />
          <div class="text-h4 text-weight-bold q-mt-md" style="color: #78350f;">
            {{ quizScore }} / {{ concepts.length }}
          </div>
          <div class="text-subtitle1 text-grey-7 q-mt-sm">
            {{ quizScore >= 9 ? (lang === 'af' ? 'Uitstekend! Jy ken hierdie konsepte!' : 'Excellent! You know these concepts!')
              : quizScore >= 6 ? (lang === 'af' ? 'Goeie poging! Hou aan oefen.' : 'Good effort! Keep practising.')
              : (lang === 'af' ? 'Hersien die kaarte en probeer weer.' : 'Review the cards and try again.') }}
          </div>
        </q-card>

        <div class="row q-gutter-sm justify-center">
          <q-btn outline color="amber-8" icon="replay" :label="lang === 'af' ? 'Studeer Weer' : 'Study Again'" no-caps @click="resetLearn" />
          <q-btn class="btn-bee" icon="refresh" :label="lang === 'af' ? 'Nuwe Les' : 'New Lesson'" no-caps @click="resetAll" />
        </div>

        <!-- Concept review -->
        <q-card flat class="bee-card q-pa-md q-mt-md">
          <div class="text-weight-bold q-mb-sm">{{ lang === 'af' ? 'Konsepte uit hierdie les:' : 'Concepts from this lesson:' }}</div>
          <q-list dense separator>
            <q-item v-for="c in concepts" :key="c.term_en">
              <q-item-section avatar>
                <q-icon :name="categoryIcon(c.category)" :color="categoryColor(c.category)" size="20px" />
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-weight-bold">{{ lang === 'af' ? c.term_af : c.term_en }}</q-item-label>
                <q-item-label caption>{{ lang === 'af' ? c.definition_af : c.definition_en }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card>
      </template>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { backendApi } from 'src/boot/axios'
import { useI18n } from 'src/i18n'

const route = useRoute()
const { lang } = useI18n()

const grade = computed(() => Number(route.params.grade) || 7)
const subjectCode = computed(() => (route.params.subject as string) || 'natural_science')

const subjectLabel = computed(() => {
  const labels: Record<string, { en: string; af: string }> = {
    natural_science: { en: 'Natural Sciences', af: 'Natuurwetenskap' },
    life_skills:     { en: 'Life Skills', af: 'Lewensvaardighede' },
    mathematics:     { en: 'Mathematics', af: 'Wiskunde' },
    life_orientation:{ en: 'Life Orientation', af: 'Lewensoriëntering' },
    social_sciences: { en: 'Social Sciences', af: 'Sosiale Wetenskappe' },
    ems:             { en: 'EMS', af: 'EBW' },
    technology:      { en: 'Technology', af: 'Tegnologie' },
  }
  const l = labels[subjectCode.value]
  return l ? (lang.value === 'af' ? l.af : l.en) : subjectCode.value
})

const naturalScienceStrands = [
  { value: 'all', icon: 'apps', labelEn: 'All Strands', labelAf: 'Alle Onderwerpe', descEn: 'Mix of all four CAPS strands', descAf: 'Mengsel van al vier CAPS-onderwerpe' },
  { value: 'life_and_living', icon: 'eco', labelEn: 'Life and Living', labelAf: 'Lewe en Lewende Dinge', descEn: 'Cells, photosynthesis, ecosystems, reproduction', descAf: 'Selle, fotosintese, ekostelsels, voortplanting' },
  { value: 'matter_and_materials', icon: 'science', labelEn: 'Matter and Materials', labelAf: 'Materie en Materiale', descEn: 'Atoms, mixtures, elements, chemical changes', descAf: 'Atome, mengsels, elemente, chemiese veranderinge' },
  { value: 'energy_and_change', icon: 'bolt', labelEn: 'Energy and Change', labelAf: 'Energie en Verandering', descEn: 'Electricity, circuits, heat transfer, magnetism', descAf: 'Elektrisiteit, stroombane, hitte-oordrag, magnetisme' },
  { value: 'earth_and_beyond', icon: 'public', labelEn: 'Earth and Beyond', labelAf: 'Die Aarde en Verder', descEn: 'Rocks, plate tectonics, solar system', descAf: 'Rotse, plaattektoniek, sonnestelsel' },
]

const lifeSkillsStrands = [
  { value: 'all', icon: 'apps', labelEn: 'All Topics', labelAf: 'Alle Onderwerpe', descEn: 'Mix of all Beginning Knowledge topics', descAf: 'Mengsel van alle Beginkennis-onderwerpe' },
  { value: 'animals', icon: 'pets', labelEn: 'Animals', labelAf: 'Diere', descEn: 'Farm animals, wild animals, habitats', descAf: 'Plaasiere, wilde diere, habitatte' },
  { value: 'plants', icon: 'local_florist', labelEn: 'Plants', labelAf: 'Plante', descEn: 'Parts of a plant, what plants need', descAf: 'Plantdele, wat plante nodig het' },
  { value: 'weather', icon: 'wb_sunny', labelEn: 'Weather & Seasons', labelAf: 'Weer en Seisoene', descEn: 'Rain, sun, wind, seasons', descAf: 'Reën, son, wind, seisoene' },
  { value: 'body_and_health', icon: 'favorite', labelEn: 'My Body & Health', labelAf: 'My Liggaam en Gesondheid', descEn: 'Body parts, healthy food, hygiene', descAf: 'Liggaamsdele, gesonde kos, higiëne' },
  { value: 'safety', icon: 'shield', labelEn: 'Safety', labelAf: 'Veiligheid', descEn: 'Road safety, stranger danger, emergency numbers', descAf: 'Padveiligheid, vreemdelinge, noodgetalle' },
]

const mathematicsStrands = [
  { value: 'all', icon: 'apps', labelEn: 'All Topics', labelAf: 'Alle Onderwerpe', descEn: 'Mix of numbers, algebra, geometry and data', descAf: 'Mengsel van getalle, algebra, meetkunde en data' },
  { value: 'numbers', icon: 'tag', labelEn: 'Numbers & Calculations', labelAf: 'Getalle & Berekeninge', descEn: 'Integers, fractions, exponents, surds', descAf: 'Heelgetalle, breuke, eksponente, grondwortels' },
  { value: 'algebra', icon: 'functions', labelEn: 'Algebra & Equations', labelAf: 'Algebra & Vergelykings', descEn: 'Expressions, equations, factorising', descAf: 'Uitdrukkings, vergelykings, faktorisering' },
  { value: 'geometry', icon: 'change_history', labelEn: 'Geometry & Measurement', labelAf: 'Meetkunde & Meting', descEn: 'Angles, triangles, Pythagoras, area, volume', descAf: 'Hoeke, driehoeke, Pythagoras, oppervlakte, volume' },
  { value: 'data', icon: 'bar_chart', labelEn: 'Data Handling', labelAf: 'Datahantering', descEn: 'Mean, median, mode, graphs, probability', descAf: 'Gemiddelde, mediaan, modus, grafieke, kansberekening' },
]

const lifeOrientationStrands = [
  { value: 'all', icon: 'apps', labelEn: 'All Topics', labelAf: 'Alle Onderwerpe', descEn: 'Mix of all LO topics', descAf: 'Mengsel van alle LO-onderwerpe' },
  { value: 'personal', icon: 'person', labelEn: 'Personal Development', labelAf: 'Persoonlike Ontwikkeling', descEn: 'Self-concept, peer pressure, decision-making', descAf: 'Selfkonsep, portuurdruk, besluitneming' },
  { value: 'social', icon: 'groups', labelEn: 'Social & Environment', labelAf: 'Sosiaal & Omgewing', descEn: 'Substance abuse, GBV, environment, HIV/AIDS', descAf: 'Dwelmmiddels, GBG, omgewing, MIV/VIGS' },
  { value: 'rights', icon: 'gavel', labelEn: 'Democracy & Human Rights', labelAf: 'Demokrasie & Menseregte', descEn: 'SA Constitution, Bill of Rights, citizenship', descAf: 'SA Grondwet, Handves, burgerskap' },
  { value: 'career', icon: 'work', labelEn: 'Career & Work', labelAf: 'Loopbaan & Werk', descEn: 'Career planning, further education, world of work', descAf: 'Loopbaanbeplanning, verdere studie, werkswêreld' },
  { value: 'physical', icon: 'sports', labelEn: 'Physical Education', labelAf: 'Liggaamlike Opvoeding', descEn: 'Fitness, sport rules, safety, first aid', descAf: 'Fiksheid, sportsreëls, veiligheid, noodhulp' },
]

const socialSciencesStrands = [
  { value: 'history', icon: 'history_edu', labelEn: 'History', labelAf: 'Geskiedenis', descEn: 'SA and world history — CAPS Grade content', descAf: 'SA en wêreldgeskiedenis — CAPS graadinhoud' },
  { value: 'geography', icon: 'map', labelEn: 'Geography', labelAf: 'Aardrykskunde', descEn: 'Map work, climate, resources, development', descAf: 'Kaartwerk, klimaat, hulpbronne, ontwikkeling' },
]

const emsStrands = [
  { value: 'all', icon: 'apps', labelEn: 'All Topics', labelAf: 'Alle Onderwerpe', descEn: 'Mix of all EMS topics', descAf: 'Mengsel van alle EBW-onderwerpe' },
  { value: 'economy', icon: 'trending_up', labelEn: 'The Economy', labelAf: 'Die Ekonomie', descEn: 'Economic systems, sectors, circular flow', descAf: 'Ekonomiese stelsels, sektore, kringloop' },
  { value: 'financial_literacy', icon: 'account_balance_wallet', labelEn: 'Financial Literacy', labelAf: 'Finansiële Geletterdheid', descEn: 'Budgets, banking, interest, financial documents', descAf: 'Begrotings, bankwese, rente, finansiële dokumente' },
  { value: 'entrepreneur', icon: 'rocket_launch', labelEn: 'Entrepreneurship', labelAf: 'Entrepreneurskap', descEn: 'Business plans, SWOT analysis, forms of ownership', descAf: 'Besigheidsplan, SWOT-analise, eienaarskapsvorms' },
  { value: 'business', icon: 'storefront', labelEn: 'Business Environment', labelAf: 'Besigheidsomgewing', descEn: 'Consumer rights, supply and demand, advertising', descAf: 'Verbruikersregte, vraag en aanbod, reklame' },
]

const technologyStrands = [
  { value: 'all', icon: 'apps', labelEn: 'All Topics', labelAf: 'Alle Onderwerpe', descEn: 'Mix of all Technology topics', descAf: 'Mengsel van alle Tegnologie-onderwerpe' },
  { value: 'design', icon: 'architecture', labelEn: 'Design Process', labelAf: 'Ontwerpproses', descEn: 'Investigate, design, make, evaluate, communicate', descAf: 'Ondersoek, ontwerp, maak, evalueer, kommunikeer' },
  { value: 'structures', icon: 'domain', labelEn: 'Structures', labelAf: 'Strukture', descEn: 'Forces, strength, stability, materials', descAf: 'Kragte, sterkte, stabiliteit, materiale' },
  { value: 'mechanical', icon: 'settings', labelEn: 'Mechanical Systems', labelAf: 'Meganiese Stelsels', descEn: 'Levers, gears, pulleys, linkages', descAf: 'Hefbome, ratels, katrolle, koppelinge' },
  { value: 'electrical', icon: 'electric_bolt', labelEn: 'Electrical Systems', labelAf: 'Elektriese Stelsels', descEn: 'Circuits, components, electronics', descAf: 'Stroombane, komponente, elektronika' },
  { value: 'processing', icon: 'factory', labelEn: 'Processing', labelAf: 'Prosessering', descEn: 'Food and material processing, manufacturing', descAf: 'Voedsel- en materiaalverwerking, vervaardiging' },
]

const strands = computed(() => {
  switch (subjectCode.value) {
    case 'life_skills': return lifeSkillsStrands
    case 'mathematics': return mathematicsStrands
    case 'life_orientation': return lifeOrientationStrands
    case 'social_sciences': return socialSciencesStrands
    case 'ems': return emsStrands
    case 'technology': return technologyStrands
    default: return naturalScienceStrands
  }
})

const selectedStrand = ref('all')
const strandLabel = computed(() => {
  const s = strands.value.find((x: any) => x.value === selectedStrand.value)
  return s ? (lang.value === 'af' ? s.labelAf : s.labelEn) : ''
})

const loading = ref(false)
const error = ref('')
const concepts = ref<any[]>([])
const phase = ref<'learn' | 'quiz' | 'results'>('learn')

const currentIndex = ref(0)
const flipped = ref(false)
const currentConcept = computed(() => concepts.value[currentIndex.value] || {})

const quizIndex = ref(0)
const quizAnswer = ref(-1)
const quizAnswered = ref(false)
const quizCorrect = ref(false)
const quizScore = ref(0)
const quizConcept = computed(() => concepts.value[quizIndex.value] || {})

const quizOptions = computed(() => {
  if (!quizConcept.value.term_en) return []
  const correct = { value: quizConcept.value.term_en, en: quizConcept.value.term_en, af: quizConcept.value.term_af }
  const others = concepts.value
    .filter(c => c.term_en !== quizConcept.value.term_en)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
    .map(c => ({ value: c.term_en, en: c.term_en, af: c.term_af }))
  return [correct, ...others].sort(() => Math.random() - 0.5)
})

function categoryColor(cat: string): string {
  const colors: Record<string, string> = {
    life_and_living: 'green', matter_and_materials: 'blue',
    energy_and_change: 'orange', earth_and_beyond: 'brown',
    animals: 'green', plants: 'teal', weather: 'cyan',
    body_and_health: 'red', safety: 'purple',
    numbers: 'indigo', algebra: 'deep-purple', geometry: 'cyan',
    functions: 'blue', data: 'teal', financial: 'green',
    personal: 'pink', social: 'orange', rights: 'amber',
    career: 'blue', physical: 'green',
    history: 'brown', geography: 'teal',
    economy: 'blue', financial_literacy: 'green',
    entrepreneur: 'orange', business: 'purple',
    design: 'amber', structures: 'brown', mechanical: 'grey',
    electrical: 'yellow', processing: 'cyan',
  }
  return colors[cat] || 'grey'
}

function categoryIcon(cat: string): string {
  const icons: Record<string, string> = {
    life_and_living: 'eco', matter_and_materials: 'science',
    energy_and_change: 'bolt', earth_and_beyond: 'public',
    animals: 'pets', plants: 'local_florist', weather: 'wb_sunny',
    body_and_health: 'favorite', safety: 'shield',
    numbers: 'tag', algebra: 'functions', geometry: 'change_history',
    functions: 'show_chart', data: 'bar_chart', financial: 'savings',
    personal: 'person', social: 'groups', rights: 'gavel',
    career: 'work', physical: 'sports',
    history: 'history_edu', geography: 'map',
    economy: 'trending_up', financial_literacy: 'account_balance_wallet',
    entrepreneur: 'rocket_launch', business: 'storefront',
    design: 'architecture', structures: 'domain', mechanical: 'settings',
    electrical: 'electric_bolt', processing: 'factory',
  }
  return icons[cat] || 'circle'
}

function categoryLabel(cat: string): string {
  const labels: Record<string, { en: string; af: string }> = {
    life_and_living: { en: 'Life & Living', af: 'Lewe & Lewende' },
    matter_and_materials: { en: 'Matter & Materials', af: 'Materie & Materiale' },
    energy_and_change: { en: 'Energy & Change', af: 'Energie & Verandering' },
    earth_and_beyond: { en: 'Earth & Beyond', af: 'Aarde & Verder' },
    numbers: { en: 'Numbers', af: 'Getalle' },
    algebra: { en: 'Algebra', af: 'Algebra' },
    geometry: { en: 'Geometry', af: 'Meetkunde' },
    functions: { en: 'Functions', af: 'Funksies' },
    data: { en: 'Data Handling', af: 'Datahantering' },
    financial: { en: 'Financial Maths', af: 'Finansiële Wiskunde' },
    personal: { en: 'Personal Development', af: 'Persoonlike Ontwikkeling' },
    social: { en: 'Social & Environment', af: 'Sosiaal & Omgewing' },
    rights: { en: 'Human Rights', af: 'Menseregte' },
    career: { en: 'Career & Work', af: 'Loopbaan & Werk' },
    physical: { en: 'Physical Education', af: 'Liggaamlike Opvoeding' },
    history: { en: 'History', af: 'Geskiedenis' },
    geography: { en: 'Geography', af: 'Aardrykskunde' },
    economy: { en: 'The Economy', af: 'Die Ekonomie' },
    financial_literacy: { en: 'Financial Literacy', af: 'Finansiële Geletterdheid' },
    entrepreneur: { en: 'Entrepreneurship', af: 'Entrepreneurskap' },
    business: { en: 'Business', af: 'Besigheid' },
    design: { en: 'Design Process', af: 'Ontwerpproses' },
    structures: { en: 'Structures', af: 'Strukture' },
    mechanical: { en: 'Mechanical Systems', af: 'Meganiese Stelsels' },
    electrical: { en: 'Electrical Systems', af: 'Elektriese Stelsels' },
    processing: { en: 'Processing', af: 'Prosessering' },
  }
  const l = labels[cat]
  return l ? (lang.value === 'af' ? l.af : l.en) : cat
}

async function generateLesson() {
  loading.value = true
  error.value = ''
  concepts.value = []
  phase.value = 'learn'
  currentIndex.value = 0
  flipped.value = false
  quizScore.value = 0
  quizIndex.value = 0

  try {
    const { data } = await backendApi.post('/subject-tests/tutor', {
      subject_code: subjectCode.value,
      grade: grade.value,
      strand: selectedStrand.value === 'all' ? undefined : selectedStrand.value,
    })
    concepts.value = data.concepts
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to generate lesson'
  } finally {
    loading.value = false
  }
}

function nextCard() {
  if (currentIndex.value < concepts.value.length - 1) {
    currentIndex.value++
    flipped.value = false
  }
}
function prevCard() {
  if (currentIndex.value > 0) {
    currentIndex.value--
    flipped.value = false
  }
}
function startQuiz() {
  phase.value = 'quiz'
  quizIndex.value = 0
  quizScore.value = 0
  quizAnswer.value = -1
  quizAnswered.value = false
}
function answerQuiz(optIndex: number, value: string) {
  quizAnswer.value = optIndex
  quizAnswered.value = true
  quizCorrect.value = value === quizConcept.value.term_en
  if (quizCorrect.value) quizScore.value++
}
function nextQuizQuestion() {
  if (quizIndex.value < concepts.value.length - 1) {
    quizIndex.value++
    quizAnswer.value = -1
    quizAnswered.value = false
    quizCorrect.value = false
  } else {
    phase.value = 'results'
  }
}
function resetLearn() {
  phase.value = 'learn'
  currentIndex.value = 0
  flipped.value = false
}
function resetAll() {
  concepts.value = []
  phase.value = 'learn'
}

onMounted(() => {
  selectedStrand.value = subjectCode.value === 'social_sciences' ? 'history' : 'all'
})
</script>
