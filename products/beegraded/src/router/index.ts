import { route } from 'quasar/wrappers'
import { createMemoryHistory, createRouter, createWebHashHistory, createWebHistory } from 'vue-router'
import routes from './routes'

export default route(function (/* { store, ssrContext } */) {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : (process.env.VUE_ROUTER_MODE === 'history' ? createWebHistory : createWebHashHistory)

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,
    history: createHistory(process.env.VUE_ROUTER_BASE),
  })

  Router.beforeEach(async (to, _from, next) => {
    // Auth guard for workspace routes
    if (to.meta.requiresAuth) {
      const token = localStorage.getItem('bg_access_token')
      if (!token) {
        next({ name: 'get-started', query: { redirect: to.fullPath } })
        return
      }
      // Check mustChangePassword
      const savedUser = localStorage.getItem('bg_user')
      if (savedUser) {
        try {
          const user = JSON.parse(savedUser)
          if (user.mustChangePassword && to.name !== 'change-password') {
            next({ name: 'change-password' })
            return
          }
        } catch { /* ignore */ }
      }
    }

    // Token validation guard for /t/ routes
    if (to.meta.requiresToken) {
      const tokenCode = to.params.tokenCode as string
      if (!tokenCode || tokenCode.length < 8) {
        next({ name: 'landing' })
        return
      }
    }

    next()
  })

  return Router
})
