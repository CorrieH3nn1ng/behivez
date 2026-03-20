import { route } from 'quasar/wrappers';
import { createRouter, createMemoryHistory, createWebHashHistory, createWebHistory } from 'vue-router';
import routes from './routes';
import { useUserStore } from '@/stores/user.store';

export default route(function (/* { store } */) {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : (process.env.VUE_ROUTER_MODE === 'history' ? createWebHistory : createWebHashHistory);

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,
    history: createHistory(process.env.VUE_ROUTER_BASE),
  });

  Router.beforeEach((to) => {
    const userStore = useUserStore();

    // Protected routes: redirect unauthenticated users to login
    if (to.matched.some(r => r.meta.requiresAuth) && !userStore.isAuthenticated) {
      return { path: '/login', query: { redirect: to.fullPath } };
    }

    // Force password change if flagged
    if (userStore.isAuthenticated && userStore.mustChangePassword && to.path !== '/change-password') {
      return '/change-password';
    }

    // Redirect authenticated users away from auth pages
    const authPages = ['/login', '/register', '/forgot-password', '/reset-password'];
    if (authPages.includes(to.path) && userStore.isAuthenticated) {
      return '/';
    }
  });

  return Router;
});
