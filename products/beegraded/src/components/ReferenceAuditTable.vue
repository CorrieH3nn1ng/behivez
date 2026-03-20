<template>
  <div class="ref-audit">
    <q-table
      flat
      bordered
      dense
      :rows="references"
      :columns="columns"
      row-key="id"
      :rows-per-page-options="[0]"
      hide-pagination
      class="ref-table"
    >
      <template #body-cell-matched="props">
        <q-td :props="props">
          <q-badge :color="props.row.matched ? 'positive' : 'negative'" :label="props.row.matched ? 'Matched' : 'Missing'" />
        </q-td>
      </template>
      <template #body-cell-issue_type="props">
        <q-td :props="props">
          <q-badge
            v-if="props.row.issue_type"
            :color="issueColor(props.row.issue_type)"
            :label="props.row.issue_type"
          />
          <span v-else class="text-grey-5">—</span>
        </q-td>
      </template>
    </q-table>

    <div class="row q-mt-md q-gutter-md">
      <div class="stat-chip bg-positive text-white q-pa-sm rounded-borders">
        <strong>{{ matchedCount }}</strong> matched
      </div>
      <div class="stat-chip bg-negative text-white q-pa-sm rounded-borders">
        <strong>{{ missingCount }}</strong> missing
      </div>
      <div v-if="unusedCount > 0" class="stat-chip bg-warning text-white q-pa-sm rounded-borders">
        <strong>{{ unusedCount }}</strong> unused
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface RefAudit {
  id: number
  citation: string
  source_type: 'in_text' | 'bibliography'
  matched: boolean
  issue_type: string | null
}

const props = defineProps<{
  references: RefAudit[]
}>()

const columns = [
  { name: 'citation', label: 'Citation', field: 'citation', align: 'left' as const, sortable: true },
  { name: 'source_type', label: 'Source', field: 'source_type', align: 'center' as const },
  { name: 'matched', label: 'Status', field: 'matched', align: 'center' as const },
  { name: 'issue_type', label: 'Issue', field: 'issue_type', align: 'center' as const },
]

const matchedCount = computed(() => props.references.filter(r => r.matched).length)
const missingCount = computed(() => props.references.filter(r => !r.matched).length)
const unusedCount = computed(() => props.references.filter(r => r.issue_type === 'unused').length)

function issueColor(type: string) {
  switch (type) {
    case 'missing': return 'negative'
    case 'unused': return 'warning'
    case 'date_mismatch': return 'info'
    default: return 'grey'
  }
}
</script>

<style scoped>
.ref-table :deep(th) {
  background: #1c1917;
  color: white;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.stat-chip {
  font-size: 13px;
  border-radius: 8px;
}
</style>
