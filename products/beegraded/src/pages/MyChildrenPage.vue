<template>
  <q-page class="honeycomb-bg">
    <div class="page-container" style="max-width: 700px;">
      <!-- Language toggle -->
      <div class="row items-center q-mb-md">
        <h2 class="text-h5 text-weight-bold q-mb-none" style="color: #78350f;">
          <q-icon name="family_restroom" color="amber" class="q-mr-sm" />
          {{ lang === 'af' ? 'My Kinders' : 'My Children' }}
        </h2>
        <q-space />
        <q-btn-toggle
          v-model="parentLang"
          no-caps dense rounded
          toggle-color="amber-8"
          color="grey-3"
          text-color="grey-7"
          :options="[
            { label: 'AF', value: 'af' },
            { label: 'EN', value: 'en' },
            { label: 'TN', value: 'tn' },
          ]"
          @update:model-value="handleLangChange"
        />
      </div>

      <!-- POPIA Consent (first time only) -->
      <q-card v-if="!consentGiven && !loading" flat class="bee-card q-pa-lg q-mb-md">
        <div class="text-h6 text-weight-bold q-mb-sm" style="color: #78350f;">
          <q-icon name="shield" class="q-mr-xs" />
          {{ lang === 'af' ? 'Privaatheidstoestemming (POPIA)' : 'Privacy Consent (POPIA)' }}
        </div>
        <div class="text-body2 q-mb-md" style="line-height: 1.6;">
          <template v-if="lang === 'af'">
            <p>Om u kind se vordering te volg, versamel ons die volgende inligting:</p>
            <ul>
              <li><b>Naam</b> en <b>geboortedatum</b> — om u kind te identifiseer</li>
              <li><b>Graad</b> — om ouderdomsgeskikte vrae te genereer</li>
              <li><b>Toetsresultate</b> — om vordering te volg</li>
            </ul>
            <p>Ons versamel <b>geen</b> ID-nommers, liggingsdata, of foto's nie. Data word in Suid-Afrika gestoor en slegs aan u (die ouer) vertoon. U kan enige tyd u kind se data verwyder.</p>
          </template>
          <template v-else>
            <p>To track your child's progress, we collect the following information:</p>
            <ul>
              <li><b>Name</b> and <b>date of birth</b> — to identify your child</li>
              <li><b>Grade</b> — to generate age-appropriate questions</li>
              <li><b>Test results</b> — to track progress</li>
            </ul>
            <p>We collect <b>no</b> ID numbers, location data, or photos. Data is stored in South Africa and only shown to you (the parent). You can delete your child's data at any time.</p>
          </template>
        </div>
        <q-checkbox v-model="consentCheckbox" :label="lang === 'af' ? 'Ek stem in tot bogenoemde dataversameling vir my kind(ers)' : 'I consent to the above data collection for my child(ren)'" />
        <q-btn
          class="btn-bee full-width q-mt-md"
          no-caps
          :disable="!consentCheckbox"
          :loading="savingConsent"
          @click="handleConsent"
        >
          {{ lang === 'af' ? 'Aanvaar en Gaan Voort' : 'Accept and Continue' }}
        </q-btn>
      </q-card>

      <!-- Loading -->
      <div v-if="loading" class="text-center q-pa-xl">
        <q-spinner-gears color="amber" size="36px" />
      </div>

      <!-- Children List -->
      <template v-if="consentGiven && !loading">

        <!-- Child Cards with Stats -->
        <q-card
          v-for="child in children"
          :key="child.id"
          flat
          class="bee-card q-mb-md cursor-pointer child-card"
          @click="$router.push(`/workspace/child/${child.id}/progress`)"
        >
          <!-- Header row -->
          <div class="q-pa-md q-pb-none">
            <div class="row items-center">
              <q-icon name="child_care" color="amber-8" size="28px" class="q-mr-sm" />
              <div>
                <div class="text-weight-bold" style="font-size: 18px; color: #78350f;">{{ child.name }}</div>
                <div class="text-caption text-grey-6">
                  {{ lang === 'af' ? 'Graad' : 'Grade' }} {{ child.grade }} &bull;
                  {{ child.age }} {{ lang === 'af' ? 'jaar' : 'years' }} &bull;
                  {{ child.language === 'af' ? 'Afrikaans' : child.language === 'en' ? 'English' : 'Setswana' }}
                </div>
              </div>
              <q-space />
              <q-icon name="chevron_right" color="grey-5" size="24px" />
            </div>
          </div>

          <!-- Stats row -->
          <div class="row q-pa-md q-pt-sm text-center">
            <div class="col">
              <div class="text-h5 text-weight-bold" style="color: #78350f;">{{ child.stats?.total_tests || 0 }}</div>
              <div class="text-caption text-grey-6">{{ lang === 'af' ? 'Toetse' : 'Tests' }}</div>
            </div>
            <q-separator vertical />
            <div class="col">
              <div class="text-h5 text-weight-bold" style="color: #f59e0b;">{{ child.stats?.average_score || 0 }}%</div>
              <div class="text-caption text-grey-6">{{ lang === 'af' ? 'Gemiddeld' : 'Average' }}</div>
            </div>
            <q-separator vertical />
            <div class="col">
              <div class="text-h5 text-weight-bold" style="color: #16a34a;">{{ child.stats?.best_score || 0 }}%</div>
              <div class="text-caption text-grey-6">{{ lang === 'af' ? 'Beste' : 'Best' }}</div>
            </div>
          </div>

          <!-- Subjects chips -->
          <div class="q-px-md q-pb-md">
            <q-chip
              v-for="s in child.subjects"
              :key="s.code"
              size="sm"
              color="amber-2"
              text-color="amber-10"
              icon="menu_book"
            >
              {{ lang === 'af' ? s.name_af : (lang === 'tn' ? (s.name_tn || s.name_en) : s.name_en) }}
            </q-chip>
          </div>
        </q-card>

        <!-- Empty state -->
        <div v-if="children.length === 0" class="text-center text-grey-5 q-pa-lg">
          <q-icon name="child_care" size="48px" class="q-mb-sm" color="grey-4" />
          <div>{{ lang === 'af' ? 'Voeg jou eerste kind by om te begin' : 'Add your first child to get started' }}</div>
        </div>

        <!-- Add Child (expandable) -->
        <q-expansion-item
          icon="person_add"
          :label="lang === 'af' ? 'Voeg Kind By' : 'Add Child'"
          header-class="text-weight-bold text-amber-8"
          class="bee-card q-mb-md"
          style="border-radius: 12px; overflow: hidden;"
        >
          <q-card flat class="q-pa-md">
            <div class="row q-gutter-sm">
              <q-input v-model="newChild.name" outlined dense :label="lang === 'af' ? 'Naam' : 'Name'" class="col" />
              <q-input v-model="newChild.birthdate" outlined dense type="date" :label="lang === 'af' ? 'Geboortedatum' : 'Date of Birth'" class="col" />
            </div>
            <div class="row q-gutter-sm q-mt-sm">
              <q-select
                v-model="newChild.grade"
                outlined dense
                :label="lang === 'af' ? 'Graad' : 'Grade'"
                :options="gradeOptions"
                emit-value map-options
                class="col"
              />
              <q-select
                v-model="newChild.language"
                outlined dense
                :label="lang === 'af' ? 'Taal' : 'Language'"
                :options="languageOptions"
                emit-value map-options
                class="col"
              />
            </div>
            <q-btn
              class="btn-bee full-width q-mt-md"
              no-caps
              icon="add"
              :label="lang === 'af' ? 'Voeg By' : 'Add'"
              :loading="adding"
              :disable="!canAdd"
              @click="handleAddChild"
            />
          </q-card>
        </q-expansion-item>

      </template>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'src/i18n'
import { useChildren } from 'src/composables/useChildren'
import { backendApi } from 'src/boot/axios'
import { Notify, Dialog } from 'quasar'

const { lang, setLanguage } = useI18n()
const { checkConsent, acceptConsent, listChildren, addChild, removeChild } = useChildren()

const loading = ref(true)
const consentGiven = ref(false)
const consentCheckbox = ref(false)
const savingConsent = ref(false)
const adding = ref(false)
const children = ref<any[]>([])
const parentLang = ref(lang.value)

const baseUrl = 'https://beegraded.co.za'

const newChild = ref({
  name: '',
  birthdate: '',
  grade: 4,
  language: 'af',
})

const gradeOptions = Array.from({ length: 12 }, (_, i) => ({
  label: `Gr ${i + 1}`,
  value: i + 1,
}))

const languageOptions = [
  { label: 'Afrikaans', value: 'af' },
  { label: 'English', value: 'en' },
  { label: 'Setswana', value: 'tn' },
]

const canAdd = computed(() =>
  newChild.value.name.trim() && newChild.value.birthdate && newChild.value.grade
)

function handleLangChange(newLang: string) {
  setLanguage(newLang)
}

async function handleConsent() {
  savingConsent.value = true
  try {
    await acceptConsent()
    consentGiven.value = true
    await loadChildren()
  } catch {
    Notify.create({ type: 'negative', message: 'Failed to save consent' })
  } finally {
    savingConsent.value = false
  }
}

async function handleAddChild() {
  adding.value = true
  try {
    await addChild({
      name: newChild.value.name.trim(),
      birthdate: newChild.value.birthdate,
      grade: newChild.value.grade,
      language: newChild.value.language,
    })
    newChild.value = { name: '', birthdate: '', grade: 4, language: 'af' }
    await loadChildren()
    Notify.create({
      type: 'positive',
      message: lang.value === 'af' ? 'Kind bygevoeg!' : 'Child added!',
    })
  } catch (err: any) {
    Notify.create({
      type: 'negative',
      message: err.response?.data?.message || 'Failed to add child',
    })
  } finally {
    adding.value = false
  }
}

function handleRemoveChild(child: any) {
  Dialog.create({
    title: lang.value === 'af' ? 'Verwyder kind?' : 'Remove child?',
    message: lang.value === 'af'
      ? `Dit sal ${child.name} se profiel en alle toetsresultate permanent verwyder.`
      : `This will permanently remove ${child.name}'s profile and all test results.`,
    cancel: { label: lang.value === 'af' ? 'Nee' : 'No', flat: true },
    ok: { label: lang.value === 'af' ? 'Ja, verwyder' : 'Yes, remove', color: 'negative' },
  }).onOk(async () => {
    try {
      await removeChild(child.id)
      await loadChildren()
      Notify.create({
        type: 'positive',
        message: lang.value === 'af' ? 'Kind verwyder' : 'Child removed',
      })
    } catch {
      Notify.create({ type: 'negative', message: 'Failed to remove child' })
    }
  })
}

async function loadChildren() {
  try {
    const data = await listChildren()
    children.value = data.children
  } catch {
    children.value = []
  }
}

onMounted(async () => {
  // Load parent's language preference
  try {
    const { data } = await backendApi.get('/profile')
    if (data.language) {
      setLanguage(data.language)
      parentLang.value = data.language
      newChild.value.language = data.language
    }
  } catch { /* use default */ }

  try {
    const consent = await checkConsent()
    consentGiven.value = consent.accepted
    if (consentGiven.value) {
      await loadChildren()
    }
  } catch {
    // Not logged in — consent check fails
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.child-card {
  transition: transform 0.15s, box-shadow 0.15s;
}
.child-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(120, 53, 15, 0.12);
}
</style>
