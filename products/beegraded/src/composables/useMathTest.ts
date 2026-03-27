import { backendApi } from 'src/boot/axios'

interface GenerateConfig {
  grade: number
  language: string
}

interface SubmitAttemptData {
  playerName: string
  answers: Array<{ questionIndex: number; givenAnswer: number }>
  timeUsedSec: number
}

export function useMathTest() {
  async function generateTest(config: GenerateConfig) {
    const { data } = await backendApi.post('/math-tests/generate', config)
    return data
  }

  async function getTemplate(id: number, showAnswers = false) {
    const { data } = await backendApi.get(`/math-tests/${id}`, {
      params: showAnswers ? { answers: 'true' } : {},
    })
    return data
  }

  async function submitAttempt(templateId: number, attemptData: SubmitAttemptData) {
    const { data } = await backendApi.post(`/math-tests/${templateId}/attempts`, attemptData)
    return data
  }

  async function getLeaderboard(grade = 4) {
    const { data } = await backendApi.get('/math-tests/leaderboard', {
      params: { grade },
    })
    return data
  }

  async function getTemplateLeaderboard(templateId: number) {
    const { data } = await backendApi.get(`/math-tests/${templateId}/leaderboard`)
    return data
  }

  async function getHistory(playerName?: string) {
    const { data } = await backendApi.get('/math-tests/history', {
      params: playerName ? { playerName } : {},
    })
    return data
  }

  async function getAttempt(templateId: number, attemptId: number) {
    const { data } = await backendApi.get(`/math-tests/${templateId}/attempt/${attemptId}`)
    return data
  }

  async function generateProblems(config: GenerateConfig) {
    const { data } = await backendApi.post('/math-tests/generate-problems', config)
    return data
  }

  async function deleteHistory(playerName?: string) {
    const { data } = await backendApi.delete('/math-tests/history', {
      params: playerName ? { playerName } : {},
    })
    return data
  }

  return {
    generateTest,
    generateProblems,
    getTemplate,
    submitAttempt,
    getLeaderboard,
    getTemplateLeaderboard,
    getHistory,
    getAttempt,
    deleteHistory,
  }
}
