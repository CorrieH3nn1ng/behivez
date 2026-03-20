import { ref } from 'vue'
import { useApi } from './useApi'
import { useTokenStore, type ParsedRubric } from 'src/stores/token'

export function useRubric() {
  const { post, upload } = useApi()
  const tokenStore = useTokenStore()

  const uploading = ref(false)
  const uploadProgress = ref(0)
  const confirming = ref(false)

  async function uploadRubricPdf(file: File, tokenCode: string): Promise<ParsedRubric> {
    uploading.value = true
    uploadProgress.value = 0

    const formData = new FormData()
    formData.append('file', file)
    formData.append('token_code', tokenCode)

    try {
      const data = await upload<ParsedRubric>('/bg-rubric-upload', formData, (pct) => {
        uploadProgress.value = pct
      })
      // Update store with rubric data
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
      const data = await post<{ success: boolean }>('/bg-rubric-confirm', {
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
