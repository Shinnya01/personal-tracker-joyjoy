<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { CalendarClock, Pencil, RefreshCw, Trash2 } from 'lucide-vue-next';
import { useTrackerStore } from '../stores/trackerStore';
import { imageRepo } from '../db/repositories/imageRepo';
import type { StoredImage } from '../types/tracker';
import { useUiStore } from '../stores/uiStore';
import { FALLBACK_IMAGE_DATA_URL } from '../utils/image';
import Card from '../components/ui/Card.vue';
import Button from '../components/ui/Button.vue';
import { useManualSync } from '../composables/useManualSync';

const route = useRoute();
const router = useRouter();
const trackerStore = useTrackerStore();
const uiStore = useUiStore();
const { authStore, isSyncing, syncNow } = useManualSync();
const images = ref<StoredImage[]>([]);
const imageUrls = ref<Record<string, string>>({});
const imageReady = ref<Record<string, boolean>>({});
const trackerId = computed(() => String(route.params.id));
const tracker = computed(() => trackerStore.getById(trackerId.value));

const rebuildImageUrls = () => {
  Object.values(imageUrls.value).forEach((url) => URL.revokeObjectURL(url));
  const next: Record<string, string> = {};
  const ready: Record<string, boolean> = {};
  for (const image of images.value) {
    next[image.id] = URL.createObjectURL(image.blob);
    ready[image.id] = false;
  }
  imageUrls.value = next;
  imageReady.value = ready;
};

onMounted(async () => {
  if (!tracker.value) await trackerStore.refresh();
  images.value = await imageRepo.listByTrackerId(trackerId.value);
  rebuildImageUrls();
});

onBeforeUnmount(() => {
  Object.values(imageUrls.value).forEach((url) => URL.revokeObjectURL(url));
});

const remove = async () => {
  const ok = await uiStore.askConfirm('Delete tracker', 'This action cannot be undone.');
  if (!ok) return;
  await trackerStore.deleteTracker(trackerId.value);
  await router.push('/trackers');
};

const onImageError = (event: Event) => {
  const target = event.target as HTMLImageElement;
  target.src = FALLBACK_IMAGE_DATA_URL;
  const id = target.dataset.imageId;
  if (id) imageReady.value[id] = true;
};

const onImageLoad = (id: string) => {
  imageReady.value[id] = true;
};

const deliveryReceiptLabel = computed(() => {
  const item = tracker.value;
  if (!item?.deliveryReceiptDate) return '';
  const start = new Date(item.deliveryReceiptDate).toLocaleDateString();
  if (!item.deliveryReceiptEndDate) return start;
  const end = new Date(item.deliveryReceiptEndDate).toLocaleDateString();
  return `${start} - ${end}`;
});
</script>

<template>
  <section v-if="tracker" class="stack stack-lg detail-page">
    <Card class="panel-card">
      <div class="flex items-start justify-between gap-3">
        <h1 class="detail-title">{{ tracker.title }}</h1>
        <Button
          v-if="authStore.isLoggedIn"
          size="sm"
          variant="secondary"
          class="rounded-xl"
          :disabled="isSyncing"
          @click="syncNow"
        >
          <RefreshCw :size="14" :class="{ 'animate-spin': isSyncing }" />
          {{ isSyncing ? 'Syncing' : 'Sync' }}
        </Button>
      </div>
      <p v-if="tracker.company" class="meta-line">{{ tracker.company }}</p>
      <p v-if="tracker.deliveryReceiptDate" class="meta-line"><CalendarClock :size="14" /> Delivery Receipt: {{ deliveryReceiptLabel }}</p>
    </Card>

    <Card class="panel-card">
      <h3>Gallery</h3>
      <div class="image-grid image-grid-large">
        <div v-for="image in images" :key="image.id" class="relative overflow-hidden rounded-2xl">
          <div v-if="!imageReady[image.id]" class="absolute inset-0 animate-pulse bg-slate-200/80"></div>
          <img
            :src="imageUrls[image.id] || FALLBACK_IMAGE_DATA_URL"
            :data-image-id="image.id"
            alt="tracker image"
            :class="{ 'opacity-0': !imageReady[image.id] }"
            class="transition-opacity duration-150"
            @load="onImageLoad(image.id)"
            @error="onImageError"
          />
        </div>
      </div>
    </Card>

    <Card class="panel-card sticky-actions">
      <div class="actions-row">
        <Button @click="router.push(`/trackers/${trackerId}/edit`)"><Pencil :size="14" /> Edit</Button>
        <Button variant="danger" @click="remove"><Trash2 :size="14" /> Delete</Button>
      </div>
    </Card>
  </section>
</template>
