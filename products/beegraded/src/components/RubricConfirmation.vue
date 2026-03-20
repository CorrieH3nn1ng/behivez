<template>
  <q-card flat class="bee-card q-pa-lg">
    <div class="row items-center q-mb-md">
      <q-icon name="fact_check" size="32px" color="amber" class="q-mr-sm" />
      <div>
        <div class="text-h6 text-weight-bold">We extracted your rubric</div>
        <div class="text-caption text-grey-7">Please confirm the details below are correct.</div>
      </div>
    </div>

    <!-- Rubric metadata -->
    <div class="q-pa-md bg-grey-1 rounded-borders q-mb-md">
      <div class="row q-gutter-md">
        <div v-if="rubric.programme" class="col-12 col-sm-6">
          <div class="text-caption text-grey-6">Programme</div>
          <div class="text-weight-bold">{{ rubric.programme }}</div>
        </div>
        <div v-if="rubric.module_name" class="col-12 col-sm-6">
          <div class="text-caption text-grey-6">Module</div>
          <div class="text-weight-bold">{{ rubric.module_name }}</div>
        </div>
        <div v-if="rubric.nqf_level" class="col-12 col-sm-4">
          <div class="text-caption text-grey-6">NQF Level</div>
          <div class="text-weight-bold">{{ rubric.nqf_level }}</div>
        </div>
        <div v-if="rubric.assessment_type" class="col-12 col-sm-4">
          <div class="text-caption text-grey-6">Assessment Type</div>
          <div class="text-weight-bold">{{ rubric.assessment_type }}</div>
        </div>
        <div class="col-12 col-sm-4">
          <div class="text-caption text-grey-6">Total Marks</div>
          <div class="text-weight-bold text-amber-8">{{ rubric.total_marks }}</div>
        </div>
      </div>
    </div>

    <!-- Questions breakdown -->
    <div class="text-weight-bold q-mb-sm">Questions Found: {{ rubric.questions.length }}</div>
    <q-list bordered separator class="rounded-borders q-mb-lg">
      <q-item v-for="q in rubric.questions" :key="q.number">
        <q-item-section avatar>
          <q-avatar size="32px" color="amber-1" text-color="amber-9">
            {{ q.number }}
          </q-avatar>
        </q-item-section>
        <q-item-section>
          <q-item-label>{{ q.title }}</q-item-label>
          <q-item-label caption>{{ q.marks }} marks</q-item-label>
          <q-item-label v-if="q.criteria.length" caption class="text-grey-6">
            {{ q.criteria.join(' · ') }}
          </q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-badge color="amber" :label="`${q.marks} marks`" />
        </q-item-section>
      </q-item>
    </q-list>

    <!-- Structure notes -->
    <div v-if="rubric.structure_notes?.length" class="q-mb-md">
      <div class="text-weight-bold q-mb-sm">
        <q-icon name="format_list_bulleted" color="amber" size="18px" class="q-mr-xs" />
        Answer Structure Requirements
      </div>
      <div class="q-pa-sm bg-amber-1 rounded-borders">
        <ul style="padding-left: 16px; margin: 0;">
          <li v-for="(note, i) in rubric.structure_notes" :key="i" class="text-caption" style="margin-bottom: 4px;">{{ note }}</li>
        </ul>
      </div>
    </div>

    <!-- Grading scale -->
    <div v-if="rubric.grading_scale?.length" class="q-mb-md">
      <div class="text-weight-bold q-mb-sm">
        <q-icon name="assessment" color="amber" size="18px" class="q-mr-xs" />
        Grading Scale
      </div>
      <div class="q-pa-sm bg-grey-1 rounded-borders" style="overflow-x: auto;">
        <table style="width: 100%; font-size: 12px; border-collapse: collapse;">
          <thead>
            <tr>
              <th style="text-align: left; padding: 4px 8px; border-bottom: 1px solid #ddd;">Criteria</th>
              <th v-for="level in rubric.grading_scale" :key="level.label" style="text-align: left; padding: 4px 8px; border-bottom: 1px solid #ddd;">
                {{ level.label }}<br><span class="text-grey-6">{{ level.range }}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="criterion in gradingCriteria" :key="criterion">
              <td style="padding: 4px 8px; border-bottom: 1px solid #eee; font-weight: 600;">{{ criterion }}</td>
              <td v-for="level in rubric.grading_scale" :key="level.label" style="padding: 4px 8px; border-bottom: 1px solid #eee;">
                {{ level.criteria[criterion] || '-' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="text-caption text-grey-6 q-mb-md">
      <q-icon name="info" size="14px" class="q-mr-xs" />
      From: {{ rubric.original_filename }}
    </div>

    <!-- Actions -->
    <div class="row q-gutter-md">
      <q-btn
        class="btn-bee col"
        size="lg"
        no-caps
        label="Confirm & Continue"
        icon="check"
        :loading="confirming"
        @click="$emit('confirm')"
      />
      <q-btn
        outline
        color="grey-7"
        class="col-auto"
        no-caps
        label="Re-upload"
        icon="refresh"
        @click="$emit('reupload')"
      />
    </div>
  </q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ParsedRubric } from 'src/stores/token'

const props = defineProps<{
  rubric: ParsedRubric
  confirming: boolean
}>()

defineEmits<{
  confirm: []
  reupload: []
}>()

const gradingCriteria = computed(() => {
  if (!props.rubric.grading_scale?.length) return []
  const allKeys = new Set<string>()
  for (const level of props.rubric.grading_scale) {
    for (const key of Object.keys(level.criteria || {})) {
      allKeys.add(key)
    }
  }
  return Array.from(allKeys)
})
</script>
