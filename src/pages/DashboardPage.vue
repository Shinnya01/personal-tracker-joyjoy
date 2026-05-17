<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, onUnmounted, ref, watch } from 'vue';
import { RouterLink } from 'vue-router';
import { Building2, CheckCircle2, ChevronLeft, ChevronRight, CircleDashed, DatabaseBackup, ListChecks, Pen, Sparkles, Trash2, X } from 'lucide-vue-next';
import Card from '../components/ui/Card.vue';
import CardHeader from '../components/ui/CardHeader.vue';
import CardTitle from '../components/ui/CardTitle.vue';
import CardDescription from '../components/ui/CardDescription.vue';
import Button from '../components/ui/Button.vue';
import Dialog from '../components/ui/Dialog.vue';
import DialogContent from '../components/ui/DialogContent.vue';
import Select from '../components/ui/Select.vue';
import { useTrackerStore } from '../stores/trackerStore';
import { useSettingsStore } from '../stores/settingsStore';
import type { ActivityLog, StoredImage, TrackerItem } from '../types/tracker';
import { imageRepo } from '../db/repositories/imageRepo';

const trackerStore = useTrackerStore();
const settingsStore = useSettingsStore();
const now = ref(new Date());
const selectedSummaryMonth = ref(
  `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
);
const monthPickerOpen = ref(false);
let greetingTimer: number | null = null;
const activityThumbs = ref<Record<string, string>>({});
const activeObjectUrls = new Map<string, string>();
const selectedImageUrl = ref<string | null>(null);
const imageDialogOpen = ref(false);
const selectedImages = ref<StoredImage[]>([]);
const selectedImageIndex = ref(0);
const selectedTracker = ref<TrackerItem | null>(null);
const previewObjectUrls = new Map<string, string>();

onMounted(() => {
  void trackerStore.refresh();
  greetingTimer = window.setInterval(() => {
    now.value = new Date();
  }, 30000);
});

onUnmounted(() => {
  if (greetingTimer !== null) window.clearInterval(greetingTimer);
  activeObjectUrls.forEach((url) => URL.revokeObjectURL(url));
  activeObjectUrls.clear();
  previewObjectUrls.forEach((url) => URL.revokeObjectURL(url));
  previewObjectUrls.clear();
});

const greetingText = computed(() => {
  const hour = now.value.getHours();
  const dayGreeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';
  const name = settingsStore.settings.displayName?.trim();
  return name ? `${dayGreeting}, ${name}` : dayGreeting;
});

const selectedSummaryMonthLabel = computed(() => {
  const [year, month] = selectedSummaryMonth.value.split('-').map(Number);
  const d = new Date(year, (month || 1) - 1, 1);
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
});
const selectedSummaryYear = computed({
  get: () => selectedSummaryMonth.value.split('-')[0] ?? `${new Date().getFullYear()}`,
  set: (year: string) => {
    const month = selectedSummaryMonth.value.split('-')[1] ?? '01';
    selectedSummaryMonth.value = `${year}-${month}`;
  },
});
const selectedSummaryMonthPart = computed({
  get: () => selectedSummaryMonth.value.split('-')[1] ?? '01',
  set: (month: string) => {
    const year = selectedSummaryMonth.value.split('-')[0] ?? `${new Date().getFullYear()}`;
    selectedSummaryMonth.value = `${year}-${month}`;
  },
});
const monthOptions = [
  { label: 'January', value: '01' },
  { label: 'February', value: '02' },
  { label: 'March', value: '03' },
  { label: 'April', value: '04' },
  { label: 'May', value: '05' },
  { label: 'June', value: '06' },
  { label: 'July', value: '07' },
  { label: 'August', value: '08' },
  { label: 'September', value: '09' },
  { label: 'October', value: '10' },
  { label: 'November', value: '11' },
  { label: 'December', value: '12' },
];
const yearOptions = computed(() => {
  const years = new Set<number>([new Date().getFullYear()]);
  for (const tracker of trackerStore.trackers) {
    if (!tracker.deliveryReceiptDate) continue;
    const d = new Date(tracker.deliveryReceiptDate);
    if (!Number.isNaN(d.getTime())) years.add(d.getFullYear());
  }
  return Array.from(years)
    .sort((a, b) => b - a)
    .map((year) => ({ label: `${year}`, value: `${year}` }));
});

const isInSelectedMonth = (dateIso?: string) => {
  if (!dateIso) return false;
  const d = new Date(dateIso);
  if (Number.isNaN(d.getTime())) return false;
  const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  return key === selectedSummaryMonth.value;
};

const selectedMonthTotal = computed(() =>
  trackerStore.trackers.filter((tracker) => isInSelectedMonth(tracker.deliveryReceiptDate)).length,
);

const companySummary = computed(() => {
  const counts = new Map<string, number>();
  for (const tracker of trackerStore.trackers) {
    if (!isInSelectedMonth(tracker.deliveryReceiptDate)) continue;
    const company = tracker.company?.trim() || 'Unassigned';
    counts.set(company, (counts.get(company) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([company, count]) => ({ company, count }))
    .sort((a, b) => b.count - a.count || a.company.localeCompare(b.company));
});

const activityText = (activity: ActivityLog) => {
  if (activity.type === 'created') {
    const title = activity.message.replace(/^Created tracker:\s*/i, '').trim();
    return `You created "${title}"`;
  }
  return activity.message;
};

const timeAgo = (iso: string) => {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.max(1, Math.floor(diffMs / 60000));
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
};

const activityIconClass = (type: ActivityLog['type']) => {
  if (type === 'created') return 'text-green-500';
  if (type === 'updated') return 'text-amber-500';
  if (type === 'deleted') return 'text-red-500';
  if (type === 'backup_imported') return 'text-sky-500';
  return 'text-slate-400';
};

const recentActivities = computed(() => trackerStore.activities.slice(0, 3));
const trackerById = computed(() => trackerStore.getById);

watch(
  () => recentActivities.value,
  async (items) => {
    activeObjectUrls.forEach((url) => URL.revokeObjectURL(url));
    activeObjectUrls.clear();
    const next: Record<string, string> = {};
    for (const activity of items) {
      if (activity.previewImageDataUrl) {
        next[activity.id] = activity.previewImageDataUrl;
        continue;
      }
      if (!activity.trackerId) continue;
      const tracker = trackerById.value(activity.trackerId);
      if (!tracker) continue;
      const images = await imageRepo.listByTrackerId(tracker.id);
      const first = images[0];
      if (!first?.blob) continue;
      const url = URL.createObjectURL(first.blob);
      activeObjectUrls.set(activity.id, url);
      next[activity.id] = url;
    }
    activityThumbs.value = next;
  },
  { immediate: true, deep: true },
);

const activityDeliveryDate = (activity: ActivityLog) => {
  if (!activity.trackerId) return '';
  const tracker = trackerById.value(activity.trackerId);
  if (!tracker?.deliveryReceiptDate) return '';
  const start = new Date(tracker.deliveryReceiptDate).toLocaleDateString();
  if (!tracker.deliveryReceiptEndDate) return start;
  const end = new Date(tracker.deliveryReceiptEndDate).toLocaleDateString();
  return `${start} - ${end}`;
};

const cleanupPreviewState = () => {
  imageDialogOpen.value = false;
  selectedImageUrl.value = null;
  selectedImages.value = [];
  selectedImageIndex.value = 0;
  selectedTracker.value = null;
};

onBeforeUnmount(() => {
  cleanupPreviewState();
});

const closeImageDialog = cleanupPreviewState;

const imageUrl = (img: StoredImage) => {
  const existing = previewObjectUrls.get(img.id);
  if (existing) return existing;
  const url = URL.createObjectURL(img.blob);
  previewObjectUrls.set(img.id, url);
  return url;
};

const openImageDialog = (img: StoredImage) => {
  selectedImageUrl.value = imageUrl(img);
  void nextTick(() => {
    imageDialogOpen.value = true;
  });
};

const openRecentActivityPreview = async (activity: ActivityLog) => {
  if (!activity.trackerId) return;
  const tracker = trackerById.value(activity.trackerId);
  if (!tracker) return;
  const images = await imageRepo.listByTrackerId(tracker.id);
  const first = images[0];
  if (!first) return;
  selectedTracker.value = tracker;
  selectedImages.value = images;
  selectedImageIndex.value = 0;
  openImageDialog(first);
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

const openMonthPicker = () => {
  monthPickerOpen.value = true;
};

const setMonthPickerOpen = (open: boolean) => {
  monthPickerOpen.value = open;
};

const pickCurrentMonth = () => {
  const current = new Date();
  selectedSummaryMonth.value = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
  setMonthPickerOpen(false);
};
</script>

<template>
  <section class="flex flex-col gap-6">
    <Card class="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-gradient-to-b from-white to-rose-50/50 shadow-[var(--shadow-soft)]">
      <CardHeader class="relative z-10 p-5">
        <p class="text-sm font-semibold text-[var(--accent-strong)]">{{ greetingText }}</p>
        <CardTitle class="mt-2 text-4xl leading-tight font-extrabold text-slate-900">Let's make today count.</CardTitle>
        <CardDescription class="mt-3 text-sm text-slate-500">Stay organized and keep everything on track.</CardDescription>
      </CardHeader>
      <div class="pointer-events-none absolute inset-0 bg-radial-[at_85%_5%] from-rose-300/30 via-transparent to-transparent"></div>
    </Card>

    <div>
      <h2 class="text-base font-bold text-slate-900">Overview</h2>
    </div>

    <div class="grid grid-cols-2 gap-4">
      <Card class="rounded-3xl border border-white/70 bg-white/90 p-5 backdrop-blur-sm">
        <div class="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent-strong)]">
          <ListChecks :size="22" />
        </div>
        <p class="text-sm text-slate-500">Total</p>
        <h3 class="text-3xl font-extrabold text-slate-900">{{ trackerStore.stats.total }}</h3>
      </Card>

      <button type="button" class="text-left" @click="openMonthPicker">
        <Card class="rounded-3xl border border-white/70 bg-white/90 p-5 backdrop-blur-sm">
          <div class="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-amber-100 text-amber-500">
            <CircleDashed :size="22" />
          </div>
          <p class="text-sm text-slate-500">This Month</p>
          <h3 class="text-3xl font-extrabold text-slate-900">{{ selectedMonthTotal }}</h3>
          <p class="mt-1 text-xs text-slate-500">{{ selectedSummaryMonthLabel }}</p>
        </Card>
      </button>
    </div>

    <div>
      <h2 class="text-base font-bold text-slate-900">Summary</h2>
      <p class="text-sm text-slate-500">{{ selectedSummaryMonthLabel }}</p>
    </div>

    <div v-if="companySummary.length" class="stack">
      <Card
        v-for="item in companySummary"
        :key="item.company"
        class="rounded-3xl border border-white/70 bg-white/90 p-4 backdrop-blur-sm"
      >
        <div class="flex items-center justify-between gap-3">
          <div class="flex min-w-0 items-center gap-3">
            <div class="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent-strong)]">
              <Building2 :size="18" />
            </div>
            <p class="truncate text-sm font-medium text-slate-700">{{ item.company }}</p>
          </div>
          <div class="text-right">
            <p class="text-2xl leading-none font-extrabold text-slate-900">{{ item.count }}</p>
            <p class="text-xs text-slate-500">Files</p>
          </div>
        </div>
      </Card>
    </div>
    <Card v-else class="rounded-3xl border border-white/70 bg-white/90 p-4 backdrop-blur-sm">
      <p class="text-sm text-slate-500">No tracker files yet.</p>
    </Card>

    <div class="flex items-center justify-between gap-3">
      <h2 class="text-base font-bold text-slate-900">Recent Activity</h2>
      <RouterLink to="/activity" class="text-sm font-semibold text-[var(--accent-strong)]">See all</RouterLink>
    </div>

    <div v-if="trackerStore.activities.length" class="stack">
      <Card
        v-for="activity in recentActivities"
        :key="activity.id"
        class="rounded-3xl p-4"
        role="button"
        tabindex="0"
        @click="openRecentActivityPreview(activity)"
        @keydown.enter="openRecentActivityPreview(activity)"
        @keydown.space.prevent="openRecentActivityPreview(activity)"
      >
        <div class="flex items-start gap-3 py-1.5">
          <CheckCircle2
            v-if="activity.type === 'created'"
            :size="24"
            :class="['shrink-0 self-center', activityIconClass(activity.type)]"
          />
          <Pen
            v-else-if="activity.type === 'updated'"
            :size="24"
            :class="['shrink-0 self-center', activityIconClass(activity.type)]"
          />
          <Trash2
            v-else-if="activity.type === 'deleted'"
            :size="24"
            :class="['shrink-0 self-center', activityIconClass(activity.type)]"
          />
          <DatabaseBackup
            v-else-if="activity.type === 'backup_imported'"
            :size="24"
            :class="['shrink-0 self-center', activityIconClass(activity.type)]"
          />
          <Sparkles
            v-else
            :size="24"
            :class="['shrink-0 self-center', activityIconClass(activity.type)]"
          />
          <div class="min-w-0 flex-1">
            <p class="text-sm font-medium text-slate-900">{{ activityText(activity) }}</p>
            <p class="text-xs text-slate-500">{{ timeAgo(activity.createdAt) }}</p>
            <p v-if="activityDeliveryDate(activity)" class="text-xs text-slate-500">
              Delivery Receipt: {{ activityDeliveryDate(activity) }}
            </p>
          </div>
          <img
            v-if="activityThumbs[activity.id]"
            :src="activityThumbs[activity.id]"
            alt="activity tracker image"
            class="h-14 w-14 shrink-0 rounded-xl object-cover border border-[var(--border)]"
          />
          <div
            v-else
            class="grid h-14 w-14 shrink-0 place-items-center rounded-xl border border-[var(--border)] bg-slate-50 text-[10px] font-bold text-slate-400"
          >
            NO IMG
          </div>
        </div>
      </Card>
    </div>

    <Card v-else class="rounded-3xl p-4">
      <div class="text-center text-sm text-slate-500">No recent activity</div>
    </Card>

    <Dialog :open="imageDialogOpen" @update:open="(open) => !open && closeImageDialog()">
      <DialogContent>
        <div class="stack">
          <div class="row-between">
            <div>
              <p class="text-sm font-semibold text-slate-900">{{ selectedTracker?.title }}</p>
              <p v-if="selectedTracker?.company" class="text-xs text-slate-500">{{ selectedTracker.company }}</p>
              <p v-if="selectedTracker?.deliveryReceiptDate" class="text-xs text-slate-500">
                Delivery Receipt: {{ deliveryReceiptLabel(selectedTracker) }}
              </p>
            </div>
            <Button size="icon" aria-label="Close image" @click="closeImageDialog">
              <X :size="20" />
              <span class="sr-only">Close image</span>
            </Button>
          </div>
          <div class="grid grid-cols-[2.5rem_minmax(0,1fr)_2.5rem] items-center gap-2 rounded-2xl bg-slate-50 p-2">
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
            v-if="selectedTracker?.notes?.trim()"
            class="min-w-0 w-full overflow-hidden rounded-xl bg-rose-50/40 px-3 py-2 text-sm text-slate-600 whitespace-pre-wrap break-words [overflow-wrap:anywhere]"
          >
            {{ selectedTracker.notes }}
          </p>
          <p v-if="selectedImages.length > 1" class="text-center text-xs font-medium text-slate-500">
            {{ selectedImageIndex + 1 }}/{{ selectedImages.length }}
          </p>
        </div>
      </DialogContent>
    </Dialog>

    <Dialog :open="monthPickerOpen" @update:open="setMonthPickerOpen">
      <DialogContent>
        <div class="stack">
          <p class="text-base font-bold text-slate-900">Select Month</p>
          <div class="grid grid-cols-[2fr_1fr] gap-3">
            <Select v-model="selectedSummaryMonthPart" :options="monthOptions" placeholder="Month" class="h-11 rounded-2xl text-sm" />
            <Select v-model="selectedSummaryYear" :options="yearOptions" placeholder="Year" class="h-11 rounded-2xl text-sm" />
          </div>
          <div class="flex items-center justify-end gap-2">
            <Button type="button" variant="secondary" @click="pickCurrentMonth">Today</Button>
            <Button type="button" @click="setMonthPickerOpen(false)">Done</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </section>
</template>


