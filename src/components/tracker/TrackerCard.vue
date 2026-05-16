<script setup lang="ts">
import { CalendarClock } from 'lucide-vue-next';
import { onBeforeUnmount, ref, watch } from 'vue';
import { imageRepo } from '../../db/repositories/imageRepo';
import type { TrackerItem } from '../../types/tracker';
import Card from '../ui/Card.vue';

const props = defineProps<{ tracker: TrackerItem }>();
const thumbUrl = ref<string | null>(null);
let activeThumbUrl: string | null = null;

const timeAgoPh = (iso: string) => {
  const nowInPh = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' })).getTime();
  const thenInPh = new Date(new Date(iso).toLocaleString('en-US', { timeZone: 'Asia/Manila' })).getTime();
  const diffMs = Math.max(0, nowInPh - thenInPh);
  const mins = Math.max(1, Math.floor(diffMs / 60000));
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hr${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
};

const formatDateLong = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

watch(
  () => props.tracker.id,
  async (trackerId) => {
    if (activeThumbUrl) {
      URL.revokeObjectURL(activeThumbUrl);
      activeThumbUrl = null;
    }

    thumbUrl.value = null;
    const images = await imageRepo.listByTrackerId(trackerId);
    const image = images[0];
    if (!image?.blob) return;

    activeThumbUrl = URL.createObjectURL(image.blob);
    thumbUrl.value = activeThumbUrl;
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  if (activeThumbUrl) {
    URL.revokeObjectURL(activeThumbUrl);
    activeThumbUrl = null;
  }
});
</script>

<template>
  <Card class="tracker-card">
    <div class="tracker-card-head">
      <div class="min-w-0 flex-1">
        <h3 class="tracker-title">{{ props.tracker.title }}</h3>
        <div class="mt-1 flex flex-wrap items-center gap-x-1 gap-y-0.5 text-[11px] text-slate-500">
          <span>Updated {{ timeAgoPh(props.tracker.updatedAt) }}</span>
          <span>({{ formatDateLong(props.tracker.updatedAt) }})</span>
        </div>
      </div>
      <img v-if="thumbUrl" :src="thumbUrl" alt="thumbnail" class="tracker-thumb tracker-thumb-box" />
      <div v-else class="tracker-thumb tracker-thumb-box tracker-thumb-placeholder">{{ props.tracker.images?.length ? 'IMG' : 'TXT' }}</div>
    </div>
    <p v-if="props.tracker.deliveryReceiptDate" class="meta-line flex flex-wrap items-center gap-1 break-words">
      <CalendarClock :size="14" />
      <span>Delivery Receipt: {{ new Date(props.tracker.deliveryReceiptDate).toLocaleDateString() }}</span>
    </p>
  </Card>
</template>
