import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    component: () => import('@/pages/LoginPage.vue'),
  },
  {
    path: '/register',
    component: () => import('@/pages/RegisterPage.vue'),
  },
  {
    path: '/sso',
    component: () => import('@/pages/SsoPage.vue'),
  },
  {
    path: '/forgot-password',
    component: () => import('@/pages/ForgotPasswordPage.vue'),
  },
  {
    path: '/reset-password',
    component: () => import('@/pages/ResetPasswordPage.vue'),
  },
  {
    path: '/change-password',
    component: () => import('@/pages/ChangePasswordPage.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', component: () => import('@/pages/DashboardPage.vue') },
      { path: 'income', component: () => import('@/pages/InvoicesPage.vue') },
      { path: 'income/new-invoice', component: () => import('@/pages/InvoiceEditPage.vue') },
      { path: 'income/:id/edit', component: () => import('@/pages/InvoiceEditPage.vue') },
      { path: 'income/:id', component: () => import('@/pages/InvoiceViewPage.vue') },
      { path: 'expenses', component: () => import('@/pages/VendorInvoicesPage.vue') },
      { path: 'clients', component: () => import('@/pages/ClientsPage.vue') },
      { path: 'travel', component: () => import('@/pages/TravelExpensesPage.vue') },
      { path: 'vehicle/:id', component: () => import('@/pages/VehicleDetailPage.vue'), props: true },
      { path: 'import', component: () => import('@/pages/ImportPage.vue') },
      { path: 'business-profile', component: () => import('@/pages/BusinessProfilePage.vue') },
      { path: 'salary-profile', component: () => import('@/pages/SalaryProfilePage.vue') },
      { path: 'settings', component: () => import('@/pages/SettingsPage.vue') },
    ],
  },
  {
    path: '/:catchAll(.*)*',
    component: () => import('@/pages/ErrorNotFound.vue'),
  },
];

export default routes;
