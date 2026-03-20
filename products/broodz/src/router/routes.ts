import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  // Public routes (PublicLayout)
  {
    path: '/',
    component: () => import('layouts/PublicLayout.vue'),
    children: [
      { path: '', name: 'landing', component: () => import('pages/LandingPage.vue') },
      { path: 'category/:slug', name: 'category', component: () => import('pages/CategoryPage.vue'), props: true },
      { path: 'login', name: 'login', component: () => import('pages/LoginPage.vue') },
      { path: 'forgot-password', name: 'forgot-password', component: () => import('pages/ForgotPasswordPage.vue') },
      { path: 'reset-password', name: 'reset-password', component: () => import('pages/ResetPasswordPage.vue') },
      { path: 'change-password', name: 'change-password', component: () => import('pages/ChangePasswordPage.vue'), meta: { requiresAuth: true } },
      // Gallery MUST be before the :slug catch-all
      { path: ':slug/gallery', name: 'talent-gallery', component: () => import('pages/TalentGalleryPage.vue'), props: true },
      // Slug catch-all MUST be last in this group
      { path: ':slug', name: 'talent-profile', component: () => import('pages/TalentProfilePage.vue'), props: true },
    ],
  },

  // Dashboard routes (DashboardLayout, requiresAuth)
  {
    path: '/dashboard',
    component: () => import('layouts/DashboardLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', name: 'dashboard', component: () => import('pages/DashboardHome.vue') },
      { path: 'profile', name: 'dashboard-profile', component: () => import('pages/ProfileEditorPage.vue') },
      { path: 'services', name: 'dashboard-services', component: () => import('pages/ServicesEditorPage.vue') },
      { path: 'portfolio', name: 'dashboard-portfolio', component: () => import('pages/PortfolioEditorPage.vue') },
      { path: 'shop', name: 'dashboard-shop', component: () => import('pages/ShopEditorPage.vue') },
      { path: 'enquiries', name: 'dashboard-enquiries', component: () => import('pages/EnquiriesPage.vue') },
      { path: 'account', name: 'dashboard-account', component: () => import('pages/AccountPage.vue') },
    ],
  },

  // Catch-all
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
]

export default routes
