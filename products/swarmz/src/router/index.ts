import { route } from 'quasar/wrappers';
import {
  createMemoryHistory,
  createRouter,
  createWebHashHistory,
  createWebHistory,
} from 'vue-router';
import routes from './routes';

export default route(function () {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : (process.env.VUE_ROUTER_MODE === 'history' ? createWebHistory : createWebHashHistory);

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,
    history: createHistory(process.env.VUE_ROUTER_BASE),
  });

  Router.beforeEach((to, _from, next) => {
    const isAuthenticated = !!localStorage.getItem('accessToken');
    const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
    const isAuthPage = to.name === 'login' || to.name === 'register';

    if (requiresAuth && !isAuthenticated) {
      next({ name: 'login' });
    } else if (isAuthPage && isAuthenticated) {
      next({ name: 'dashboard' });
    } else {
      next();
    }
  });

  return Router;
});
