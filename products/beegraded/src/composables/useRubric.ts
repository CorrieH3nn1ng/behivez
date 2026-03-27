import { ref } from 'vue'
import { api, backendApi } from 'src/boot/axios'
import { useTokenStore, type ParsedRubric } from 'src/stores/token'
import type { AxiosProgressEvent } from 'axios'

export function useRubric() {
  const tokenStore = useTokenStore()

  const uploading = ref(false)
  const uploadProgress = ref(0)
  const confirming = ref(false)

  async function uploadRubricPdf(file: File, tokenCode: string): Promise<ParsedRubric> {
    uploading.value = true
    uploadProgress.value = 0

    const formData = new FormData()
    formData.append('file', file)

    try {
      // 1. Call n8n for AI rubric parsing (no DB access)
      const { data: parsed } = await api.post<ParsedRubric & { error?: string }>('/bg-rubric-parse', formData, {
        timeout: 120000,
        onUploadProgress: (e: AxiosProgressEvent) => {
          if (e.total) uploadProgress.value = Math.round((e.loaded * 100) / e.total)
        },
      })

      if (parsed.error) throw new Error(parsed.error)

      // 2. Save parsed rubric to Express backend DB
      const { data } = await backendApi.post<ParsedRubric>('/rubrics', {
        token_code: tokenCode,
        original_filename: file.name,
        parsed_json: parsed,
      })

      if (data.id) {
        tokenStore.updateTokenData({
          rubric_id: data.id,
          rubric: data,
        })
      }
      return data
    } finally {
      uploading.value = false
    }
  }

  async function confirmRubric(rubricId: number, tokenCode: string): Promise<boolean> {
    confirming.value = true
    try {
      const { data } = await backendApi.post<{ success: boolean }>('/rubrics/confirm', {
        rubric_id: rubricId,
        token_code: tokenCode,
      })
      if (data.success) {
        tokenStore.updateStatus('rubric_uploaded')
        if (tokenStore.tokenData?.rubric) {
          tokenStore.tokenData.rubric.confirmed = true
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
