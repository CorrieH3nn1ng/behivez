<template>
  <q-page class="honeycomb-bg">
    <div class="page-container" style="max-width: 600px;">
      <h1 class="text-h5 text-weight-bold q-mb-xs" style="color: #78350f;">
        {{ lang === 'af' ? 'Proefsitting' : 'Mock Assessment' }}
      </h1>
      <p class="text-grey-7 q-mb-lg">
        {{ lang === 'af'
          ? 'Kies jou vak en graad — ons genereer \'n toets vir jou. Kies onderwerpe om te fokus, of los leeg vir \'n volledige toets.'
          : 'Choose your subject and grade — we\'ll generate a test for you. Pick topics to focus on, or leave empty for a full-syllabus test.' }}
      </p>

      <q-card flat class="bee-card q-pa-lg">
        <!-- Subject -->
        <div class="text-caption text-weight-bold text-grey-7 q-mb-xs">
          {{ lang === 'af' ? 'VAK' : 'SUBJECT' }}
        </div>
        <q-select
          v-model="selectedSubject"
          :options="subjectOptions"
          :label="lang === 'af' ? 'Kies vak...' : 'Choose subject...'"
          outlined dense emit-value map-options
          class="q-mb-md"
          @update:model-value="onSubjectChange"
        />

        <!-- Grade + Language row -->
        <div class="row q-col-gutter-md q-mb-lg">
          <div class="col-6">
            <div class="text-caption text-weight-bold text-grey-7 q-mb-xs">
              {{ lang === 'af' ? 'GRAAD' : 'GRADE' }}
            </div>
            <q-select
              v-model="grade"
              :options="availableGrades"
              outlined dense
            />
          </div>
          <div class="col-6">
            <div class="text-caption text-weight-bold text-grey-7 q-mb-xs">
              {{ lang === 'af' ? 'VRAAGTAAL' : 'QUESTION LANGUAGE' }}
            </div>
            <q-select
              v-model="language"
              :options="languageOptions"
              outlined dense emit-value map-options
            />
          </div>
        </div>

        <!-- Topics section -->
        <div class="q-mb-md">
          <div class="row items-center justify-between q-mb-xs">
            <div class="text-caption text-weight-bold text-grey-7">
              {{ lang === 'af' ? 'FOKUS OP ONDERWERPE (opsioneel)' : 'FOCUS TOPICS (optional)' }}
            </div>
            <q-btn v-if="scope.length > 0" flat dense no-caps size="sm" color="grey-6"
              :label="lang === 'af' ? 'Maak skoon' : 'Clear all'"
              @click="scope = []" />
          </div>
          <div class="text-caption text-grey-5 q-mb-sm">
            {{ lang === 'af'
              ? 'Tik op \'n onderwerp om dit by te voeg, of los leeg vir \'n volledige sillabus-toets'
              : 'Tap a topic to add it, or leave empty for a full-syllabus test' }}
          </div>

          <!-- Suggested topic chips -->
          <div v-if="suggestedTopics.length > 0" class="q-mb-sm" style="flex-wrap: wrap; display: flex; gap: 6px;">
            <q-chip
              v-for="t in suggestedTopics"
              :key="t"
              clickable
              :color="scope.includes(t) ? 'amber-8' : 'grey-2'"
              :text-color="scope.includes(t) ? 'white' : 'grey-8'"
              :outline="!scope.includes(t)"
              dense
              @click="toggleTopic(t)"
            >
              <q-icon v-if="scope.includes(t)" name="check" size="12px" class="q-mr-xs" />
              {{ t }}
            </q-chip>
          </div>

          <!-- Custom topic input -->
          <q-input
            v-model="customTopic"
            outlined dense
            :placeholder="lang === 'af' ? 'Voeg eie onderwerp by (druk Enter)...' : 'Add custom topic (press Enter)...'"
            @keyup.enter="addCustomTopic"
          >
            <template #append>
              <q-btn flat dense round icon="add" color="amber-8" :disable="!customTopic.trim()" @click="addCustomTopic" />
            </template>
          </q-input>

          <!-- Custom topics added -->
          <div v-if="customTopics.length > 0" class="q-mt-sm" style="flex-wrap: wrap; display: flex; gap: 6px;">
            <q-chip
              v-for="t in customTopics"
              :key="t"
              removable
              color="amber-2"
              text-color="amber-9"
              dense
              @remove="removeCustomTopic(t)"
            >
              {{ t }}
            </q-chip>
          </div>
        </div>

        <!-- Preview banner -->
        <q-banner v-if="scope.length > 0" class="bg-amber-1 text-amber-9 q-mb-md" rounded dense>
          <template #avatar><q-icon name="quiz" color="amber-8" /></template>
          <span v-if="lang === 'af'">
            Genereer <strong>{{ qCount }} vrae</strong> oor
            {{ scope.length }} onderwerp{{ scope.length > 1 ? 'e' : '' }}:
            {{ scope.join(' · ') }}
          </span>
          <span v-else>
            Generating <strong>{{ qCount }} questions</strong> across
            {{ scope.length }} topic{{ scope.length > 1 ? 's' : '' }}:
            {{ scope.join(' · ') }}
          </span>
        </q-banner>
        <q-banner v-else-if="selectedSubject" class="bg-blue-1 text-blue-9 q-mb-md" rounded dense>
          <template #avatar><q-icon name="info" color="blue-6" /></template>
          {{ lang === 'af'
            ? 'Geen onderwerpe gekies — genereer \'n volledige 30-vraag sillabus-toets'
            : 'No topics selected — will generate a full 30-question syllabus test' }}
        </q-banner>

        <!-- Error -->
        <q-banner v-if="error" class="bg-red-1 text-red-8 q-mb-md" rounded dense>
          <template #avatar><q-icon name="error" color="red" /></template>
          {{ error }}
        </q-banner>

        <q-btn
          class="btn-bee full-width"
          size="lg"
          no-caps
          icon="play_arrow"
          :label="lang === 'af' ? 'Genereer Toets' : 'Generate Test'"
          :loading="generating"
          :disable="!selectedSubject"
          @click="generate"
        />
      </q-card>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'src/i18n'
import { backendApi } from 'src/boot/axios'

const { lang } = useI18n()
const router = useRouter()

const selectedSubject = ref('')
const grade = ref(7)
const language = ref('english')
const customTopic = ref('')
const customTopics = ref<string[]>([])
const generating = ref(false)
const error = ref('')

// All topics = suggested (toggled) + custom
const selectedSuggested = ref<string[]>([])
const scope = computed(() => [...selectedSuggested.value, ...customTopics.value])

interface SubjectDef {
  label: string
  value: string
  minGrade: number
  maxGrade: number
}

const subjects: SubjectDef[] = [
  { label: 'English (Home Language)', value: 'English Home Language', minGrade: 1, maxGrade: 3 },
  { label: 'Afrikaans (Huistaal)', value: 'Afrikaans Huistaal', minGrade: 1, maxGrade: 3 },
  { label: 'Mathematics (Gr 1-3)', value: 'Mathematics', minGrade: 1, maxGrade: 3 },
  { label: 'Life Skills (Gr 1-3)', value: 'Life Skills', minGrade: 1, maxGrade: 3 },
  { label: 'English (Gr 4-9)', value: 'English', minGrade: 4, maxGrade: 9 },
  { label: 'Afrikaans (Gr 4-9)', value: 'Afrikaans', minGrade: 4, maxGrade: 9 },
  { label: 'Mathematics (Gr 4-9)', value: 'Mathematics', minGrade: 4, maxGrade: 9 },
  { label: 'Natural Science & Technology (Gr 4-6)', value: 'Natural Science and Technology', minGrade: 4, maxGrade: 6 },
  { label: 'Natural Sciences (Gr 7-9)', value: 'Natural Sciences', minGrade: 7, maxGrade: 9 },
  { label: 'Social Sciences: History (Gr 4-9)', value: 'History', minGrade: 4, maxGrade: 9 },
  { label: 'Social Sciences: Geography (Gr 4-9)', value: 'Geography', minGrade: 4, maxGrade: 9 },
  { label: 'Economic & Management Sciences (Gr 4-9)', value: 'Economic and Management Sciences', minGrade: 4, maxGrade: 9 },
  { label: 'Technology (Gr 4-9)', value: 'Technology', minGrade: 4, maxGrade: 9 },
  { label: 'Life Orientation (Gr 4-9)', value: 'Life Orientation', minGrade: 4, maxGrade: 9 },
  { label: 'Creative Arts (Gr 4-9)', value: 'Creative Arts', minGrade: 4, maxGrade: 9 },
  { label: 'English (Gr 10-12)', value: 'English First Additional Language', minGrade: 10, maxGrade: 12 },
  { label: 'Afrikaans (Gr 10-12)', value: 'Afrikaans', minGrade: 10, maxGrade: 12 },
  { label: 'Mathematics (Gr 10-12)', value: 'Mathematics', minGrade: 10, maxGrade: 12 },
  { label: 'Mathematical Literacy', value: 'Mathematical Literacy', minGrade: 10, maxGrade: 12 },
  { label: 'Life Sciences', value: 'Life Sciences', minGrade: 10, maxGrade: 12 },
  { label: 'Physical Sciences', value: 'Physical Sciences', minGrade: 10, maxGrade: 12 },
  { label: 'History (Gr 10-12)', value: 'History', minGrade: 10, maxGrade: 12 },
  { label: 'Geography (Gr 10-12)', value: 'Geography', minGrade: 10, maxGrade: 12 },
  { label: 'Consumer Studies', value: 'Consumer Studies', minGrade: 10, maxGrade: 12 },
  { label: 'Economics', value: 'Economics', minGrade: 10, maxGrade: 12 },
  { label: 'Accounting', value: 'Accounting', minGrade: 10, maxGrade: 12 },
  { label: 'Business Studies', value: 'Business Studies', minGrade: 10, maxGrade: 12 },
  { label: 'EGD', value: 'Engineering Graphics and Design', minGrade: 10, maxGrade: 12 },
  { label: 'CAT', value: 'Computer Applications Technology', minGrade: 10, maxGrade: 12 },
  { label: 'Visual Art', value: 'Visual Art', minGrade: 10, maxGrade: 12 },
]

const TOPIC_MAP: Record<string, string[]> = {
  'English Home Language':          ['Phonics', 'Sight words', 'Reading', 'Writing', 'Listening & speaking'],
  'Afrikaans Huistaal':             ['Foniek', 'Sigswoorde', 'Lees', 'Skryfwerk', 'Luister & praat'],
  'English':                        ['Reading comprehension', 'Grammar', 'Vocabulary', 'Writing skills', 'Poetry', 'Short stories', 'Visual literacy'],
  'Afrikaans':                      ['Leesbegrip', 'Grammatika', 'Woordeskat', 'Skryfwerk', 'Gedigte', 'Visuele geletterdheid'],
  'Mathematics':                    ['Numbers & operations', 'Algebra', 'Geometry', 'Fractions & decimals', 'Data handling', 'Measurement', 'Word problems'],
  'Natural Science and Technology': ['Life and Living', 'Energy and Change', 'Matter and Materials', 'Planet Earth and Beyond'],
  'Natural Sciences':               ['Life and Living', 'Matter and Materials', 'Energy and Change', 'Earth and Beyond'],
  'Life Sciences':                  ['Cells & tissues', 'Photosynthesis & respiration', 'Human biology', 'Genetics & evolution', 'Ecology'],
  'Physical Sciences':              ['Mechanics', 'Waves & electricity', 'Chemical change', 'Matter & materials', 'Organic chemistry'],
  'History':                        ['SA history', 'Colonialism', 'Apartheid', 'Democracy', 'Ancient civilisations', 'World history'],
  'Geography':                      ['Map work', 'Climate & weather', 'Resources', 'Population', 'Development', 'Urbanisation'],
  'Economic and Management Sciences': ['Financial literacy', 'Entrepreneurship', 'The economy', 'Business environment', 'Budgets & banking'],
  'Technology':                     ['Design process', 'Structures', 'Mechanical systems', 'Electrical systems', 'Processing'],
  'Life Orientation':               ['Human rights', 'Career choices', 'Relationships & peer pressure', 'Democracy & citizenship', 'Health & safety', 'Physical fitness'],
  'Life Skills':                    ['Animals', 'Plants', 'Weather & seasons', 'My body & health', 'Safety'],
  'Creative Arts':                  ['Visual Arts', 'Music theory', 'Drama', 'Dance'],
  'Economics':                      ['Micro-economics', 'Macro-economics', 'Markets & prices', 'SA economy', 'International trade'],
  'Accounting':                     ['Financial statements', 'Debtors & creditors', 'Cash flow', 'Reconciliations', 'VAT'],
  'Business Studies':               ['Business environments', 'Business functions', 'Human resources', 'Marketing', 'Financial management'],
  'Mathematical Literacy':          ['Finance', 'Measurement', 'Maps & plans', 'Data & probability'],
  'Consumer Studies':               ['Food & nutrition', 'Housing', 'Clothing & textiles', 'Consumer rights'],
  'English First Additional Language': ['Reading comprehension', 'Grammar', 'Vocabulary', 'Writing skills', 'Literature'],
}

const suggestedTopics = computed(() => {
  if (!selectedSubject.value) return []
  return TOPIC_MAP[selectedSubject.value] || []
})

const subjectOptions = computed(() => [
  { label: '─── Foundation Phase (Gr 1-3) ───', value: '__hdr_get', disable: true },
  ...subjects.filter(s => s.maxGrade <= 3).map(s => ({ label: s.label, value: s.value })),
  { label: '─── Intermediate & Senior Phase (Gr 4-9) ───', value: '__hdr_isp', disable: true },
  ...subjects.filter(s => s.minGrade >= 4 && s.maxGrade <= 9).map(s => ({ label: s.label, value: s.value })),
  { label: '─── FET Phase (Gr 10-12) ───', value: '__hdr_fet', disable: true },
  ...subjects.filter(s => s.minGrade >= 10).map(s => ({ label: s.label, value: s.value })),
])

const currentSubjectDef = computed(() =>
  subjects.find(s => s.value === selectedSubject.value && s.minGrade <= grade.value && s.maxGrade >= grade.value)
  || subjects.find(s => s.value === selectedSubject.value)
)

const availableGrades = computed(() => {
  const def = currentSubjectDef.value
  if (!def) return Array.from({ length: 12 }, (_, i) => i + 1)
  return Array.from({ length: def.maxGrade - def.minGrade + 1 }, (_, i) => i + def.minGrade)
})

const qCount = computed(() => scope.value.length > 0 ? Math.min(Math.max(scope.value.length * 4, 12), 30) : 30)

const languageOptions = [
  { label: 'English', value: 'english' },
  { label: 'Afrikaans', value: 'afrikaans' },
]

function onSubjectChange(val: string) {
  const def = subjects.find(s => s.value === val && s.minGrade <= grade.value && s.maxGrade >= grade.value)
    || subjects.find(s => s.value === val)
  if (def && (grade.value < def.minGrade || grade.value > def.maxGrade)) {
    grade.value = def.minGrade
  }
  // Clear topic selections when subject changes
  selectedSuggested.value = []
  customTopics.value = []
}

function toggleTopic(t: string) {
  const idx = selectedSuggested.value.indexOf(t)
  if (idx === -1) selectedSuggested.value.push(t)
  else selectedSuggested.value.splice(idx, 1)
}

function addCustomTopic() {
  const t = customTopic.value.trim()
  if (t && !scope.value.includes(t)) {
    customTopics.value.push(t)
  }
  customTopic.value = ''
}

function removeCustomTopic(t: string) {
  customTopics.value = customTopics.value.filter(x => x !== t)
}

async function generate() {
  error.value = ''
  generating.value = true
  try {
    const { data } = await backendApi.post('/subject-tests/mock', {
      subject_name: selectedSubject.value,
      grade: grade.value,
      scope: scope.value.length > 0 ? scope.value : undefined,
      language: language.value,
    })
    router.push({
      name: 'math-test',
      params: { templateId: data.id },
      query: { returnTo: 'mock-result', templateId: String(data.id) },
    })
  } catch (err: any) {
    error.value = err.response?.data?.message || (lang.value === 'af' ? 'Kon nie toets genereer nie' : 'Failed to generate assessment')
  } finally {
    generating.value = false
  }
}
</script>
