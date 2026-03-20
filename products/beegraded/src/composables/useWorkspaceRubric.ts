import { ref } from 'vue'
import { useApi } from './useApi'
import { useEvalSessionStore } from 'src/stores/evaluation-session'
import type { ParsedRubric } from 'src/stores/token'

export function useWorkspaceRubric() {
  const { post, upload } = useApi()
  const evalSession = useEvalSessionStore()

  const uploading = ref(false)
  const uploadProgress = ref(0)
  const confirming = ref(false)

  async function uploadRubricPdf(file: File): Promise<ParsedRubric> {
    uploading.value = true
    uploadProgress.value = 0

    const formData = new FormData()
    formData.append('file', file)
    // No token_code — workspace mode

    try {
      const data = await upload<ParsedRubric>('/bg-rubric-upload', formData, (pct) => {
        uploadProgress.value = pct
      })
      // Store rubric in eval session
      if (data.id) {
        evalSession.update({
          rubric_id: data.id,
          rubric: data,
        })
      }
      return data
    } finally {
      uploading.value = false
    }
  }

  async function confirmRubric(rubricId: number): Promise<boolean> {
    confirming.value = true
    try {
      const data = await post<{ success: boolean }>('/bg-rubric-confirm', {
        rubric_id: rubricId,
        // No token_code — workspace mode
      })
      if (data.success) {
        evalSession.update({
          rubric_id: rubricId,
        })
        if (evalSession.session?.rubric) {
          evalSession.session.rubric.confirmed = true
        }
      }
      return data.success
    } finally {
      confirming.value = false
    }
  }

  return {
    uploading,
    uploadProgress,
    confirming,
    uploadRubricPdf,
    confirmRubric,
  }
}
