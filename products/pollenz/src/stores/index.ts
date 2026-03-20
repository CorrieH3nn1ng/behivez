import { createPinia } from 'pinia';
import type { Router } from 'vue-router';

// Required by @quasar/app-vite
export default function (/* { router }: { router: Router } */) {
  return createPinia();
}
