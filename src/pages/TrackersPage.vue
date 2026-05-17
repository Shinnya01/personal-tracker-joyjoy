<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import type { ComponentPublicInstance } from 'vue';
import { onBeforeRouteLeave, useRouter } from 'vue-router';
import { ChevronLeft, ChevronRight, Pencil, Trash2, X } from 'lucide-vue-next';
import TrackerCard from '../components/tracker/TrackerCard.vue';
import TrackerFilters from '../components/tracker/TrackerFilters.vue';
import Button from '../components/ui/Button.vue';
import Card from '../components/ui/Card.vue';
import CardHeader from '../components/ui/CardHeader.vue';
import CardTitle from '../components/ui/CardTitle.vue';
import CardDescription from '../components/ui/CardDescription.vue';
import Dialog from '../components/ui/Dialog.vue';
import DialogContent from '../components/ui/DialogContent.vue';
import Skeleton from '../components/ui/Skeleton.vue';
import { useTrackerStore } from '../stores/trackerStore';
import { useUiStore } from '../stores/uiStore';
import { imageRepo } from '../db/repositories/imageRepo';
import type { StoredImage, TrackerItem } from '../types/tracker';
import { routeNames } from '../router';

const router = useRouter();
const trackerStore = useTrackerStore();
const uiStore = useUiStore();
const selectedImageUrl = ref<string | null>(null);
const imageDialogOpen = ref(false);
const selectedImages = ref<StoredImage[]>([]);
const selectedImageIndex = ref(0);
const selectedTracker = ref<TrackerItem | null>(null);
const dragOffset = ref<Record<string, number>>({});
const startXById = new Map<string, number>();
const maxOffsetById = new Map<string, number>();
const actionOpenId = ref<string | null>(null);
const draggingId = ref<string | null>(null);
const SWIPE_OPEN_THRESHOLD = 72;
const SWIPE_CLOSE_THRESHOLD = 40;
const draggedDistanceById = new Map<string, number>();

const objectUrls = new Map<string, string>();

onMounted(() => {
  void trackerStore.refresh();
});

const cleanupPreviewState = () => {
  imageDialogOpen.value = false;
  selectedImageUrl.value = null;
  selectedImages.value = [];
  selectedImageIndex.value = 0;
  selectedTracker.value = null;
};

onBeforeUnmount(() => {
  cleanupPreviewState();
  objectUrls.forEach((url) => URL.revokeObjectURL(url));
  objectUrls.clear();
});

onBeforeRouteLeave(() => {
  cleanupPreviewState();
});

const closeImageDialog = cleanupPreviewState;

const imageUrl = (img: StoredImage) => {
  const existing = objectUrls.get(img.id);
  if (existing) return existing;
  const url = URL.createObjectURL(img.blob);
  objectUrls.set(img.id, url);
  return url;
};

const openImageDialog = (img: StoredImage) => {
  selectedImageUrl.value = imageUrl(img);
  void nextTick(() => {
    imageDialogOpen.value = true;
  });
};

const openTrackerImagePreview = async (item: TrackerItem) => {
  selectedTracker.value = item;
  const trackerId = item.id;
  const images = await imageRepo.listByTrackerId(trackerId);
  const first = images[0];
  if (!first) return;
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

const setCardRef = (id: string, el: Element | ComponentPublicInstance | null) => {
  if (!el) {
    maxOffsetById.delete(id);
    return;
  }
  const node = el instanceof Element ? el : (el.$el as Element | null);
  if (!(node instanceof HTMLElement)) {
    maxOffsetById.delete(id);
    return;
  }
  const width = node.offsetWidth;
  maxOffsetById.set(id, width * 0.5);
};

const onPointerDown = (id: string, event: PointerEvent) => {
  draggingId.value = id;
  startXById.set(id, event.clientX);
  draggedDistanceById.set(id, 0);
  (event.currentTarget as HTMLElement | null)?.setPointerCapture?.(event.pointerId);
  if (actionOpenId.value && actionOpenId.value !== id) {
    dragOffset.value[actionOpenId.value] = 0;
    actionOpenId.value = null;
  }
};

const onPointerMove = (id: string, event: PointerEvent) => {
  if (draggingId.value !== id) return;
  const startX = startXById.get(id);
  if (startX === undefined) return;
  const maxOffset = maxOffsetById.get(id) ?? 180;
  const base = actionOpenId.value === id ? -maxOffset : 0;
  const deltaX = event.clientX - startX;
  draggedDistanceById.set(id, Math.max(Math.abs(deltaX), draggedDistanceById.get(id) ?? 0));
  const next = Math.min(0, Math.max(-maxOffset, base + deltaX));
  dragOffset.value[id] = next;
};

const endDrag = (id: string, event?: PointerEvent) => {
  if (draggingId.value !== id) return;
  const maxOffset = maxOffsetById.get(id) ?? 180;
  const offset = dragOffset.value[id] ?? 0;
  const shouldClose = actionOpenId.value === id && offset >= -(maxOffset - SWIPE_CLOSE_THRESHOLD);
  const shouldOpen = !shouldClose && offset <= -SWIPE_OPEN_THRESHOLD;
  dragOffset.value[id] = shouldOpen ? -maxOffset : 0;
  actionOpenId.value = shouldOpen ? id : null;
  draggingId.value = null;
  startXById.delete(id);
  event?.currentTarget && (event.currentTarget as HTMLElement).releasePointerCapture?.(event.pointerId);
};

const onCardClick = async (item: TrackerItem) => {
  const dragged = draggedDistanceById.get(item.id) ?? 0;
  if (dragged > 6) {
    draggedDistanceById.set(item.id, 0);
    return;
  }
  draggedDistanceById.set(item.id, 0);
  if (actionOpenId.value === item.id) {
    dragOffset.value[item.id] = 0;
    actionOpenId.value = null;
    return;
  }
  await openTrackerImagePreview(item);
};

const editTracker = async (id: string) => {
  dragOffset.value[id] = 0;
  actionOpenId.value = null;
  await router.push({ name: routeNames.trackerEdit, params: { id } });
};

const deleteTracker = async (item: TrackerItem) => {
  const ok = await uiStore.askConfirm('Delete tracker', `Delete "${item.title}"? This cannot be undone.`);
  if (!ok) return;
  try {
    await trackerStore.deleteTracker(item.id);
    uiStore.pushToast({ tone: 'success', text: 'Tracker deleted.' });
    dragOffset.value[item.id] = 0;
    if (actionOpenId.value === item.id) actionOpenId.value = null;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Action failed.';
    uiStore.pushToast({ tone: 'error', text: `Unable to delete tracker: ${message}` });
  }
};

const cardStyle = (id: string) => {
  const x = dragOffset.value[id] ?? 0;
  const isDragging = draggingId.value === id;
  return {
    transform: `translateX(${x}px)`,
    transition: isDragging ? 'none' : 'transform 180ms ease',
  };
};
</script>

<template>
  <section class="flex flex-col gap-5">
    <Card class="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-gradient-to-b from-white to-rose-50/50 shadow-[var(--shadow-soft)]">
      <CardHeader class="relative z-10 p-6">
        <CardTitle class="text-4xl leading-tight font-extrabold text-slate-900">Trackers</CardTitle>
        <CardDescription class="mt-3 text-sm text-slate-500">Search and sort your records.</CardDescription>
      </CardHeader>
      <div class="pointer-events-none absolute inset-0 bg-radial-[at_85%_5%] from-rose-300/30 via-transparent to-transparent"></div>
    </Card>

    <TrackerFilters v-model="trackerStore.filters" />

    <div class="stack">
      <Skeleton v-if="trackerStore.isLoading" class="h-24 w-full" />
      <Card v-else-if="!trackerStore.filteredTrackers.length" class="empty-state">No trackers found. Create your first tracker.</Card>
      <div
        v-for="item in trackerStore.filteredTrackers"
        :key="item.id"
        :ref="(el) => setCardRef(item.id, el)"
        class="relative overflow-hidden rounded-3xl border border-[var(--border)]"
      >
        <div class="absolute inset-y-0 right-0 grid w-1/2 grid-cols-2">
          <button
            type="button"
            class="grid place-items-center bg-amber-100 text-amber-700"
            @click="editTracker(item.id)"
          >
            <Pencil :size="20" />
          </button>
          <button
            type="button"
            class="grid place-items-center bg-rose-100 text-rose-700"
            @click="deleteTracker(item)"
          >
            <Trash2 :size="20" />
          </button>
        </div>
        <button
          type="button"
          class="tracker-link relative w-full text-left"
          :style="cardStyle(item.id)"
          @pointerdown="onPointerDown(item.id, $event)"
          @pointermove="onPointerMove(item.id, $event)"
          @pointerup="endDrag(item.id, $event)"
          @pointercancel="endDrag(item.id, $event)"
          @lostpointercapture="endDrag(item.id)"
          @click="onCardClick(item)"
        >
          <TrackerCard :tracker="item" :show-notes="true" />
        </button>
      </div>
    </div>

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
  </section>
</template>



