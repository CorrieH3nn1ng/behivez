<template>
  <q-card flat class="bee-card q-pa-lg">
    <div class="row items-center q-mb-md">
      <q-icon name="hive" size="36px" color="amber" class="q-mr-md" />
      <div>
        <div class="text-h5 text-weight-bold">BeeGraded Report</div>
        <div class="text-caption text-grey-7">{{ formatDate(eval.created_at) }}</div>
      </div>
      <q-space />
      <q-badge :color="eval.mode === 'B' ? 'red' : 'blue'" :label="eval.mode === 'B' ? 'Mode B — Turnitin Ready' : 'Mode A — Academic'" />
      <q-badge v-if="eval.draft_or_final" :color="eval.draft_or_final === 'final' ? 'positive' : 'grey'" :label="eval.draft_or_final" class="q-ml-sm text-capitalize" />
    </div>

    <div class="row q-gutter-md">
      <div v-if="eval.filename" class="col-auto">
        <div class="text-caption text-grey-6">File</div>
        <div class="text-weight-medium">{{ eval.filename }}</div>
      </div>
      <div v-if="eval.subject" class="col-auto">
        <div class="text-caption text-grey-6">Subject</div>
        <div class="text-weight-medium">{{ eval.subject }}</div>
      </div>
      <div v-if="eval.assessment_type" class="col-auto">
        <div class="text-caption text-grey-6">Type</div>
        <div class="text-weight-medium">{{ eval.assessment_type }}</div>
      </div>
      <div v-if="eval.word_count" class="col-auto">
        <div class="text-caption text-grey-6">Words</div>
        <div class="text-weight-medium">{{ eval.word_count.toLocaleString() }}</div>
      </div>
      <div v-if="eval.page_count" class="col-auto">
        <div class="text-caption text-grey-6">Pages</div>
        <div class="text-weight-medium">{{ eval.page_count }}</div>
      </div>
      <div v-if="eval.programme" class="col-auto">
        <div class="text-caption text-grey-6">Programme</div>
        <div class="text-weight-medium">{{ eval.programme }}</div>
      </div>
      <div v-if="eval.module_name" class="col-auto">
        <div class="text-caption text-grey-6">Module</div>
        <div class="text-weight-medium">{{ eval.module_name }}</div>
      </div>
    </div>
  </q-card>
</template>

<script setup lang="ts">
defineProps<{
  eval: {
    created_at: string
    mode: string
    draft_or_final: string
    filename: string
    subject: string
    assessment_type: string
    word_count: number
    page_count: number
    programme: string | null
    module_name: string | null
    total_marks: number | null
  }
}>()

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-ZA', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}
</script>
