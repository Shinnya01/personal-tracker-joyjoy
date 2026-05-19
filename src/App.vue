<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { Toaster } from 'vue-sonner';
import AppLockGate from './components/common/AppLockGate.vue';
import ConfirmDialog from './components/common/ConfirmDialog.vue';
import ReminderAlertDialog from './components/common/ReminderAlertDialog.vue';
import { useReminders } from './composables/useReminders';
import { useInteractionRecovery } from './composables/useInteractionRecovery';
import { useTrackerStore } from './stores/trackerStore';
import { useSettingsStore } from './stores/settingsStore';
import { useAuthStore } from './stores/authStore';
import { useUiStore } from './stores/uiStore';
import { syncService } from './services/syncService';

const settingsStore = useSettingsStore();
const trackerStore = useTrackerStore();
const authStore = useAuthStore();
const uiStore = useUiStore();
const APP_VERSION_KEY = 'tracker:last-seen-app-version';
const APP_VERSION = __APP_VERSION__;
const LOADING_IMAGE_SRC = '/loading-avatar.png';
const loadingImageSrc = ref(LOADING_IMAGE_SRC);
const isAppBooting = ref(true);
const loadingDots = ref(1);
let loadingDotsTimer: number | undefined;
const isPullRefreshing = ref(false);
const pullStartY = ref<number | null>(null);
const pullDistance = ref(0);
const didPullTrigger = ref(false);
const lastPullRefreshAt = ref(0);
const PULL_REFRESH_THRESHOLD = 120;
const PULL_REFRESH_COOLDOWN_MS = 1200;
const pullIndicatorVisible = computed(() => pullDistance.value > 0 || isPullRefreshing.value);
const pullIndicatorText = computed(() => {
  if (isPullRefreshing.value) return 'Loading...';
  return pullDistance.value >= PULL_REFRESH_THRESHOLD ? 'Release to refresh' : 'Pull to refresh';
});
const pullIndicatorProgress = computed(() => Math.max(0, Math.min(1, pullDistance.value / PULL_REFRESH_THRESHOLD)));

const { runCheck: runReminderCheck } = useReminders();
useInteractionRecovery();

onMounted(async () => {
  loadingDotsTimer = window.setInterval(() => {
    loadingDots.value = loadingDots.value >= 3 ? 1 : loadingDots.value + 1;
  }, 450);

  try {
    const lastSeenVersion = localStorage.getItem(APP_VERSION_KEY);
    if (lastSeenVersion !== APP_VERSION) {
      uiStore.pushToast({
        tone: 'success',
        text: lastSeenVersion ? `App updated to ${APP_VERSION}` : `Running app version ${APP_VERSION}`,
      });
      localStorage.setItem(APP_VERSION_KEY, APP_VERSION);
    }

    await authStore.init();
    await settingsStore.load();
    if (authStore.isLoggedIn && navigator.onLine) {
      await syncService.syncNow();
      await trackerStore.refresh(true);
    }
  } finally {
    isAppBooting.value = false;
  }
  window.addEventListener('online', onOnlineSync);
  window.addEventListener('touchstart', onPullStart, { passive: true });
  window.addEventListener('touchmove', onPullMove, { passive: true });
  window.addEventListener('touchend', onPullEnd, { passive: true });
  window.addEventListener('touchcancel', onPullEnd, { passive: true });
});

watch(
  () => authStore.isLoggedIn,
  async (loggedIn) => {
    if (!loggedIn) {
      uiStore.closeAllReminderAlerts();
      return;
    }
    await runReminderCheck();
    if (!navigator.onLine) return;
    await syncService.syncNow();
    await trackerStore.refresh(true);
  },
);

onBeforeUnmount(() => {
  if (loadingDotsTimer) window.clearInterval(loadingDotsTimer);
  window.removeEventListener('online', onOnlineSync);
  window.removeEventListener('touchstart', onPullStart);
  window.removeEventListener('touchmove', onPullMove);
  window.removeEventListener('touchend', onPullEnd);
  window.removeEventListener('touchcancel', onPullEnd);
});

const onOnlineSync = async () => {
  if (!authStore.isLoggedIn) return;
  await syncService.syncNow();
  await trackerStore.refresh(true);
};

const runPullRefresh = async () => {
  if (isPullRefreshing.value) return;
  isPullRefreshing.value = true;
  try {
    if (authStore.isLoggedIn && navigator.onLine) {
      await syncService.syncNow();
    }
    await trackerStore.refresh(true);
  } finally {
    isPullRefreshing.value = false;
  }
};

const onPullStart = (event: TouchEvent) => {
  if (event.touches.length !== 1) return;
  if (window.scrollY > 0) return;
  pullStartY.value = event.touches[0]?.clientY ?? null;
  pullDistance.value = 0;
  didPullTrigger.value = false;
};

const onPullMove = (event: TouchEvent) => {
  if (pullStartY.value === null || didPullTrigger.value) return;
  const currentY = event.touches[0]?.clientY ?? pullStartY.value;
  const distance = currentY - pullStartY.value;
  if (distance <= 0) return;
  pullDistance.value = distance;
};

const onPullEnd = async () => {
  if (pullStartY.value === null) return;
  const now = Date.now();
  const reachedThreshold = pullDistance.value >= PULL_REFRESH_THRESHOLD;
  const cooldownReady = now - lastPullRefreshAt.value >= PULL_REFRESH_COOLDOWN_MS;
  if (reachedThreshold && cooldownReady) {
    didPullTrigger.value = true;
    lastPullRefreshAt.value = now;
    await runPullRefresh();
  }
  pullStartY.value = null;
  pullDistance.value = 0;
  didPullTrigger.value = false;
};

const onLoadingImageError = () => {
  if (loadingImageSrc.value.endsWith('.png')) {
    loadingImageSrc.value = '/loading-avatar.jpg';
  }
};
</script>

<template>
  <div
    v-if="isAppBooting"
    class="fixed inset-0 z-[300] grid place-items-center"
    style="background:
      radial-gradient(circle at 12% -18%, rgba(228, 114, 166, 0.28), transparent 48%),
      radial-gradient(circle at 88% 8%, rgba(228, 114, 166, 0.16), transparent 42%),
      radial-gradient(circle at 50% 100%, rgba(228, 114, 166, 0.09), transparent 52%),
      linear-gradient(180deg, #0f141c 0%, #0d1117 65%);"
  >
    <div class="dialog grid place-items-center gap-3 py-7">
      <img
        :src="loadingImageSrc"
        alt="Loading"
        class="h-20 w-20 animate-spin rounded-full object-cover"
        @error="onLoadingImageError"
      />
      <p class="text-sm font-semibold text-slate-700">Loading{{ '.'.repeat(loadingDots) }}</p>
    </div>
  </div>
  <template v-else>
    <AppLockGate />
    <ConfirmDialog />
    <ReminderAlertDialog v-if="authStore.isLoggedIn" />
    <Toaster rich-colors position="bottom-right" />
    <div
      v-show="pullIndicatorVisible"
      class="pointer-events-none fixed left-1/2 z-[120] -translate-x-1/2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-xs font-semibold text-slate-600 shadow-[var(--shadow-soft)] transition-all duration-150"
      :style="{ top: `${Math.min(16 + pullDistance * 0.22, 52)}px`, opacity: isPullRefreshing ? 1 : Math.max(0.35, pullIndicatorProgress) }"
    >
      {{ pullIndicatorText }}
    </div>
  </template>
</template>
