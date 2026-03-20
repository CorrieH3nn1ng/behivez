import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  // Public routes (MainLayout)
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', name: 'landing', component: () => import('pages/LandingPage.vue') },
      { path: 'free-sample', name: 'free-sample', component: () => import('pages/FreeSamplePage.vue') },
      { path: 'free-sample/processing/:sampleId', name: 'free-sample-processing', component: () => import('pages/ProcessingPage.vue'), props: true },
      { path: 'free-sample/report/:sampleId', name: 'free-sample-report', component: () => import('pages/ReportPage.vue'), props: true },
      { path: 'buy-token', name: 'buy-token', component: () => import('pages/BuyTokenPage.vue') },
      { path: 'get-started', name: 'get-started', component: () => import('pages/GetStartedPage.vue') },
      { path: 'login', redirect: '/get-started' },
      { path: 'verify', redirect: '/get-started' },
      { path: 'change-password', name: 'change-password', component: () => import('pages/ChangePasswordPage.vue') },
      { path: 'forgot-password', name: 'forgot-password', component: () => import('pages/ForgotPasswordPage.vue') },
      { path: 'reset-password', name: 'reset-password', component: () => import('pages/ResetPasswordPage.vue') },
      { path: 'report', name: 'report', component: () => import('pages/ReportPage.vue') },
      { path: 'thank-you', name: 'thank-you', component: () => import('pages/ThankYouPage.vue') },
      { path: 'cancel', name: 'cancel', component: () => import('pages/CancelPage.vue') },
    ],
  },

  // Token-gated routes (TokenLayout, no auth, token code in URL)
  {
    path: '/t/:tokenCode',
    component: () => import('layouts/TokenLayout.vue'),
    meta: { requiresToken: true },
    children: [
      { path: '', name: 'token-hub', component: () => import('pages/TokenHubPage.vue'), props: true },
      { path: 'rubric', name: 'token-rubric', component: () => import('pages/TokenRubricUploadPage.vue'), props: true },
      { path: 'upload', name: 'token-upload', component: () => import('pages/TokenUploadPage.vue'), props: true },
      { path: 'processing/:paperId', name: 'token-processing', component: () => import('pages/ProcessingPage.vue'), props: true },
      { path: 'report/:evaluationId', name: 'token-report', component: () => import('pages/ReportPage.vue'), props: true },
      { path: 'final', name: 'token-final', component: () => import('pages/TokenUploadPage.vue'), props: (route) => ({ ...route.params, isFinal: true }) },
      { path: 'comparison/:draftId/:finalId', name: 'token-comparison', component: () => import('pages/ComparisonPage.vue'), props: true },
    ],
  },

  // Workspace routes (DashboardLayout, requiresAuth)
  {
    path: '/workspace',
    component: () => import('layouts/DashboardLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', name: 'workspace', component: () => import('pages/WorkspacePage.vue') },
      { path: 'new', name: 'workspace-new', component: () => import('pages/WorkspaceEvalPage.vue') },
      { path: 'new/rubric', name: 'workspace-new-rubric', component: () => import('pages/WorkspaceRubricUploadPage.vue') },
      { path: 'new/upload', name: 'workspace-new-upload', component: () => import('pages/WorkspacePaperUploadPage.vue') },
      { path: 'new/final', name: 'workspace-new-final', component: () => import('pages/WorkspacePaperUploadPage.vue'), props: { isFinal: true } },
      { path: 'processing/:paperId', name: 'workspace-processing', component: () => import('pages/ProcessingPage.vue'), props: true },
      { path: 'report/:evaluationId', name: 'workspace-report', component: () => import('pages/ReportPage.vue'), props: true },
      { path: 'comparison/:draftId/:finalId', name: 'workspace-comparison', component: () => import('pages/ComparisonPage.vue'), props: true },
      { path: 'tokens', name: 'workspace-tokens', component: () => import('pages/WorkspaceTokensPage.vue') },
      { path: 'account', name: 'workspace-account', component: () => import('pages/AccountPage.vue') },
      { path: 'upload', redirect: '/workspace/new/upload' },
      { path: 'upload/:paperId/final', redirect: '/workspace/new/final' },
      { path: 'rubric/:paperId', redirect: '/workspace/new/rubric' },
      { path: 'payment/:paperId', redirect: '/workspace/new' },
    ],
  },

  // Legacy redirects
  { path: '/quick-check', redirect: '/free-sample' },
  { path: '/dashboard', redirect: '/workspace' },
  { path: '/upload', redirect: '/workspace/new/upload' },
  { path: '/processing/:paperId', redirect: to => `/workspace/processing/${to.params.paperId}` },
  { path: '/report/:evaluationId', redirect: to => `/workspace/report/${to.params.evaluationId}` },
  { path: '/comparison/:draftId/:finalId', redirect: to => `/workspace/comparison/${to.params.draftId}/${to.params.finalId}` },

  // Catch-all
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
]

export default routes
