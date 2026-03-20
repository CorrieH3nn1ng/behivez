import { ref } from 'vue'
import { backendApi } from 'src/boot/axios'
import { useApi } from './useApi'

interface EvaluationStatus {
  id: number
  status: 'pending' | 'processing' | 'complete' | 'failed'
  progress?: number
}

interface Evaluation {
  id: number
  paper_id: number
  mode: 'A' | 'B'
  draft_or_final: 'draft' | 'final'
  overall_score: number
  knowledge_score: number
  critical_score: number
  application_score: number
  referencing_score: number
  structure_score: number
  ai_risk_score: number | null
  report_html: string
  created_at: string
}

interface Paper {
  id: number
  filename: string
  subject: string
  assessment_type: string
  word_count: number
  uploaded_at: string
  imported_from_token?: boolean
  evaluations: Evaluation[]
}

export function useEvaluation() {
  const { get, post, upload } = useApi()
  const uploading = ref(false)
  const uploadProgress = ref(0)

  async function uploadPaper(
    file: File,
    subject: string,
    assessmentType: string,
    numQuestions: number,
    draftOrFinal: 'draft' | 'final' = 'draft',
    linkedPaperId?: number,
    tokenCode?: string,
  ) {
    uploading.value = true
    uploadProgress.value = 0

    const formData = new FormData()
    formData.append('file', file)
    formData.append('subject', subject)
    formData.append('assessment_type', assessmentType)
    formData.append('num_questions', String(numQuestions))
    formData.append('draft_or_final', draftOrFinal)
    if (linkedPaperId) formData.append('linked_paper_id', String(linkedPaperId))
    if (tokenCode) formData.append('token_code', tokenCode)

    try {
      const data = await upload<{ paper_id: number }>('/bg-papers-upload', formData, (pct) => {
        uploadProgress.value = pct
      })
      return data
    } finally {
      uploading.value = false
    }
  }

  async function getStatus(evaluationId: number) {
    const { data } = await backendApi.get<EvaluationStatus>(`/evaluations/${evaluationId}/status`)
    return data
  }

  async function getReport(evaluationId: number) {
    return get<{ report_html: string }>(`/bg-evaluations-report?id=${evaluationId}`)
  }

  interface EvaluationDetail {
    evaluation: {
      id: number
      paper_id: number
      mode: string
      draft_or_final: string
      overall_score: number
      knowledge_score: number
      critical_score: number
      application_score: number
      referencing_score: number
      structure_score: number
      ai_risk_score: number | null
      created_at: string
      filename: string
      subject: string
      assessment_type: string
      word_count: number
      page_count: number
      programme: string | null
      module_name: string | null
      total_marks: number | null
    } | null
    issues: Array<{
      id: number
      category: string
      severity: 'critical' | 'important' | 'polish'
      what_issue: string | null
      where_in_paper: string | null
      why_chain: string[] | null
      root_cause: string | null
      how_to_fix: string | null
      who_notices: string | null
      description: string
      recommendation: string | null
      example_before: string | null
      example_after: string | null
      fixed_in_final: boolean | null
    }>
    strengths: Array<{
      id: number
      category: string
      what_well: string
      where_in_paper: string | null
      why_chain: string[] | null
      reusable_pattern: string | null
      how_it_helps: string | null
      who_notices: string | null
    }>
    references: Array<{
      id: number
      citation: string
      source_type: 'in_text' | 'bibliography'
      matched: boolean
      issue_type: string | null
    }>
    consistency: Array<{
      id: number
      check_type: string
      status: string
      detail: string
    }>
  }

  async function getEvaluationDetail(evaluationId: number) {
    const { data } = await backendApi.get<EvaluationDetail>(`/evaluations/${evaluationId}`)
    return data
  }

  async function getUserPapers(userId?: number) {
    const url = userId ? `/bg-user-papers?user_id=${userId}` : '/bg-user-papers'
    return get<Paper[]>(url)
  }

  interface RubricWeights {
    knowledge_weight: number
    critical_weight: number
    application_weight: number
    referencing_weight: number
    structure_weight: number
  }

  async function saveRubric(paperId: number, weights: RubricWeights) {
    return post<{ success: boolean }>('/bg-rubric-save', { paper_id: paperId, ...weights })
  }

  async function getRubric(paperId: number) {
    return get<RubricWeights>(`/bg-rubric-get?paper_id=${paperId}`)
  }

  async function getUserEvaluations() {
    return get<Evaluation[]>('/bg-user-evaluations')
  }

  async function triggerEvaluation(paperId: number, mode: string, tokenCode?: string, rubricId?: number, draftOrFinal: 'draft' | 'final' = 'draft') {
    // 1. Create eval record in backend (score=0, status=processing)
    const { data: evalRecord } = await backendApi.post<{ evaluation_id: number; status: string }>('/evaluations', {
      paper_id: paperId, mode, draft_or_final: draftOrFinal,
    })

    // 2. Call n8n for AI processing — AWAIT the response (n8n returns JSON, no DB writes)
    const payload: Record<string, unknown> = {
      paper_id: paperId, mode, draft_or_final: draftOrFinal,
    }
    if (tokenCode) payload.token_code = tokenCode
    if (rubricId) payload.rubric_id = rubricId

    const aiResult = await post<{
      status: string
      overall_score: number
      knowledge_score: number
      critical_score: number
      application_score: number
      referencing_score: number
      structure_score: number
      ai_risk_score: number | null
      report_html: string
      issues: unknown[]
      strengths: unknown[]
      references: unknown[]
      consistency: unknown[]
    }>('/bg-evaluate', payload)

    // 3. Save AI results to backend DB
    await backendApi.post(`/evaluations/${evalRecord.evaluation_id}/complete`, aiResult)

    return { evaluation_id: evalRecord.evaluation_id, status: 'complete' }
  }

  async function requestComparison(draftEvalId: number, finalPaperId: number) {
    return post<{ comparison_id: number }>('/bg-papers-compare', {
      draft_eval_id: draftEvalId,
      final_paper_id: finalPaperId,
    })
  }

  function pollStatus(evaluationId: number, onUpdate: (status: EvaluationStatus) => void, intervalMs = 3000) {
    const timer = setInterval(async () => {
      try {
        const status = await getStatus(evaluationId)
        onUpdate(status)
        if (status.status === 'complete' || status.status === 'failed') {
          clearInterval(timer)
        }
      } catch {
        // Don't stop on error — evaluation might not exist yet
      }
    }, intervalMs)

    return () => clearInterval(timer)
  }

  // Poll by paper_id — checks if n8n has finished creating the evaluation
  function pollStatusByPaper(paperId: number, onUpdate: (status: EvaluationStatus) => void, intervalMs = 5000) {
    const timer = setInterval(async () => {
      try {
        const { data } = await backendApi.get<EvaluationStatus>(`/papers/${paperId}/latest-eval`)
        onUpdate(data)
        if (data.status === 'complete' || data.status === 'failed') {
          clearInterval(timer)
        }
      } catch {
        // Evaluation doesn't exist yet — n8n is still working
      }
    }, intervalMs)

    return () => clearInterval(timer)
  }

  const evaluating = ref(false)

  async function quickEvaluate(file: File, subject: string, assessmentType: string, numQuestions: number, mode: string) {
    evaluating.value = true
    uploadProgress.value = 0

    const formData = new FormData()
    formData.append('file', file)
    formData.append('subject', subject)
    formData.append('assessment_type', assessmentType)
    formData.append('num_questions', String(numQuestions))
    formData.append('mode', mode)

    try {
      const data = await upload<{ report_html: string }>('/bg-quick-evaluate', formData, (pct) => {
        uploadProgress.value = pct
      })
      return data
    } finally {
      evaluating.value = false
    }
  }

  return {
    uploading,
    uploadProgress,
    evaluating,
    uploadPaper,
    quickEvaluate,
    getStatus,
    getReport,
    getUserPapers,
    getUserEvaluations,
    triggerEvaluation,
    getEvaluationDetail,
    requestComparison,
    pollStatus,
    pollStatusByPaper,
    saveRubric,
    getRubric,
  }
}
