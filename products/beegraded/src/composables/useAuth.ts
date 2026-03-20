import { useAuthStore } from 'src/stores/auth'
import { useRouter } from 'vue-router'

export function useAuth() {
  const store = useAuthStore()
  const router = useRouter()

  async function login(email: string, password: string) {
    return store.login(email, password)
  }

  async function logout() {
    await store.logout()
    router.push({ name: 'landing' })
  }

  return {
    user: store.user,
    isLoggedIn: store.isLoggedIn,
    login,
    logout,
  }
}
