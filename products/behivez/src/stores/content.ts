import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'

export interface TrendingTopic {
  title: string
  description: string
}

export interface ContentDraft {
  id?: string
  topic: string
  insight?: string
  message?: string
  caption?: string
  hashtags?: string[]
  imageData?: string
  style: string
  status: string
  createdAt?: string
}

export interface GeneratedContent {
  message: string
  insight: string
  caption: string
  hashtags: string[]
  imageSvg?: string
  imageBase64?: string
}

// n8n webhook base — uses the same domain, proxied by nginx
const N8N_BASE = '/webhook'

export const useContentStore = defineStore('content', () => {
  const topics = ref<TrendingTopic[]>([])
  const drafts = ref<ContentDraft[]>([])
  const currentResult = ref<GeneratedContent | null>(null)
  const loading = ref(false)
  const generating = ref(false)

  async function fetchTrending(category?: string) {
    loading.value = true
    try {
      const params = category ? `?category=${category}` : ''
      const { data } = await axios.get(`${N8N_BASE}/bh-content-trending${params}`)
      topics.value = Array.isArray(data) ? data : data.topics || []
    } finally {
      loading.value = false
    }
  }

  async function generateContent(topic: string, style: string): Promise<GeneratedContent> {
    generating.value = true
    try {
      const { data } = await axios.post(`${N8N_BASE}/bh-content-create`, { topic, style }, { timeout: 60000 })
      currentResult.value = data
      return data
    } finally {
      generating.value = false
    }
  }

  async function saveDraft(draft: Partial<ContentDraft>): Promise<ContentDraft> {
    const { data } = await axios.post('/content/drafts', draft)
    drafts.value.unshift(data)
    return data
  }

  async function loadDrafts() {
    loading.value = true
    try {
      const { data } = await axios.get('/content/drafts')
      drafts.value = data
    } finally {
      loading.value = false
    }
  }

  async function deleteDraft(id: string) {
    await axios.delete(`/content/drafts/${id}`)
    drafts.value = drafts.value.filter(d => d.id !== id)
  }

  return {
    topics,
    drafts,
    currentResult,
    loading,
    generating,
    fetchTrending,
    generateContent,
    saveDraft,
    loadDrafts,
    deleteDraft,
  }
})
