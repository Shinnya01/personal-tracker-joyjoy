<script setup lang="ts">
import { ref, watchEffect } from 'vue';
import { CalendarClock, Tag } from 'lucide-vue-next';
import type { TrackerItem } from '../../types/tracker';
import { imageRepo } from '../../db/repositories/imageRepo';
import Card from '../ui/Card.vue';
import Badge from '../ui/Badge.vue';

const props = defineProps<{ tracker: TrackerItem }>();
const thumbUrl = ref<string | null>(null);

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
        <p class="tracker-category"><Tag :size="14" /> {{ props.tracker.category }}</p>
      </div>
      <img v-if="thumbUrl" :src="thumbUrl" alt="thumbnail" class="tracker-thumb" />
      <div v-else class="tracker-thumb tracker-thumb-placeholder">{{ props.tracker.images?.length ? 'IMG' : 'TXT' }}</div>
    </div>
    <div class="chip-row"><Badge>{{ props.tracker.category }}</Badge></div>
    <p v-if="props.tracker.deliveryReceiptDate" class="meta-line"><CalendarClock :size="14" /> Delivery Receipt: {{ new Date(props.tracker.deliveryReceiptDate).toLocaleDateString() }}</p>
  </Card>
</template>

