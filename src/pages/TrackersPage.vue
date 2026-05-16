<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import { ChevronLeft, ChevronRight, X } from 'lucide-vue-next';
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
import { imageRepo } from '../db/repositories/imageRepo';
import type { StoredImage, TrackerItem } from '../types/tracker';

const trackerStore = useTrackerStore();
const selectedImageUrl = ref<string | null>(null);
const imageDialogOpen = ref(false);
const selectedImages = ref<StoredImage[]>([]);
const selectedImageIndex = ref(0);
const selectedTracker = ref<TrackerItem | null>(null);

const objectUrls = new Map<string, string>();

onMounted(() => {
  void trackerStore.refresh();
});

onBeforeUnmount(() => {
  objectUrls.forEach((url) => URL.revokeObjectURL(url));
  objectUrls.clear();
});

const closeImageDialog = () => {
  imageDialogOpen.value = false;
  selectedImageUrl.value = null;
  selectedImages.value = [];
  selectedImageIndex.value = 0;
  selectedTracker.value = null;
};

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
      <button
        v-for="item in trackerStore.filteredTrackers"
        :key="item.id"
        type="button"
        class="tracker-link text-left"
        @click="openTrackerImagePreview(item)"
      >
        <TrackerCard :tracker="item" />
      </button>
    </div>

    <Dialog :open="imageDialogOpen" @update:open="(open) => !open && closeImageDialog()">
      <DialogContent>
        <div class="stack">
          <div class="row-between">
            <div>
              <p class="text-sm font-semibold text-slate-900">{{ selectedTracker?.title }}</p>
              <p v-if="selectedTracker?.deliveryReceiptDate" class="text-xs text-slate-500">
                Delivery Receipt: {{ new Date(selectedTracker.deliveryReceiptDate).toLocaleDateString() }}
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
          <p v-if="selectedImages.length > 1" class="text-center text-xs font-medium text-slate-500">
            {{ selectedImageIndex + 1 }}/{{ selectedImages.length }}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  </section>
</template>


