import { route } from 'quasar/wrappers';
import {
  createMemoryHistory,
  createRouter,
  createWebHashHistory,
  createWebHistory,
} from 'vue-router';
import routes from './routes';
import { useSettingsStore } from 'stores/settings';

export default route(function () {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : (process.env.VUE_ROUTER_MODE === 'history' ? createWebHistory : createWebHashHistory);

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,
    history: createHistory(process.env.VUE_ROUTER_BASE),
  });

  Router.beforeEach(async (to, _from, next) => {
    const isAuthenticated = !!localStorage.getItem('sz_access_token');
    const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
    const isAuthPage = to.name === 'login' || to.name === 'register';
    const settings = useSettingsStore();

    if (isAuthPage) {
      // Reset so the next login re-fetches the right user's settings
      settings.$reset();
    }

    if (requiresAuth && !isAuthenticated) {
      return next({ name: 'login' });
    }
    if (isAuthPage && isAuthenticated) {
      return next({ name: 'dashboard' });
    }
    if (!requiresAuth) {
      return next();
    }

    // Authenticated area — make sure onboarding is done before anything else
    if (!settings.loaded) {
      try {
        await settings.fetch();
      } catch {
        // On failure, let them through rather than trapping them
      }
    }
    if (!settings.onboarded && to.name !== 'onboarding') {
      return next({ name: 'onboarding' });
    }
    if (settings.onboarded && to.name === 'onboarding') {
      return next({ name: 'dashboard' });
    }
    next();
  });

  return Router;
});
