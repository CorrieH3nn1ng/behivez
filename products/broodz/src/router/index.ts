import { route } from 'quasar/wrappers'
import { createRouter, createMemoryHistory, createWebHistory, createWebHashHistory } from 'vue-router'
import routes from './routes'

export default route(function () {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : (process.env.VUE_ROUTER_MODE === 'history' ? createWebHistory : createWebHashHistory)

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,
    history: createHistory(process.env.VUE_ROUTER_BASE),
  })

  // Auth guard (client only — localStorage not available during SSR)
  if (process.env.CLIENT) {
    Router.beforeEach((to) => {
      if (to.meta.requiresAuth) {
        const token = localStorage.getItem('bz_access_token')
        if (!token) {
          return { name: 'login', query: { redirect: to.fullPath } }
        }
        // Check mustChangePassword
        const savedUser = localStorage.getItem('bz_user')
        if (savedUser) {
          try {
            const user = JSON.parse(savedUser)
            if (user.mustChangePassword && to.name !== 'change-password') {
              return { name: 'change-password' }
            }
          } catch { /* ignore */ }
        }
      }
    })
  }

  return Router
})
