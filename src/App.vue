<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { Toaster } from 'vue-sonner';
import AppLockGate from './components/common/AppLockGate.vue';
import ConfirmDialog from './components/common/ConfirmDialog.vue';
import ReminderAlertDialog from './components/common/ReminderAlertDialog.vue';
import Card from './components/ui/Card.vue';
import Button from './components/ui/Button.vue';
import Input from './components/ui/Input.vue';
import { useReminders } from './composables/useReminders';
import { useInteractionRecovery } from './composables/useInteractionRecovery';
import { acquireGlobalScrollLock, releaseGlobalScrollLock } from './composables/useGlobalScrollLock';
import { useTrackerStore } from './stores/trackerStore';
import { useSettingsStore } from './stores/settingsStore';
import { useAuthStore } from './stores/authStore';
import { useUiStore } from './stores/uiStore';
import { syncService } from './services/syncService';

const settingsStore = useSettingsStore();
const trackerStore = useTrackerStore();
const authStore = useAuthStore();
const uiStore = useUiStore();
const displayNameInput = ref('');
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

const deriveDisplayNameFromAuth = () => {
  const email = authStore.user?.email?.trim().toLowerCase() ?? '';
  if (!email) return '';
  return email.split('@')[0] ?? '';
};

const ensureDisplayNameFromAuth = async () => {
  if (!authStore.isLoggedIn || !settingsStore.isLoaded) return;
  if (settingsStore.settings.displayName?.trim()) return;
  const derived = deriveDisplayNameFromAuth().trim();
  if (!derived) return;
  await settingsStore.persist({ ...settingsStore.settings, displayName: derived });
};

onMounted(async () => {
  await authStore.init();
  await settingsStore.load();
  await ensureDisplayNameFromAuth();
  if (authStore.isLoggedIn && navigator.onLine) {
    await syncService.syncNow();
    await trackerStore.refresh(true);
  }
  window.addEventListener('online', onOnlineSync);
  window.addEventListener('touchstart', onPullStart, { passive: true });
  window.addEventListener('touchmove', onPullMove, { passive: true });
  window.addEventListener('touchend', onPullEnd, { passive: true });
  window.addEventListener('touchcancel', onPullEnd, { passive: true });
});

const shouldAskName = computed(() =>
  authStore.isLoggedIn && settingsStore.isLoaded && !settingsStore.settings.displayName?.trim(),
);

watch(
  () => shouldAskName.value,
  (open) => {
    if (open) acquireGlobalScrollLock('welcome-name-dialog');
    else releaseGlobalScrollLock('welcome-name-dialog');
  },
  { immediate: true },
);

watch(
  () => authStore.isLoggedIn,
  async (loggedIn) => {
    if (!loggedIn) {
      uiStore.closeAllReminderAlerts();
      return;
    }
    await runReminderCheck();
    await ensureDisplayNameFromAuth();
    if (!navigator.onLine) return;
    await syncService.syncNow();
    await trackerStore.refresh(true);
  },
);

onBeforeUnmount(() => {
  releaseGlobalScrollLock('welcome-name-dialog');
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

const saveName = async () => {
  const value = displayNameInput.value.trim();
  if (!value) return;
  await settingsStore.persist({ ...settingsStore.settings, displayName: value });
  displayNameInput.value = '';
};
</script>

<template>
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

  <div v-if="shouldAskName" class="overlay" style="z-index:100">
    <Card class="dialog">
      <h3>Welcome to Tracker</h3>
      <p class="muted">What name should we call you?</p>
      <form class="form-grid" style="margin-top:.7rem;" @submit.prevent="saveName">
        <Input v-model="displayNameInput" placeholder="Enter your name" />
        <Button type="submit">Save</Button>
      </form>
    </Card>
  </div>
</template>
