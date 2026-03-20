<template>
  <div class="issues-list">
    <div v-for="group in groupedIssues" :key="group.severity" class="q-mb-md">
      <div class="severity-header q-pa-sm q-pl-md q-mb-sm" :class="`bg-${severityColor(group.severity)}`">
        <q-icon :name="severityIcon(group.severity)" color="white" size="18px" class="q-mr-sm" />
        <span class="text-white text-weight-bold" style="font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">
          {{ group.severity }} ({{ group.items.length }})
        </span>
      </div>

      <q-list bordered separator class="rounded-borders">
        <q-expansion-item
          v-for="issue in group.items"
          :key="issue.id"
          :icon="issue.fixed_in_final ? 'check_circle' : severityIcon(group.severity)"
          :header-class="issue.fixed_in_final ? 'text-positive' : ''"
          expand-separator
        >
          <template #header>
            <q-item-section avatar>
              <q-icon
                :name="issue.fixed_in_final ? 'check_circle' : severityIcon(group.severity)"
                :color="issue.fixed_in_final ? 'positive' : severityColor(group.severity)"
                size="24px"
              />
            </q-item-section>
            <q-item-section>
              <q-item-label class="text-weight-bold" style="font-size: 14px;">{{ issue.category }}</q-item-label>
              <q-item-label caption>{{ issue.what_issue || issue.description }}</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-badge v-if="issue.fixed_in_final !== null" :color="issue.fixed_in_final ? 'positive' : 'grey'" :label="issue.fixed_in_final ? 'Fixed' : 'Open'" />
              <q-badge v-if="issue.who_notices" outline color="grey-7" :label="issue.who_notices" class="q-ml-xs" />
            </q-item-section>
          </template>

          <!-- 5W1H Expanded Detail -->
          <q-card flat class="q-ma-sm" style="background: #fafafa; border-radius: 8px;">
            <q-card-section class="q-pa-md">
              <!-- WHERE -->
              <div v-if="issue.where_in_paper" class="detail-row q-mb-sm">
                <span class="detail-tag bg-blue-1 text-blue-8">WHERE</span>
                <span class="detail-text">{{ issue.where_in_paper }}</span>
              </div>

              <!-- WHY chain (5 Whys drill-down) -->
              <div v-if="issue.why_chain && issue.why_chain.length" class="detail-row q-mb-sm">
                <span class="detail-tag bg-amber-1 text-amber-9">WHY</span>
                <div class="why-chain">
                  <div v-for="(why, i) in issue.why_chain" :key="i" class="why-step">
                    <span class="why-num">{{ i + 1 }}</span>
                    <span class="why-text">{{ why }}</span>
                    <q-icon v-if="i < issue.why_chain.length - 1" name="arrow_downward" size="14px" color="amber-7" class="why-arrow" />
                  </div>
                </div>
              </div>

              <!-- ROOT CAUSE (highlighted) -->
              <div v-if="issue.root_cause" class="root-cause q-mb-sm q-pa-sm" style="background: #fff3e0; border-left: 3px solid #f59e0b; border-radius: 4px;">
                <span class="detail-tag bg-amber text-white">ROOT CAUSE</span>
                <span class="detail-text text-weight-bold">{{ issue.root_cause }}</span>
              </div>

              <!-- HOW -->
              <div v-if="issue.how_to_fix || issue.recommendation" class="detail-row q-mb-sm">
                <span class="detail-tag bg-green-1 text-green-8">HOW TO FIX</span>
                <span class="detail-text">{{ issue.how_to_fix || issue.recommendation }}</span>
              </div>

              <!-- WHO -->
              <div v-if="issue.who_notices" class="detail-row">
                <span class="detail-tag bg-purple-1 text-purple-8">WHO NOTICES</span>
                <span class="detail-text">{{ issue.who_notices }}</span>
              </div>
            </q-card-section>
          </q-card>
        </q-expansion-item>
      </q-list>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Issue {
  id: number
  category: string
  severity: 'critical' | 'important' | 'polish'
  // 5W1H fields
  what_issue: string | null
  where_in_paper: string | null
  why_chain: string[] | null
  root_cause: string | null
  how_to_fix: string | null
  who_notices: string | null
  // Legacy fields
  description: string
  recommendation: string | null
  example_before: string | null
  example_after: string | null
  fixed_in_final: boolean | null
}

const props = defineProps<{
  issues: Issue[]
}>()

const severityOrder = { critical: 0, important: 1, polish: 2 }

const groupedIssues = computed(() => {
  const groups = new Map<string, Issue[]>()
  for (const issue of props.issues) {
    const list = groups.get(issue.severity) || []
    list.push(issue)
    groups.set(issue.severity, list)
  }
  return Array.from(groups.entries())
    .map(([severity, items]) => ({ severity, items }))
    .sort((a, b) => (severityOrder[a.severity as keyof typeof severityOrder] ?? 3) - (severityOrder[b.severity as keyof typeof severityOrder] ?? 3))
})

function severityColor(severity: string) {
  switch (severity) {
    case 'critical': return 'negative'
    case 'important': return 'warning'
    case 'polish': return 'info'
    default: return 'grey'
  }
}

function severityIcon(severity: string) {
  switch (severity) {
    case 'critical': return 'error'
    case 'important': return 'warning'
    case 'polish': return 'auto_fix_high'
    default: return 'info'
  }
}
</script>

<style scoped>
.severity-header {
  border-radius: 8px;
  display: flex;
  align-items: center;
}

.detail-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 13px;
}

.detail-tag {
  display: inline-block;
  padding: 1px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
  flex-shrink: 0;
  margin-top: 2px;
}

.detail-text {
  line-height: 1.5;
}

/* 5 Whys chain */
.why-chain {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.why-step {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  padding: 4px 0;
}

.why-num {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #f59e0b;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 700;
  flex-shrink: 0;
}

.why-text {
  font-size: 13px;
  line-height: 1.5;
}

.why-arrow {
  margin-left: 4px;
  margin-top: 2px;
}

.root-cause {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 13px;
}
</style>
