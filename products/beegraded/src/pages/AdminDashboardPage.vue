<template>
  <q-page class="honeycomb-bg">
    <div class="page-container">
      <!-- Header -->
      <div class="row items-center q-mb-lg">
        <div>
          <h2 class="text-h5 text-weight-bold q-mb-none">
            <q-icon name="admin_panel_settings" color="amber" class="q-mr-sm" />
            Admin Dashboard
          </h2>
          <p class="text-grey-7 q-mb-none" style="font-size: 14px;">All BeeGraded data across all users — for testing and troubleshooting.</p>
        </div>
        <q-space />
        <q-btn flat dense no-caps color="amber" icon="refresh" label="Refresh" @click="loadAll" :loading="loading" />
      </div>

      <!-- Error banner -->
      <q-banner v-if="errorMsg" class="bg-red-1 text-red-8 q-mb-md rounded-borders" dense>
        <template #avatar><q-icon name="error" color="red" /></template>
        {{ errorMsg }}
      </q-banner>

      <!-- Stats cards -->
      <div v-if="stats" class="row q-gutter-md q-mb-lg">
        <q-card v-for="s in statCards" :key="s.label" flat class="bee-card col q-pa-md text-center">
          <q-icon :name="s.icon" :color="s.color" size="28px" />
          <div class="text-h4 text-weight-bold q-mt-xs">{{ s.value }}</div>
          <div class="text-caption text-grey-6">{{ s.label }}</div>
        </q-card>
      </div>

      <!-- Tabs for data sections -->
      <q-tabs v-model="activeTab" class="text-amber q-mb-md" active-color="amber" indicator-color="amber" align="left" dense no-caps>
        <q-tab name="rubrics" icon="grading" label="Rubrics" />
        <q-tab name="papers" icon="description" label="Papers" />
        <q-tab name="evaluations" icon="assessment" label="Evaluations" />
        <q-tab name="users" icon="people" label="Users" />
      </q-tabs>

      <!-- Loading -->
      <div v-if="loading" class="text-center q-pa-xl">
        <q-spinner-gears size="48px" color="amber" />
      </div>

      <!-- RUBRICS TAB -->
      <template v-else-if="activeTab === 'rubrics'">
        <q-card flat class="bee-card q-pa-md">
          <div class="text-weight-bold q-mb-md">All Rubrics ({{ rubrics.length }})</div>
          <q-table
            :rows="rubrics"
            :columns="rubricColumns"
            row-key="id"
            flat
            dense
            :pagination="{ rowsPerPage: 20 }"
            class="admin-table"
          >
            <template #body-cell-confirmed="props">
              <q-td :props="props">
                <q-icon :name="props.value ? 'check_circle' : 'cancel'" :color="props.value ? 'positive' : 'grey-4'" size="18px" />
              </q-td>
            </template>
            <template #body-cell-actions="props">
              <q-td :props="props">
                <q-btn flat dense size="sm" icon="visibility" color="amber-8" @click="viewRubric(props.row.id)">
                  <q-tooltip>View detail</q-tooltip>
                </q-btn>
              </q-td>
            </template>
          </q-table>
        </q-card>
      </template>

      <!-- PAPERS TAB -->
      <template v-else-if="activeTab === 'papers'">
        <q-card flat class="bee-card q-pa-md">
          <div class="text-weight-bold q-mb-md">All Papers ({{ papers.length }})</div>
          <q-table
            :rows="papers"
            :columns="paperColumns"
            row-key="id"
            flat
            dense
            :pagination="{ rowsPerPage: 20 }"
            class="admin-table"
          >
            <template #body-cell-evaluations="props">
              <q-td :props="props">
                <template v-for="ev in props.value" :key="ev.id">
                  <q-badge :color="ev.overall_score > 0 ? 'positive' : 'grey'" class="q-mr-xs cursor-pointer" @click="viewEvaluation(ev.id)">
                    {{ ev.overall_score > 0 ? `${ev.overall_score}%` : 'pending' }}
                  </q-badge>
                </template>
                <span v-if="!props.value.length" class="text-grey-5">none</span>
              </q-td>
            </template>
            <template #body-cell-actions="props">
              <q-td :props="props">
                <q-btn flat dense size="sm" icon="visibility" color="amber-8" @click="viewPaper(props.row.id)">
                  <q-tooltip>View paper</q-tooltip>
                </q-btn>
              </q-td>
            </template>
          </q-table>
        </q-card>
      </template>

      <!-- EVALUATIONS TAB -->
      <template v-else-if="activeTab === 'evaluations'">
        <q-card flat class="bee-card q-pa-md">
          <div class="text-weight-bold q-mb-md">All Evaluations ({{ evaluations.length }})</div>
          <q-table
            :rows="evaluations"
            :columns="evalColumns"
            row-key="id"
            flat
            dense
            :pagination="{ rowsPerPage: 20 }"
            class="admin-table"
          >
            <template #body-cell-overall_score="props">
              <q-td :props="props">
                <q-badge :color="props.value > 70 ? 'positive' : props.value > 50 ? 'warning' : props.value > 0 ? 'negative' : 'grey'">
                  {{ props.value > 0 ? `${props.value}%` : 'pending' }}
                </q-badge>
              </q-td>
            </template>
            <template #body-cell-actions="props">
              <q-td :props="props">
                <q-btn flat dense size="sm" icon="visibility" color="amber-8" @click="viewEvaluation(props.row.id)">
                  <q-tooltip>View detail</q-tooltip>
                </q-btn>
                <q-btn v-if="props.row.overall_score > 0" flat dense size="sm" icon="open_in_new" color="blue-7" :to="`/workspace/report/${props.row.id}`">
                  <q-tooltip>Full report page</q-tooltip>
                </q-btn>
              </q-td>
            </template>
          </q-table>
        </q-card>
      </template>

      <!-- USERS TAB -->
      <template v-else-if="activeTab === 'users'">
        <q-card flat class="bee-card q-pa-md">
          <div class="text-weight-bold q-mb-md">All Local Users ({{ users.length }})</div>
          <q-table
            :rows="users"
            :columns="userColumns"
            row-key="id"
            flat
            dense
            :pagination="{ rowsPerPage: 20 }"
            class="admin-table"
          />
        </q-card>
      </template>

      <!-- Rubric detail dialog -->
      <q-dialog v-model="showRubricDetail" maximized transition-show="slide-up" transition-hide="slide-down">
        <q-card>
          <q-bar class="bg-dark text-white">
            <q-icon name="grading" />
            <div class="text-weight-bold q-ml-sm">Rubric #{{ rubricDetail?.id }} — {{ rubricDetail?.module_name || rubricDetail?.original_filename }}</div>
            <q-space />
            <q-btn dense flat icon="close" v-close-popup />
          </q-bar>
          <q-card-section v-if="rubricDetail" class="q-pa-lg" style="max-width: 800px; margin: 0 auto;">
            <div class="row q-gutter-md q-mb-lg">
              <div class="col">
                <div class="text-caption text-grey-6">Programme</div>
                <div class="text-weight-bold">{{ rubricDetail.programme || '—' }}</div>
              </div>
              <div class="col">
                <div class="text-caption text-grey-6">Module</div>
                <div class="text-weight-bold">{{ rubricDetail.module_name || '—' }}</div>
              </div>
              <div class="col">
                <div class="text-caption text-grey-6">Assessment Type</div>
                <div class="text-weight-bold">{{ rubricDetail.assessment_type || '—' }}</div>
              </div>
              <div class="col">
                <div class="text-caption text-grey-6">Total Marks</div>
                <div class="text-weight-bold">{{ rubricDetail.total_marks || '—' }}</div>
              </div>
              <div class="col">
                <div class="text-caption text-grey-6">NQF Level</div>
                <div class="text-weight-bold">{{ rubricDetail.nqf_level || '—' }}</div>
              </div>
            </div>

            <div class="text-weight-bold q-mb-sm">Questions ({{ rubricDetail.questions?.length || 0 }})</div>
            <q-card v-for="(q, i) in rubricDetail.questions" :key="i" flat bordered class="q-pa-md q-mb-sm" style="border-radius:8px">
              <div class="row items-center q-mb-xs">
                <div class="text-weight-bold">Q{{ q.number || i + 1 }}: {{ q.title }}</div>
                <q-space />
                <q-badge color="amber">{{ q.marks }} marks</q-badge>
              </div>
              <div v-if="q.criteria?.length" class="q-mt-xs">
                <div v-for="(c, ci) in q.criteria" :key="ci" class="text-caption text-grey-7">
                  &bull; {{ c }}
                </div>
              </div>
            </q-card>

            <div v-if="rubricDetail.structure_notes?.length" class="q-mt-lg">
              <div class="text-weight-bold q-mb-sm">Structure Notes</div>
              <div v-for="(n, ni) in rubricDetail.structure_notes" :key="ni" class="text-caption text-grey-7 q-mb-xs">
                &bull; {{ n }}
              </div>
            </div>
          </q-card-section>
          <q-card-section v-else class="text-center q-pa-xl">
            <q-spinner-gears size="32px" color="amber" />
          </q-card-section>
        </q-card>
      </q-dialog>

      <!-- Paper detail dialog -->
      <q-dialog v-model="showPaperDetail" maximized transition-show="slide-up" transition-hide="slide-down">
        <q-card>
          <q-bar class="bg-dark text-white">
            <q-icon name="description" />
            <div class="text-weight-bold q-ml-sm">Paper #{{ paperDetail?.id }} — {{ paperDetail?.filename }}</div>
            <q-space />
            <q-btn dense flat icon="close" v-close-popup />
          </q-bar>
          <q-card-section v-if="paperDetail" class="q-pa-lg" style="max-width: 900px; margin: 0 auto;">
            <div class="row q-gutter-md q-mb-lg">
              <div class="col">
                <div class="text-caption text-grey-6">Uploaded By</div>
                <div class="text-weight-bold">{{ paperDetail.user_name || paperDetail.user_email || 'Unknown' }}</div>
                <div v-if="paperDetail.user_email" class="text-caption text-grey-6">{{ paperDetail.user_email }}</div>
              </div>
              <div class="col">
                <div class="text-caption text-grey-6">Subject</div>
                <div class="text-weight-bold">{{ paperDetail.subject }}</div>
              </div>
              <div class="col">
                <div class="text-caption text-grey-6">Type</div>
                <div class="text-weight-bold">{{ paperDetail.draft_or_final }}</div>
              </div>
              <div class="col">
                <div class="text-caption text-grey-6">Words / Pages</div>
                <div class="text-weight-bold">{{ paperDetail.word_count }} / {{ paperDetail.page_count }}</div>
              </div>
              <div class="col">
                <div class="text-caption text-grey-6">Uploaded</div>
                <div class="text-weight-bold">{{ new Date(paperDetail.uploaded_at).toLocaleString() }}</div>
              </div>
            </div>

            <!-- Evaluations for this paper -->
            <div v-if="paperDetail.evaluations?.length" class="q-mb-lg">
              <div class="text-weight-bold q-mb-sm">Evaluations</div>
              <q-card v-for="ev in paperDetail.evaluations" :key="ev.id" flat bordered class="q-pa-md q-mb-sm cursor-pointer" style="border-radius:8px" @click="viewEvaluation(ev.id); showPaperDetail = false">
                <div class="row items-center">
                  <q-badge :color="ev.overall_score > 0 ? 'positive' : 'grey'" class="q-mr-md">
                    {{ ev.overall_score > 0 ? `${ev.overall_score}%` : 'pending' }}
                  </q-badge>
                  <span>Mode {{ ev.mode }} &middot; {{ ev.draft_or_final }} &middot; {{ new Date(ev.created_at).toLocaleDateString() }}</span>
                  <q-space />
                  <q-icon name="arrow_forward" color="grey-5" />
                </div>
              </q-card>
            </div>

            <!-- Paper text -->
            <div class="text-weight-bold q-mb-sm">Extracted Text ({{ paperDetail.paper_text?.length || 0 }} chars)</div>
            <q-card flat bordered class="q-pa-md" style="border-radius:8px; max-height: 500px; overflow-y: auto;">
              <pre style="white-space: pre-wrap; word-wrap: break-word; font-size: 13px; font-family: inherit; margin: 0;">{{ paperDetail.paper_text || 'No text extracted' }}</pre>
            </q-card>
          </q-card-section>
          <q-card-section v-else class="text-center q-pa-xl">
            <q-spinner-gears size="32px" color="amber" />
          </q-card-section>
        </q-card>
      </q-dialog>

      <!-- Evaluation detail dialog -->
      <q-dialog v-model="showEvalDetail" maximized transition-show="slide-up" transition-hide="slide-down">
        <q-card>
          <q-bar class="bg-dark text-white">
            <q-icon name="assessment" />
            <div class="text-weight-bold q-ml-sm">Evaluation #{{ evalDetail?.evaluation?.id }} — {{ evalDetail?.evaluation?.filename }}</div>
            <q-space />
            <q-btn v-if="evalDetail?.evaluation?.id" dense flat icon="open_in_new" @click="$router.push(`/workspace/report/${evalDetail.evaluation.id}`)" class="q-mr-sm">
              <q-tooltip>Open full report page</q-tooltip>
            </q-btn>
            <q-btn dense flat icon="close" v-close-popup />
          </q-bar>
          <q-card-section v-if="evalDetail?.evaluation" class="q-pa-lg" style="max-width: 900px; margin: 0 auto;">
            <!-- Meta info -->
            <div class="row q-gutter-md q-mb-lg">
              <div class="col">
                <div class="text-caption text-grey-6">User</div>
                <div class="text-weight-bold">{{ evalDetail.evaluation.user_name || evalDetail.evaluation.user_email || 'Unknown' }}</div>
                <div v-if="evalDetail.evaluation.user_email" class="text-caption text-grey-6">{{ evalDetail.evaluation.user_email }}</div>
              </div>
              <div class="col">
                <div class="text-caption text-grey-6">Paper</div>
                <div class="text-weight-bold">{{ evalDetail.evaluation.filename }}</div>
              </div>
              <div class="col">
                <div class="text-caption text-grey-6">Subject</div>
                <div class="text-weight-bold">{{ evalDetail.evaluation.subject }}</div>
              </div>
              <div class="col">
                <div class="text-caption text-grey-6">Mode / Type</div>
                <div class="text-weight-bold">{{ evalDetail.evaluation.mode }} / {{ evalDetail.evaluation.draft_or_final }}</div>
              </div>
              <div class="col">
                <div class="text-caption text-grey-6">Date</div>
                <div class="text-weight-bold">{{ new Date(evalDetail.evaluation.created_at).toLocaleString() }}</div>
              </div>
            </div>

            <!-- Scores -->
            <q-card flat bordered class="q-pa-lg q-mb-lg" style="border-radius:8px">
              <div class="text-weight-bold q-mb-md">Score Breakdown</div>
              <div class="row q-gutter-md">
                <div v-for="s in scoreCards" :key="s.label" class="col text-center">
                  <div class="text-h5 text-weight-bold" :class="s.value > 70 ? 'text-positive' : s.value > 50 ? 'text-warning' : s.value > 0 ? 'text-negative' : 'text-grey'">
                    {{ s.value > 0 ? `${s.value}%` : '—' }}
                  </div>
                  <div class="text-caption text-grey-6">{{ s.label }}</div>
                </div>
              </div>
            </q-card>

            <!-- Issues -->
            <q-card v-if="evalDetail.issues?.length" flat bordered class="q-pa-lg q-mb-lg" style="border-radius:8px">
              <div class="text-weight-bold q-mb-md">Issues ({{ evalDetail.issues.length }})</div>
              <q-list separator dense>
                <q-item v-for="issue in evalDetail.issues" :key="issue.id">
                  <q-item-section avatar>
                    <q-badge :color="issue.severity === 'critical' ? 'red' : issue.severity === 'important' ? 'orange' : 'blue'" :label="issue.severity" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label class="text-weight-bold">{{ issue.category }}</q-item-label>
                    <q-item-label caption>{{ issue.what_issue || issue.description }}</q-item-label>
                    <q-item-label v-if="issue.how_to_fix" caption class="text-positive">Fix: {{ issue.how_to_fix }}</q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-card>

            <!-- Strengths -->
            <q-card v-if="evalDetail.strengths?.length" flat bordered class="q-pa-lg q-mb-lg" style="border-radius:8px">
              <div class="text-weight-bold q-mb-md">Strengths ({{ evalDetail.strengths.length }})</div>
              <q-list separator dense>
                <q-item v-for="s in evalDetail.strengths" :key="s.id">
                  <q-item-section avatar>
                    <q-icon name="star" color="amber" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label class="text-weight-bold">{{ s.category }}</q-item-label>
                    <q-item-label caption>{{ s.what_well }}</q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-card>

            <!-- References -->
            <q-card v-if="evalDetail.references?.length" flat bordered class="q-pa-lg q-mb-lg" style="border-radius:8px">
              <div class="text-weight-bold q-mb-md">Reference Audit ({{ evalDetail.references.length }})</div>
              <q-list separator dense>
                <q-item v-for="r in evalDetail.references" :key="r.id">
                  <q-item-section avatar>
                    <q-icon :name="r.matched ? 'check_circle' : 'cancel'" :color="r.matched ? 'positive' : 'negative'" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>{{ r.citation }}</q-item-label>
                    <q-item-label v-if="r.issue_type" caption class="text-negative">{{ r.issue_type }}</q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-card>

            <!-- Report HTML (raw) -->
            <q-expansion-item v-if="evalDetail.evaluation.report_html" icon="code" label="Raw Report HTML" header-class="text-weight-bold">
              <q-card flat bordered class="q-pa-md" style="max-height: 400px; overflow-y: auto;">
                <div v-html="evalDetail.evaluation.report_html" />
              </q-card>
            </q-expansion-item>
          </q-card-section>
          <q-card-section v-else class="text-center q-pa-xl">
            <q-spinner-gears size="32px" color="amber" />
          </q-card-section>
        </q-card>
      </q-dialog>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { backendApi } from 'src/boot/axios'

const loading = ref(true)
const errorMsg = ref('')
const activeTab = ref('rubrics')

// Data
const stats = ref<any>(null)
const rubrics = ref<any[]>([])
const papers = ref<any[]>([])
const evaluations = ref<any[]>([])
const users = ref<any[]>([])

// Detail dialogs
const showRubricDetail = ref(false)
const rubricDetail = ref<any>(null)
const showPaperDetail = ref(false)
const paperDetail = ref<any>(null)
const showEvalDetail = ref(false)
const evalDetail = ref<any>(null)

const statCards = computed(() => {
  if (!stats.value) return []
  const c = stats.value.counts
  return [
    { label: 'Rubrics', value: c.rubrics, icon: 'grading', color: 'amber' },
    { label: 'Papers', value: c.papers, icon: 'description', color: 'blue' },
    { label: 'Evaluations', value: c.evaluations, icon: 'assessment', color: 'green' },
    { label: 'Users', value: c.users, icon: 'people', color: 'purple' },
    { label: 'Children', value: c.children, icon: 'child_care', color: 'pink' },
    { label: 'Math Tests', value: c.mathAttempts, icon: 'calculate', color: 'orange' },
  ]
})

// Table columns
const rubricColumns = [
  { name: 'id', label: 'ID', field: 'id', sortable: true, align: 'left' as const },
  { name: 'original_filename', label: 'File', field: 'original_filename', sortable: true, align: 'left' as const },
  { name: 'module_name', label: 'Module', field: 'module_name', sortable: true, align: 'left' as const },
  { name: 'programme', label: 'Programme', field: 'programme', align: 'left' as const },
  { name: 'total_marks', label: 'Marks', field: 'total_marks', sortable: true, align: 'center' as const },
  { name: 'question_count', label: 'Questions', field: 'question_count', sortable: true, align: 'center' as const },
  { name: 'confirmed', label: 'Confirmed', field: 'confirmed', sortable: true, align: 'center' as const },
  { name: 'created_at', label: 'Created', field: 'created_at', sortable: true, align: 'left' as const, format: (v: string) => new Date(v).toLocaleDateString() },
  { name: 'actions', label: '', field: 'id', align: 'center' as const },
]

const paperColumns = [
  { name: 'id', label: 'ID', field: 'id', sortable: true, align: 'left' as const },
  { name: 'filename', label: 'File', field: 'filename', sortable: true, align: 'left' as const },
  { name: 'subject', label: 'Subject', field: 'subject', sortable: true, align: 'left' as const },
  { name: 'user_email', label: 'User', field: 'user_email', sortable: true, align: 'left' as const },
  { name: 'draft_or_final', label: 'Type', field: 'draft_or_final', sortable: true, align: 'center' as const },
  { name: 'word_count', label: 'Words', field: 'word_count', sortable: true, align: 'center' as const },
  { name: 'uploaded_at', label: 'Uploaded', field: 'uploaded_at', sortable: true, align: 'left' as const, format: (v: string) => new Date(v).toLocaleDateString() },
  { name: 'evaluations', label: 'Evals', field: 'evaluations', align: 'center' as const },
  { name: 'actions', label: '', field: 'id', align: 'center' as const },
]

const evalColumns = [
  { name: 'id', label: 'ID', field: 'id', sortable: true, align: 'left' as const },
  { name: 'filename', label: 'Paper', field: 'filename', sortable: true, align: 'left' as const },
  { name: 'subject', label: 'Subject', field: 'subject', sortable: true, align: 'left' as const },
  { name: 'user_email', label: 'User', field: 'user_email', sortable: true, align: 'left' as const },
  { name: 'mode', label: 'Mode', field: 'mode', sortable: true, align: 'center' as const },
  { name: 'overall_score', label: 'Score', field: 'overall_score', sortable: true, align: 'center' as const },
  { name: 'draft_or_final', label: 'Type', field: 'draft_or_final', sortable: true, align: 'center' as const },
  { name: 'created_at', label: 'Date', field: 'created_at', sortable: true, align: 'left' as const, format: (v: string) => new Date(v).toLocaleDateString() },
  { name: 'actions', label: '', field: 'id', align: 'center' as const },
]

const userColumns = [
  { name: 'id', label: 'ID', field: 'id', sortable: true, align: 'left' as const },
  { name: 'email', label: 'Email', field: 'email', sortable: true, align: 'left' as const },
  { name: 'name', label: 'Name', field: 'name', sortable: true, align: 'left' as const },
  { name: 'language', label: 'Lang', field: 'language', sortable: true, align: 'center' as const },
  { name: 'grade', label: 'Grade', field: 'grade', sortable: true, align: 'center' as const },
  { name: 'paper_count', label: 'Papers', field: 'paper_count', sortable: true, align: 'center' as const },
  { name: 'token_count', label: 'Tokens', field: 'token_count', sortable: true, align: 'center' as const },
  { name: 'created_at', label: 'Joined', field: 'created_at', sortable: true, align: 'left' as const, format: (v: string) => new Date(v).toLocaleDateString() },
]

async function loadAll() {
  loading.value = true
  errorMsg.value = ''
  try {
    const [statsRes, rubricsRes, papersRes, evalsRes, usersRes] = await Promise.all([
      backendApi.get('/admin/stats'),
      backendApi.get('/admin/rubrics'),
      backendApi.get('/admin/papers'),
      backendApi.get('/admin/evaluations'),
      backendApi.get('/admin/users'),
    ])
    stats.value = statsRes.data
    rubrics.value = rubricsRes.data.rubrics
    papers.value = papersRes.data.papers
    evaluations.value = evalsRes.data.evaluations
    users.value = usersRes.data.users
  } catch (err: any) {
    if (err?.response?.status === 403) {
      errorMsg.value = 'Access denied — admin role required (OWNER or ADMIN).'
    } else {
      errorMsg.value = err?.response?.data?.error || 'Failed to load admin data.'
    }
  } finally {
    loading.value = false
  }
}

async function viewRubric(id: number) {
  rubricDetail.value = null
  showRubricDetail.value = true
  try {
    const { data } = await backendApi.get(`/admin/rubrics/${id}`)
    rubricDetail.value = data
  } catch {
    rubricDetail.value = { error: 'Failed to load rubric' }
  }
}

async function viewPaper(id: number) {
  paperDetail.value = null
  showPaperDetail.value = true
  try {
    const { data } = await backendApi.get(`/admin/papers/${id}`)
    paperDetail.value = data
  } catch {
    paperDetail.value = { error: 'Failed to load paper' }
  }
}

async function viewEvaluation(id: number) {
  evalDetail.value = null
  showEvalDetail.value = true
  try {
    const { data } = await backendApi.get(`/admin/evaluations/${id}`)
    evalDetail.value = data
  } catch {
    evalDetail.value = { error: 'Failed to load evaluation' }
  }
}

const scoreCards = computed(() => {
  if (!evalDetail.value?.evaluation) return []
  const e = evalDetail.value.evaluation
  return [
    { label: 'Overall', value: e.overall_score },
    { label: 'Knowledge', value: e.knowledge_score },
    { label: 'Critical', value: e.critical_score },
    { label: 'Application', value: e.application_score },
    { label: 'Referencing', value: e.referencing_score },
    { label: 'Structure', value: e.structure_score },
    ...(e.ai_risk_score !== null ? [{ label: 'AI Risk', value: e.ai_risk_score }] : []),
  ]
})

onMounted(loadAll)
</script>

<style scoped>
.admin-table :deep(.q-table__top),
.admin-table :deep(.q-table__bottom) {
  background: transparent;
}
</style>
