<script setup lang="ts">
import { CalendarClock, Clock } from 'lucide-vue-next';
import { onBeforeUnmount, ref, watch } from 'vue';
import { imageRepo } from '../../db/repositories/imageRepo';
import type { TrackerItem } from '../../types/tracker';
import { FALLBACK_IMAGE_DATA_URL } from '../../utils/image';
import Card from '../ui/Card.vue';

const props = withDefaults(defineProps<{ tracker: TrackerItem; showNotes?: boolean }>(), {
  showNotes: false,
});
const thumbUrl = ref<string | null>(null);
const imageCount = ref(0);
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

const deliveryReceiptLabel = (tracker: TrackerItem) => {
  if (!tracker.deliveryReceiptDate) return '';
  const start = new Date(tracker.deliveryReceiptDate).toLocaleDateString();
  if (!tracker.deliveryReceiptEndDate) return start;
  const end = new Date(tracker.deliveryReceiptEndDate).toLocaleDateString();
  return `${start} - ${end}`;
};

watch(
  () => props.tracker.id,
  async (trackerId) => {
    if (activeThumbUrl) {
      URL.revokeObjectURL(activeThumbUrl);
      activeThumbUrl = null;
    }

    thumbUrl.value = null;
    const images = await imageRepo.listByTrackerId(trackerId);
    imageCount.value = images.length;
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

const onImageError = (event: Event) => {
  const target = event.target as HTMLImageElement;
  target.src = FALLBACK_IMAGE_DATA_URL;
};
</script>

<template>
  <Card class="tracker-card">
    <div class="tracker-card-head">
      <div class="min-w-0 flex-1">
        <h3 class="tracker-title">{{ props.tracker.title }}</h3>
        <p v-if="props.tracker.company" class="meta-line text-xs">{{ props.tracker.company }}</p>
        <div class="flex flex-wrap items-center gap-x-1 gap-y-0.5 text-xs text-slate-500">
          <Clock :size="14" />
          <span>{{ timeAgoPh(props.tracker.updatedAt) }}</span>
          <span>({{ formatDateLong(props.tracker.updatedAt) }})</span>
        </div>
        <p v-if="props.tracker.deliveryReceiptDate"
          class="meta-line flex min-w-0 flex-wrap items-center gap-1 text-xs overflow-hidden break-words">
          <CalendarClock :size="14" />
          <span class="min-w-0 whitespace-normal break-words">Delivery Receipt: {{ deliveryReceiptLabel(props.tracker) }}</span>
        </p>
      </div>
      <div v-if="thumbUrl" class="relative">
        <img :src="thumbUrl" alt="thumbnail" class="tracker-thumb tracker-thumb-box" @error="onImageError" />
        <div v-if="imageCount > 1"
          class="absolute inset-0 grid place-items-center rounded-[inherit] bg-black/40 text-sm font-bold text-white">
          +{{ imageCount - 1 }}
        </div>
      </div>
      <div v-else class="tracker-thumb tracker-thumb-box tracker-thumb-placeholder">NO IMG</div>
    </div>
    <p
      v-if="props.showNotes && props.tracker.notes?.trim()"
      class="meta-line tracker-note rounded-xl bg-rose-50/40 px-3 py-2 whitespace-pre-wrap"
    >
      {{ props.tracker.notes }}
    </p>
  </Card>
</template>

