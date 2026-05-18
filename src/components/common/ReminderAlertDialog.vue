<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { useUiStore } from '../../stores/uiStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useTrackerStore } from '../../stores/trackerStore';
import { acquireGlobalScrollLock, releaseGlobalScrollLock } from '../../composables/useGlobalScrollLock';
import { imageRepo } from '../../db/repositories/imageRepo';
import { FALLBACK_IMAGE_DATA_URL } from '../../utils/image';
import Card from '../ui/Card.vue';
import Button from '../ui/Button.vue';

const uiStore = useUiStore();
const settingsStore = useSettingsStore();
const trackerStore = useTrackerStore();
const thumbUrls = ref<Record<string, string>>({});
const objectUrls = new Map<string, string>();
const SWIPE_DISMISS_PX = 96;
const dragState = ref<Record<string, number>>({});
const draggingKey = ref<string | null>(null);
const startXByKey = new Map<string, number>();

const alertItems = computed(() => {
  const current = uiStore.reminderAlert.open ? [uiStore.reminderAlert] : [];
  return [...current, ...uiStore.reminderQueue];
});

watch(
  () => uiStore.reminderAlert.open,
  (open) => {
    if (open) acquireGlobalScrollLock('reminder-alert-dialog');
    else releaseGlobalScrollLock('reminder-alert-dialog');
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  releaseGlobalScrollLock('reminder-alert-dialog');
  objectUrls.forEach((url) => URL.revokeObjectURL(url));
  objectUrls.clear();
});

const dismissAllAlerts = async () => {
  let dismissedCount = 0;
  for (const item of alertItems.value) {
    if (item.trackerId && item.monthKey) {
      await settingsStore.dismissReminderForMonth(item.trackerId, item.monthKey);
    }
    uiStore.dismissReminderAlertByKey(item.dedupeKey);
    dismissedCount += 1;
  }
  if (dismissedCount > 0) {
    uiStore.pushToast({
      tone: 'success',
      text: dismissedCount === 1 ? 'Reminder dismissed.' : `${dismissedCount} reminders dismissed.`,
    });
  }
};

const dismissOneAlert = async (item: { trackerId?: string; monthKey?: string; dedupeKey?: string }) => {
  if (item.trackerId && item.monthKey) {
    await settingsStore.dismissReminderForMonth(item.trackerId, item.monthKey);
  }
  uiStore.dismissReminderAlertByKey(item.dedupeKey);
  uiStore.pushToast({ tone: 'success', text: 'Reminder dismissed.' });
};

const closeAlertsTemporarily = () => {
  uiStore.closeAllReminderAlerts();
};

const trackerFor = (trackerId?: string) => {
  if (!trackerId) return null;
  return trackerStore.getById(trackerId) ?? null;
};
const trackerDisplay = (trackerId?: string) => trackerFor(trackerId);

const deliveryReceiptLabel = (deliveryReceiptDate?: string, deliveryReceiptEndDate?: string) => {
  if (!deliveryReceiptDate) return '';
  const start = new Date(deliveryReceiptDate).toLocaleDateString();
  if (!deliveryReceiptEndDate) return start;
  const end = new Date(deliveryReceiptEndDate).toLocaleDateString();
  return `${start} - ${end}`;
};

const loadThumbs = async () => {
  objectUrls.forEach((url) => URL.revokeObjectURL(url));
  objectUrls.clear();
  const next: Record<string, string> = {};

  for (const item of alertItems.value) {
    if (!item.trackerId) continue;
    const images = await imageRepo.listByTrackerId(item.trackerId);
    const first = images[0];
    if (!first?.blob) continue;
    const url = URL.createObjectURL(first.blob);
    objectUrls.set(item.trackerId, url);
    next[item.trackerId] = url;
  }

  thumbUrls.value = next;
};

watch(
  () => alertItems.value.map((item) => item.dedupeKey || item.trackerId || item.title).join('|'),
  () => {
    void loadThumbs();
  },
  { immediate: true },
);

const itemKeyOf = (item: { dedupeKey?: string; trackerId?: string; title?: string }) =>
  item.dedupeKey || item.trackerId || item.title || '';

const onPointerDown = (itemKey: string, event: PointerEvent) => {
  if (!itemKey) return;
  draggingKey.value = itemKey;
  startXByKey.set(itemKey, event.clientX);
};

const onPointerMove = (itemKey: string, event: PointerEvent) => {
  if (!itemKey || draggingKey.value !== itemKey) return;
  const startX = startXByKey.get(itemKey);
  if (startX === undefined) return;
  const deltaX = event.clientX - startX;
  dragState.value[itemKey] = Math.min(0, deltaX);
};

const finishDrag = async (item: { trackerId?: string; monthKey?: string; dedupeKey?: string; title?: string }) => {
  const itemKey = itemKeyOf(item);
  if (!itemKey) return;
  const offset = dragState.value[itemKey] ?? 0;
  draggingKey.value = null;
  startXByKey.delete(itemKey);

  if (offset <= -SWIPE_DISMISS_PX) {
    dragState.value[itemKey] = -160;
    await dismissOneAlert(item);
    return;
  }

  dragState.value[itemKey] = 0;
};

const onPointerUp = async (item: { trackerId?: string; monthKey?: string; dedupeKey?: string; title?: string }) => {
  await finishDrag(item);
};

const onPointerCancel = async (item: { trackerId?: string; monthKey?: string; dedupeKey?: string; title?: string }) => {
  await finishDrag(item);
};

const itemStyle = (item: { dedupeKey?: string; trackerId?: string; title?: string }) => {
  const itemKey = itemKeyOf(item);
  const x = dragState.value[itemKey] ?? 0;
  const isDragging = draggingKey.value === itemKey;
  return {
    transform: `translateX(${x}px)`,
    transition: isDragging ? 'none' : 'transform 180ms ease',
  };
};

const onImageError = (event: Event) => {
  const target = event.target as HTMLImageElement;
  target.src = FALLBACK_IMAGE_DATA_URL;
};
</script>

<template>
  <div v-if="uiStore.reminderAlert.open" class="overlay">
    <Card class="dialog" style="max-width: 520px;">
      <h3>Reminder Alerts</h3>
      <p class="muted">Items due/late this cycle.</p>
      <div class="stack max-h-[52vh] overflow-y-auto pr-1" style="margin-top:.7rem;">
        <div
          v-for="item in alertItems"
          :key="item.dedupeKey || item.title"
          class="relative overflow-hidden rounded-2xl border border-[var(--border)]"
        >
          <div class="absolute inset-0 flex items-center justify-end bg-rose-100 px-4">
            <span class="text-xs font-semibold uppercase tracking-wide text-rose-700">Dismissing</span>
          </div>
          <div
            class="relative bg-white p-3 touch-pan-y select-none"
            :style="itemStyle(item)"
            @pointerdown="onPointerDown(itemKeyOf(item), $event)"
            @pointermove="onPointerMove(itemKeyOf(item), $event)"
            @pointerup="onPointerUp(item)"
            @pointercancel="onPointerCancel(item)"
          >
            <div v-if="trackerDisplay(item.trackerId)">
              <div class="flex items-start gap-3">
                <div class="min-w-0 flex-1">
                  <p class="text-sm font-semibold text-slate-900">{{ trackerDisplay(item.trackerId)?.title }}</p>
                  <p v-if="trackerDisplay(item.trackerId)?.company" class="text-xs text-slate-500">{{ trackerDisplay(item.trackerId)?.company }}</p>
                  <p v-if="trackerDisplay(item.trackerId)?.deliveryReceiptDate" class="text-xs text-slate-500">
                  Delivery Receipt:
                    {{ deliveryReceiptLabel(trackerDisplay(item.trackerId)?.deliveryReceiptDate, trackerDisplay(item.trackerId)?.deliveryReceiptEndDate) }}
                  </p>
                </div>
                <img
                  v-if="item.trackerId && thumbUrls[item.trackerId]"
                  :src="thumbUrls[item.trackerId]"
                  alt="alert tracker image"
                  class="h-16 w-16 shrink-0 rounded-xl border border-[var(--border)] object-cover"
                  @error="onImageError"
                />
                <div
                  v-else
                  class="grid h-16 w-16 shrink-0 place-items-center rounded-xl border border-[var(--border)] bg-slate-100 text-[10px] font-semibold text-slate-500"
                >
                  NO IMG
                </div>
              </div>
              <p class="mt-2 rounded-xl bg-rose-50/40 px-3 py-2 text-sm text-slate-600 whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
                Please take a picture and sent it
              </p>
            </div>
            <div v-else>
              <p class="text-sm font-semibold text-slate-900">{{ item.title }}</p>
              <p class="muted">{{ item.message }}</p>
            </div>
          </div>
        </div>
      </div>
      <div class="dialog-actions">
        <Button variant="secondary" @click="closeAlertsTemporarily">Close</Button>
        <Button @click="dismissAllAlerts">Dismiss</Button>
      </div>
    </Card>
  </div>
</template>
