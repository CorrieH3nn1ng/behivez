import { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/auth',
    component: () => import('layouts/AuthLayout.vue'),
    children: [
      { path: 'login', name: 'login', component: () => import('pages/LoginPage.vue') },
      { path: 'register', name: 'register', component: () => import('pages/RegisterPage.vue') },
    ],
  },
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', name: 'dashboard', component: () => import('pages/DashboardPage.vue') },
      { path: 'vehicle/add', name: 'add-vehicle', component: () => import('pages/AddVehiclePage.vue') },
      { path: 'vehicle/:id', name: 'vehicle-detail', props: true, component: () => import('pages/VehicleDetailPage.vue') },
      { path: 'vehicle/:id/status', name: 'status-change', props: true, component: () => import('pages/StatusChangePage.vue') },
      { path: 'vehicle/:id/receipts', name: 'receipt-archive', props: true, component: () => import('pages/ReceiptArchivePage.vue') },
      { path: 'vehicle/:id/expenses', name: 'expense-log', props: true, component: () => import('pages/ExpenseLogPage.vue') },
      { path: 'vehicle/:id/trips', name: 'trip-log', props: true, component: () => import('pages/TripLogPage.vue') },
      { path: 'tax-report', name: 'tax-report', component: () => import('pages/TaxReportPage.vue') },
      { path: 'drivers', name: 'drivers', component: () => import('pages/DriversPage.vue') },
      { path: 'profile', name: 'profile', component: () => import('pages/ProfilePage.vue') },
    ],
  },
  {
    path: '/:catchAll(.*)*',
    component: () => import('layouts/AuthLayout.vue'),
    children: [{ path: '', component: () => import('pages/ErrorNotFound.vue') }],
  },
];

export default routes;
