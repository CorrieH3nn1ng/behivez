import { backendApi } from 'src/boot/axios'

interface AddChildData {
  name: string
  birthdate: string
  grade: number
  language: string
}

export function useChildren() {
  async function acceptConsent() {
    const { data } = await backendApi.post('/children/consent')
    return data
  }

  async function checkConsent() {
    const { data } = await backendApi.get('/children/consent')
    return data
  }

  async function listChildren() {
    const { data } = await backendApi.get('/children')
    return data
  }

  async function addChild(child: AddChildData) {
    const { data } = await backendApi.post('/children', child)
    return data
  }

  async function updateChild(id: number, updates: Partial<AddChildData>) {
    const { data } = await backendApi.patch(`/children/${id}`, updates)
    return data
  }

  async function removeChild(id: number) {
    const { data } = await backendApi.delete(`/children/${id}`)
    return data
  }

  async function getChildBySlug(slug: string) {
    const { data } = await backendApi.get(`/children/play/${slug}`)
    return data
  }

  async function getChildProgress(id: number) {
    const { data } = await backendApi.get(`/children/${id}/progress`)
    return data
  }

  async function deleteAttempt(childId: number, attemptId: number) {
    const { data } = await backendApi.delete(`/children/${childId}/attempts/${attemptId}`)
    return data
  }

  async function listSubjects() {
    const { data } = await backendApi.get('/children/subjects')
    return data
  }

  return {
    acceptConsent,
    checkConsent,
    listChildren,
    addChild,
    updateChild,
    removeChild,
    getChildBySlug,
    getChildProgress,
    deleteAttempt,
    listSubjects,
  }
}
