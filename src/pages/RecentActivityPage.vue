<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { RouterLink } from 'vue-router';
import { ArrowLeft, CheckCircle2, DatabaseBackup, Pen, Sparkles, Trash2 } from 'lucide-vue-next';
import Card from '../components/ui/Card.vue';
import Button from '../components/ui/Button.vue';
import { useTrackerStore } from '../stores/trackerStore';
import type { ActivityLog } from '../types/tracker';
import { imageRepo } from '../db/repositories/imageRepo';
import { FALLBACK_IMAGE_DATA_URL } from '../utils/image';

const trackerStore = useTrackerStore();
const activityThumbs = ref<Record<string, string>>({});
const activeObjectUrls = new Map<string, string>();

onMounted(() => {
  void trackerStore.refresh();
});

const clearThumbs = () => {
  activeObjectUrls.forEach((url) => URL.revokeObjectURL(url));
  activeObjectUrls.clear();
  activityThumbs.value = {};
};

onBeforeUnmount(() => {
  clearThumbs();
});

const activities = computed(() => trackerStore.activities);
const trackerById = computed(() => trackerStore.getById);

watch(
  () => activities.value,
  async (items) => {
    clearThumbs();
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

const activityDeliveryDate = (activity: ActivityLog) => {
  if (!activity.trackerId) return '';
  const tracker = trackerById.value(activity.trackerId);
  if (!tracker?.deliveryReceiptDate) return '';
  const start = new Date(tracker.deliveryReceiptDate).toLocaleDateString();
  if (!tracker.deliveryReceiptEndDate) return start;
  const end = new Date(tracker.deliveryReceiptEndDate).toLocaleDateString();
  return `${start} - ${end}`;
};

const onImageError = (event: Event) => {
  const target = event.target as HTMLImageElement;
  target.src = FALLBACK_IMAGE_DATA_URL;
};
</script>

<template>
  <section class="flex flex-col gap-5">
    <Card class="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-gradient-to-b from-white to-rose-50/50 shadow-[var(--shadow-soft)]">
      <div class="relative z-10 flex items-center justify-between gap-3 p-6">
        <div>
          <h1 class="text-4xl leading-tight font-extrabold text-slate-900">Recent Activity</h1>
          <p class="mt-2 text-sm text-slate-500">View your latest tracker actions.</p>
        </div>
        <RouterLink to="/">
          <Button size="sm" variant="secondary">
            <ArrowLeft :size="14" />
            Back
          </Button>
        </RouterLink>
      </div>
      <div class="pointer-events-none absolute inset-0 bg-radial-[at_85%_5%] from-rose-300/30 via-transparent to-transparent"></div>
    </Card>

    <div v-if="activities.length" class="stack">
      <Card
        v-for="activity in activities"
        :key="activity.id"
        class="rounded-3xl p-4"
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
            @error="onImageError"
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
  </section>
</template>
