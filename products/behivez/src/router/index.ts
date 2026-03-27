import { route } from 'quasar/wrappers'
import { createMemoryHistory, createRouter, createWebHashHistory, createWebHistory } from 'vue-router'
import { Notify } from 'quasar'

const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('pages/LandingPage.vue') },
      { path: 'pricing', component: () => import('pages/PricingPage.vue') },
      { path: 'login', component: () => import('pages/LoginPage.vue') },
      { path: 'register', component: () => import('pages/RegisterPage.vue') },
      { path: 'payment/success', component: () => import('pages/PaymentSuccessPage.vue') },
      { path: 'payment/cancel', component: () => import('pages/PaymentCancelPage.vue') },
    ],
  },
  {
    path: '/my',
    component: () => import('layouts/UserLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: 'subscriptions', component: () => import('pages/MySubscriptionsPage.vue') },
      { path: 'content-creator', component: () => import('pages/ContentCreatorPage.vue') },
      { path: 'content-drafts', component: () => import('pages/ContentDraftsPage.vue') },
    ],
  },
  {
    path: '/admin/login',
    component: () => import('pages/admin/LoginPage.vue'),
  },
  {
    path: '/admin',
    component: () => import('layouts/AdminLayout.vue'),
    meta: { requiresAdmin: true },
    children: [
      { path: '', redirect: '/admin/dashboard' },
      { path: 'dashboard', component: () => import('pages/admin/DashboardPage.vue') },
      { path: 'users', component: () => import('pages/admin/UsersPage.vue') },
      { path: 'users/:id', component: () => import('pages/admin/UserDetailPage.vue') },
      { path: 'revenue', component: () => import('pages/admin/RevenuePage.vue') },
      { path: 'health', component: () => import('pages/admin/HealthPage.vue') },
    ],
  },
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
]

export default route(function () {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : (process.env.VUE_ROUTER_MODE === 'history' ? createWebHistory : createWebHashHistory)

  const router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,
    history: createHistory(process.env.VUE_ROUTER_BASE),
  })

  router.beforeEach((to) => {
    const token = localStorage.getItem('bh_access_token')

    // /my/* routes require any authenticated user
    if (to.matched.some((r) => r.meta.requiresAuth)) {
      if (!token) {
        return { path: '/login', query: { redirect: to.fullPath } }
      }
    }

    // /admin/* routes require OWNER or ADMIN role
    if (to.path.startsWith('/admin') && to.path !== '/admin/login') {
      if (!token) {
        return '/admin/login'
      }
      try {
        const userData = localStorage.getItem('bh_user')
        if (userData) {
          const user = JSON.parse(userData)
          if (user.role !== 'OWNER' && user.role !== 'ADMIN') {
            Notify.create({ type: 'negative', message: 'Access denied — admin privileges required' })
            return '/'
          }
        }
      } catch { /* proceed */ }
    }
  })

  return router
})
