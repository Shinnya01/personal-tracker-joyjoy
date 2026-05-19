import { createApp } from 'vue';
import { createPinia } from 'pinia';

import App from './App.vue';
import router from './router';
import './style.css';
import 'vue-sonner/style.css';

const app = createApp(App);

app.use(createPinia());
app.use(router);

const CHUNK_RELOAD_KEY = 'tracker:chunk-reload';

router.onError((error, to) => {
  const message = String((error as Error)?.message ?? error ?? '');
  const isChunkLoadIssue =
    message.includes('Failed to fetch dynamically imported module') ||
    message.includes('Importing a module script failed') ||
    message.includes('Loading chunk') ||
    message.includes('Unable to preload CSS');

  if (!isChunkLoadIssue) return;
  if (sessionStorage.getItem(CHUNK_RELOAD_KEY)) return;

  sessionStorage.setItem(CHUNK_RELOAD_KEY, '1');
  window.location.href = to.fullPath;
});

router.isReady().finally(() => {
  sessionStorage.removeItem(CHUNK_RELOAD_KEY);
});

app.mount('#app');
