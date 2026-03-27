import { ref } from 'vue'
import { api, backendApi } from 'src/boot/axios'
import type { AxiosProgressEvent } from 'axios'

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
      const { data } = await backendApi.post<{ paper_id: number; word_count: number; page_count: number }>('/papers', formData, {
        onUploadProgress: (e: AxiosProgressEvent) => {
          if (e.total) uploadProgress.value = Math.round((e.loaded * 100) / e.total)
        },
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
    const { data } = await backendApi.get<{ evaluation: { report_html: string } }>(`/evaluations/${evaluationId}`)
    return { report_html: data.evaluation?.report_html || '' }
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

  async function getUserPapers() {
    const { data } = await backendApi.get<Paper[]>('/papers')
    return data
  }

  interface RubricWeights {
    knowledge_weight: number
    critical_weight: number
    application_weight: number
    referencing_weight: number
    structure_weight: number
  }

  async function saveRubric(paperId: number, weights: RubricWeights) {
    // TODO: add rubric weights endpoint if needed
    return { success: true }
  }

  async function getRubric(paperId: number) {
    // TODO: add rubric weights endpoint if needed
    return { knowledge_weight: 20, critical_weight: 20, application_weight: 20, referencing_weight: 20, structure_weight: 20 } as RubricWeights
  }

  async function getUserEvaluations() {
    const { data } = await backendApi.get<Evaluation[]>('/evaluations')
    return data
  }

  async function triggerEvaluation(paperId: number, mode: string, tokenCode?: string, rubricId?: number, draftOrFinal: 'draft' | 'final' = 'draft') {
    // 1. Create eval record in Express backend
    const { data: evalRecord } = await backendApi.post<{ evaluation_id: number; status: string }>('/evaluations', {
      paper_id: paperId, mode, draft_or_final: draftOrFinal,
    })

    // 2. Get paper data from Express
    const { data: paper } = await backendApi.get<{ paper_text: string; subject: string; assessment_type: string; num_questions: number }>(`/papers/${paperId}`)

    // 3. Build rubric context
    let rubricJson = null
    if (rubricId) {
      const { data: rubric } = await backendApi.get<{ questions: unknown[]; [k: string]: unknown }>(`/rubrics/${rubricId}`)
      rubricJson = rubric
    }

    // 4. Call n8n for AI evaluation (NO DB access)
    const { data: aiResult } = await api.post<{
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
      error?: string
    }>('/bg-evaluate', {
      paper_text: paper.paper_text,
      subject: paper.subject,
      assessment_type: paper.assessment_type,
      mode,
      num_questions: String(paper.num_questions || 4),
      rubric_json: rubricJson,
    }, { timeout: 300000 })

    if (aiResult.error) {
      throw new Error(aiResult.error)
    }

    // 5. Save AI results to Express backend DB
    await backendApi.post(`/evaluations/${evalRecord.evaluation_id}/complete`, aiResult)

    return { evaluation_id: evalRecord.evaluation_id, status: 'complete' }
  }

  async function requestComparison(draftEvalId: number, finalPaperId: number) {
    const { data } = await backendApi.post<{ comparison_id: number }>('/comparisons', {
      draft_eval_id: draftEvalId,
      final_paper_id: finalPaperId,
    })
    return data
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
        // Don't stop on error
      }
    }, intervalMs)
    return () => clearInterval(timer)
  }

  function pollStatusByPaper(paperId: number, onUpdate: (status: EvaluationStatus) => void, intervalMs = 5000) {
    const timer = setInterval(async () => {
      try {
        const { data } = await backendApi.get<EvaluationStatus>(`/papers/${paperId}/latest-eval`)
        onUpdate(data)
        if (data.status === 'complete' || data.status === 'failed') {
          clearInterval(timer)
        }
      } catch {
        // Evaluation doesn't exist yet
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
      // Call n8n for AI evaluation (file upload + AI, no DB)
      const { data } = await api.post<{ report_html: string; error?: string }>('/bg-quick-evaluate', formData, {
        timeout: 300000,
        onUploadProgress: (e: AxiosProgressEvent) => {
          if (e.total) uploadProgress.value = Math.round((e.loaded * 100) / e.total)
        },
      })
      if (data.error) throw new Error(data.error)
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
