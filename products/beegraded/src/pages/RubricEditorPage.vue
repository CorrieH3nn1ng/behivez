<template>
  <q-page class="honeycomb-bg">
    <div class="page-container" style="max-width: 600px;">
      <q-btn flat no-caps icon="arrow_back" label="Back" color="grey-7" @click="$router.back()" class="q-mb-md" />

      <h2 class="text-h5 text-weight-bold q-mb-xs">
        <q-icon name="tune" color="amber" class="q-mr-sm" />
        Customize Rubric Weights
      </h2>
      <p class="text-grey-7 q-mb-lg" style="font-size: 14px;">
        Adjust how much each criterion counts toward your overall score. Total must equal 100%.
      </p>

      <q-card flat class="bee-card q-pa-lg">
        <div v-if="loadingRubric" class="text-center q-pa-lg">
          <q-spinner-gears size="32px" color="amber" />
        </div>

        <template v-else>
          <RubricWeightSlider v-model="weights.knowledge" label="Knowledge & Understanding" color="blue" />
          <RubricWeightSlider v-model="weights.critical" label="Critical Thinking & Analysis" color="purple" />
          <RubricWeightSlider v-model="weights.application" label="Application & Problem Solving" color="green" />
          <RubricWeightSlider v-model="weights.referencing" label="Referencing & Academic Integrity" color="orange" />
          <RubricWeightSlider v-model="weights.structure" label="Structure & Presentation" color="red" />

          <!-- Total indicator -->
          <q-separator class="q-my-md" />
          <div class="row items-center q-mb-md">
            <span class="text-weight-bold">Total</span>
            <q-space />
            <q-badge
              :color="totalValid ? 'positive' : 'negative'"
              text-color="white"
              style="font-size: 15px; padding: 4px 12px;"
            >
              {{ total }}%
            </q-badge>
          </div>
          <div v-if="!totalValid" class="text-negative text-caption q-mb-md">
            Weights must add up to exactly 100%. Currently {{ total }}%.
          </div>

          <div class="row q-gutter-sm">
            <q-btn outline no-caps label="Reset to Defaults" color="grey-7" @click="resetDefaults" />
            <q-space />
            <q-btn
              class="btn-bee"
              no-caps
              label="Save & Continue to Evaluation"
              :disable="!totalValid || saving"
              :loading="saving"
              @click="handleSave"
            />
          </div>
        </template>
      </q-card>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useEvaluation } from 'src/composables/useEvaluation'
import { Notify } from 'quasar'
import RubricWeightSlider from 'src/components/RubricWeightSlider.vue'

const route = useRoute()
const router = useRouter()
const { saveRubric, getRubric, triggerEvaluation } = useEvaluation()

const paperId = computed(() => Number(route.params.paperId))
const loadingRubric = ref(true)
const saving = ref(false)

const DEFAULTS = {
  knowledge: 25,
  critical: 25,
  application: 20,
  referencing: 15,
  structure: 15,
}

const weights = reactive({ ...DEFAULTS })

const total = computed(() => weights.knowledge + weights.critical + weights.application + weights.referencing + weights.structure)
const totalValid = computed(() => total.value === 100)

function resetDefaults() {
  Object.assign(weights, DEFAULTS)
}

onMounted(async () => {
  try {
    const existing = await getRubric(paperId.value)
    if (existing) {
      weights.knowledge = existing.knowledge_weight ?? DEFAULTS.knowledge
      weights.critical = existing.critical_weight ?? DEFAULTS.critical
      weights.application = existing.application_weight ?? DEFAULTS.application
      weights.referencing = existing.referencing_weight ?? DEFAULTS.referencing
      weights.structure = existing.structure_weight ?? DEFAULTS.structure
    }
  } catch { /* use defaults */ } finally {
    loadingRubric.value = false
  }
})

async function handleSave() {
  if (!totalValid.value) return
  saving.value = true
  try {
    await saveRubric(paperId.value, {
      knowledge_weight: weights.knowledge,
      critical_weight: weights.critical,
      application_weight: weights.application,
      referencing_weight: weights.referencing,
      structure_weight: weights.structure,
    })

    // Trigger evaluation and route to processing
    const mode = (route.query.mode as string) || 'A'
    await triggerEvaluation(paperId.value, mode)
    router.push({
      path: `/workspace/processing/${paperId.value}`,
      query: { mode, test: '1' },
    })
  } catch {
    Notify.create({ type: 'negative', message: 'Failed to save rubric. Try again.' })
  } finally {
    saving.value = false
  }
}
</script>
