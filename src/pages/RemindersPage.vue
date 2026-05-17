<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { onBeforeRouteLeave } from 'vue-router';
import { AlertCircle, BellRing, ChevronLeft, ChevronRight, ClockArrowUp } from 'lucide-vue-next';
import Card from '../components/ui/Card.vue';
import CardHeader from '../components/ui/CardHeader.vue';
import CardTitle from '../components/ui/CardTitle.vue';
import CardDescription from '../components/ui/CardDescription.vue';
import TrackerCard from '../components/tracker/TrackerCard.vue';
import Button from '../components/ui/Button.vue';
import Dialog from '../components/ui/Dialog.vue';
import DialogContent from '../components/ui/DialogContent.vue';
import { X } from 'lucide-vue-next';
import { useTrackerStore } from '../stores/trackerStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useUiStore } from '../stores/uiStore';
import { imageRepo } from '../db/repositories/imageRepo';
import type { StoredImage, TrackerItem } from '../types/tracker';

const trackerStore = useTrackerStore();
const settingsStore = useSettingsStore();
const uiStore = useUiStore();
onMounted(async () => {
  await settingsStore.load();
  await trackerStore.refresh();
});
const monthKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
const monthIndex = (date: Date) => date.getFullYear() * 12 + date.getMonth();
const FIXED_DUE_DAY = 5;
const today = computed(() => new Date());
const thisMonthKey = computed(() => monthKey(today.value));
const isDismissed = (item: TrackerItem) => Boolean(settingsStore.settings.dismissedReminderMonths?.[`${item.id}:${thisMonthKey.value}`]);

const buckets = computed(() => {
  const day = today.value.getDate();
  const items = trackerStore.trackers.filter((item) => {
    if (!item.deliveryReceiptDate) return false;
    const base = new Date(item.deliveryReceiptDate);
    if (Number.isNaN(base.getTime())) return false;
    if (monthIndex(today.value) <= monthIndex(base)) return false;
    if (isDismissed(item)) return false;
    return true;
  });

  const todayList = day === FIXED_DUE_DAY ? items : [];
  const upcoming = day < FIXED_DUE_DAY ? items : [];
  const overdue = day > FIXED_DUE_DAY ? items : [];

  return { today: todayList, upcoming, overdue };
});
const selected = ref<TrackerItem | null>(null);
const selectedImages = ref<StoredImage[]>([]);
const dialogOpen = ref(false);
const selectedImageIndex = ref(0);
const selectedImageUrl = ref<string | null>(null);
const objectUrls = new Map<string, string>();

const cleanupReminderDialogState = () => {
  dialogOpen.value = false;
  selected.value = null;
  selectedImages.value = [];
  selectedImageIndex.value = 0;
  selectedImageUrl.value = null;
};

onBeforeUnmount(() => {
  cleanupReminderDialogState();
  objectUrls.forEach((url) => URL.revokeObjectURL(url));
  objectUrls.clear();
});

onBeforeRouteLeave(() => {
  cleanupReminderDialogState();
});

const openReminderDialog = async (item: TrackerItem) => {
  selected.value = item;
  const images = await imageRepo.listByTrackerId(item.id);
  const seen = new Set<string>();
  selectedImages.value = images.filter((img) => {
    const signature = `${img.name}:${img.size}:${img.createdAt}`;
    if (seen.has(signature)) return false;
    seen.add(signature);
    return true;
  });
  selectedImageIndex.value = 0;
  const first = selectedImages.value[0];
  selectedImageUrl.value = first ? imageUrl(first) : null;
  dialogOpen.value = true;
};

const closeReminderDialog = cleanupReminderDialogState;

const imageUrl = (img: StoredImage) => {
  const existing = objectUrls.get(img.id);
  if (existing) return existing;
  const url = URL.createObjectURL(img.blob);
  objectUrls.set(img.id, url);
  return url;
};

const showPrev = () => {
  if (selectedImageIndex.value <= 0) return;
  selectedImageIndex.value -= 1;
  selectedImageUrl.value = imageUrl(selectedImages.value[selectedImageIndex.value]);
};

const showNext = () => {
  if (selectedImageIndex.value >= selectedImages.value.length - 1) return;
  selectedImageIndex.value += 1;
  selectedImageUrl.value = imageUrl(selectedImages.value[selectedImageIndex.value]);
};

const deliveryReceiptLabel = (tracker: TrackerItem | null) => {
  if (!tracker?.deliveryReceiptDate) return '';
  const start = new Date(tracker.deliveryReceiptDate).toLocaleDateString();
  if (!tracker.deliveryReceiptEndDate) return start;
  const end = new Date(tracker.deliveryReceiptEndDate).toLocaleDateString();
  return `${start} - ${end}`;
};

const dismissForMonth = async () => {
  if (!selected.value) return;
  await settingsStore.dismissReminderForMonth(selected.value.id, thisMonthKey.value);
  uiStore.pushToast({ tone: 'success', text: 'Reminder dismissed for this month.' });
  closeReminderDialog();
};
</script>

<template>
  <section class="flex flex-col gap-5">
    <Card class="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-gradient-to-b from-white to-rose-50/50 shadow-[var(--shadow-soft)]">
      <CardHeader class="relative z-10 p-8">
        <CardTitle class="text-4xl leading-tight font-extrabold text-slate-900">Reminders</CardTitle>
        <CardDescription class="mt-3 text-sm text-slate-500">Track overdue and upcoming delivery receipts.</CardDescription>
      </CardHeader>
      <div class="pointer-events-none absolute inset-0 bg-radial-[at_85%_5%] from-rose-300/30 via-transparent to-transparent"></div>
    </Card>

    <div>
      <h2 class="text-base font-bold text-slate-900">Overview</h2>
    </div>

    <div class="grid grid-cols-3 gap-3">
      <Card class="rounded-3xl p-4">
        <p class="text-xs font-medium text-slate-500">Today</p>
        <p class="mt-1 text-2xl font-extrabold text-slate-900">{{ buckets.today.length }}</p>
      </Card>
      <Card class="rounded-3xl p-4">
        <p class="text-xs font-medium text-slate-500">Upcoming</p>
        <p class="mt-1 text-2xl font-extrabold text-slate-900">{{ buckets.upcoming.length }}</p>
      </Card>
      <Card class="rounded-3xl p-4">
        <p class="text-xs font-medium text-rose-500">Alert</p>
        <p class="mt-1 text-2xl font-extrabold text-rose-600">{{ buckets.overdue.length }}</p>
      </Card>
    </div>

    <Card class="rounded-3xl p-4">
      <div class="mb-3 flex items-center gap-2">
        <BellRing :size="16" class="text-rose-500" />
        <h3 class="text-base font-bold text-slate-900">Today</h3>
      </div>
      <div v-if="buckets.today.length" class="grid gap-2">
        <button
          v-for="item in buckets.today"
          :key="item.id"
          type="button"
          class="tracker-link text-left"
          @click="openReminderDialog(item)"
        >
          <TrackerCard :tracker="item" />
        </button>
      </div>
      <p v-else class="text-sm text-slate-500">No alerts for today.</p>
    </Card>

    <Card class="rounded-3xl p-4">
      <div class="mb-3 flex items-center gap-2">
        <ClockArrowUp :size="16" class="text-amber-500" />
        <h3 class="text-base font-bold text-slate-900">Upcoming</h3>
      </div>
      <div v-if="buckets.upcoming.length" class="grid gap-2">
        <button
          v-for="item in buckets.upcoming"
          :key="item.id"
          type="button"
          class="tracker-link text-left"
          @click="openReminderDialog(item)"
        >
          <TrackerCard :tracker="item" />
        </button>
      </div>
      <p v-else class="text-sm text-slate-500">No upcoming alerts.</p>
    </Card>

    <Card class="rounded-3xl border border-rose-200/70 p-4">
      <div class="mb-3 flex items-center gap-2">
        <AlertCircle :size="16" class="text-rose-500" />
        <h3 class="text-base font-bold text-rose-700">Alert</h3>
      </div>
      <div v-if="buckets.overdue.length" class="grid gap-2">
        <button
          v-for="item in buckets.overdue"
          :key="item.id"
          type="button"
          class="tracker-link text-left"
          @click="openReminderDialog(item)"
        >
          <TrackerCard :tracker="item" />
        </button>
      </div>
      <p v-else class="text-sm text-slate-500">No overdue alerts.</p>
    </Card>

    <Dialog :open="dialogOpen" @update:open="(open) => !open && closeReminderDialog()">
      <DialogContent>
        <div class="stack">
          <div class="row-between">
            <div>
              <p class="text-sm font-semibold text-slate-900">{{ selected?.title }}</p>
              <p v-if="selected?.company" class="text-xs text-slate-500">{{ selected.company }}</p>
              <p v-if="selected?.deliveryReceiptDate" class="text-xs text-slate-500">
                Delivery Receipt: {{ deliveryReceiptLabel(selected) }}
              </p>
            </div>
            <Button size="icon" aria-label="Close image" @click="closeReminderDialog">
              <X :size="20" />
              <span class="sr-only">Close dialog</span>
            </Button>
          </div>
          <div v-if="selectedImages.length" class="grid grid-cols-[2.5rem_minmax(0,1fr)_2.5rem] items-center gap-2 rounded-2xl bg-slate-50 p-2">
            <div class="flex justify-center">
              <Button
                v-if="selectedImages.length > 1"
                size="icon"
                :disabled="selectedImageIndex === 0"
                aria-label="Previous image"
                @click="showPrev"
              >
                <ChevronLeft :size="18" />
              </Button>
            </div>
            <img
              v-if="selectedImageUrl"
              :src="selectedImageUrl"
              alt="tracker image preview"
              class="max-h-[56vh] w-auto max-w-full justify-self-center rounded-xl object-contain"
            />
            <div class="flex justify-center">
              <Button
                v-if="selectedImages.length > 1"
                size="icon"
                :disabled="selectedImageIndex === selectedImages.length - 1"
                aria-label="Next image"
                @click="showNext"
              >
                <ChevronRight :size="18" />
              </Button>
            </div>
          </div>
          <p
            v-if="selected?.notes?.trim()"
            class="min-w-0 w-full overflow-hidden rounded-xl bg-rose-50/40 px-3 py-2 text-sm text-slate-600 whitespace-pre-wrap break-words [overflow-wrap:anywhere]"
          >
            {{ selected.notes }}
          </p>
          <p v-if="selectedImages.length > 1" class="text-center text-xs font-medium text-slate-500">
            {{ selectedImageIndex + 1 }}/{{ selectedImages.length }}
          </p>
          <p v-if="!selectedImages.length" class="text-sm text-slate-500">No images uploaded.</p>
          <div class="flex justify-end">
            <Button type="button" variant="secondary" @click="dismissForMonth">Dismiss This Month</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </section>
</template>

