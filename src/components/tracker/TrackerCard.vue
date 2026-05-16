<script setup lang="ts">
import { ref, watchEffect } from 'vue';
import { CalendarClock } from 'lucide-vue-next';
import type { TrackerItem } from '../../types/tracker';
import { imageRepo } from '../../db/repositories/imageRepo';
import Card from '../ui/Card.vue';

const props = defineProps<{ tracker: TrackerItem }>();
const thumbUrl = ref<string | null>(null);

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

watchEffect(async () => {
  if (thumbUrl.value) {
    URL.revokeObjectURL(thumbUrl.value);
    thumbUrl.value = null;
  }
  const imageId = props.tracker.images?.[0];
  if (!imageId) return;
  const image = await imageRepo.getById(imageId);
  if (image?.blob) thumbUrl.value = URL.createObjectURL(image.blob);
});
</script>

<template>
  <Card class="tracker-card">
    <div class="tracker-card-head">
      <div>
        <h3 class="tracker-title">{{ props.tracker.title }}</h3>
        <div class="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
          <span>Updated {{ timeAgoPh(props.tracker.updatedAt) }}</span>
          <span>({{ formatDateLong(props.tracker.updatedAt) }})</span>
        </div>
      </div>
      <img v-if="thumbUrl" :src="thumbUrl" alt="thumbnail" class="tracker-thumb" />
      <div v-else class="tracker-thumb tracker-thumb-placeholder">{{ props.tracker.images?.length ? 'IMG' : 'TXT' }}</div>
    </div>
    <p v-if="props.tracker.deliveryReceiptDate" class="meta-line"><CalendarClock :size="14" /> Delivery Receipt: {{ new Date(props.tracker.deliveryReceiptDate).toLocaleDateString() }}</p>
  </Card>
</template>

