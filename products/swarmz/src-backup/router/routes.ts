import { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    component: () => import('layouts/AuthLayout.vue'),
    children: [
      {
        path: '',
        name: 'login',
        component: () => import('pages/LoginPage.vue'),
      },
    ],
  },
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'dashboard',
        component: () => import('pages/DashboardPage.vue'),
      },
      {
        path: 'vehicles',
        name: 'vehicles',
        component: () => import('pages/VehiclesPage.vue'),
      },
      {
        path: 'vehicles/:id',
        name: 'vehicle-details',
        component: () => import('pages/VehicleDetailsPage.vue'),
      },
      {
        path: 'checkout',
        name: 'checkout',
        component: () => import('pages/CheckoutPage.vue'),
      },
      {
        path: 'checkout/:bookingRef',
        name: 'checkout-process',
        component: () => import('pages/CheckoutProcessPage.vue'),
      },
      {
        path: 'return',
        name: 'return',
        component: () => import('pages/ReturnPage.vue'),
      },
      {
        path: 'return/:rentalId',
        name: 'return-process',
        component: () => import('pages/ReturnProcessPage.vue'),
      },
      {
        path: 'status-board',
        name: 'status-board',
        component: () => import('pages/StatusBoardPage.vue'),
      },
      {
        path: 'walk-in',
        name: 'walk-in',
        component: () => import('pages/WalkInLogPage.vue'),
      },
      {
        path: 'rentals',
        name: 'rentals',
        component: () => import('pages/RentalsPage.vue'),
      },
      {
        path: 'rentals/:id',
        name: 'rental-details',
        component: () => import('pages/RentalDetailsPage.vue'),
      },
      {
        path: 'reports',
        name: 'reports',
        component: () => import('pages/ReportsPage.vue'),
      },
    ],
  },
  {
    path: '/:catchAll(.*)*',
    component: () => import('layouts/AuthLayout.vue'),
    children: [
      {
        path: '',
        component: () => import('pages/ErrorNotFound.vue'),
      },
    ],
  },
];

export default routes;
