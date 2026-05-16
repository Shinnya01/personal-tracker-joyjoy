<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import TrackerForm from '../components/tracker/TrackerForm.vue';
import Card from '../components/ui/Card.vue';
import CardHeader from '../components/ui/CardHeader.vue';
import CardTitle from '../components/ui/CardTitle.vue';
import CardDescription from '../components/ui/CardDescription.vue';
import { useTrackerStore } from '../stores/trackerStore';
import { useUiStore } from '../stores/uiStore';
import { imageRepo } from '../db/repositories/imageRepo';
import { trackerService } from '../services/trackerService';
import type { StoredImage } from '../types/tracker';

const route = useRoute();
const router = useRouter();
const trackerStore = useTrackerStore();
const uiStore = useUiStore();
const existingImages = ref<StoredImage[]>([]);

const trackerId = computed(() => (route.params.id ? String(route.params.id) : null));
const tracker = computed(() => (trackerId.value ? trackerStore.getById(trackerId.value) : undefined));

onMounted(async () => {
  await trackerStore.refresh();
  if (trackerId.value) existingImages.value = await imageRepo.listByTrackerId(trackerId.value);
});

const handleSubmit = async (payload: any) => {
  const normalizedTitle = String(payload.title ?? '').trim().toLowerCase();
  const duplicate = trackerStore.trackers.find(
    (item) => item.id !== trackerId.value && item.title.trim().toLowerCase() === normalizedTitle,
  );
  if (duplicate) {
    uiStore.pushToast({ text: 'Title already exists. Please use a different title.', tone: 'warning' });
    return;
  }

  const { images, keepImageIds, ...base } = payload;
  if (trackerId.value) {
    await trackerStore.upsertTracker({ ...base, images: [...keepImageIds, ...images.map((img: StoredImage) => img.id)] }, trackerId.value);
    await trackerService.saveImages(trackerId.value, images);
  } else {
    const tempId = crypto.randomUUID();
    await trackerStore.upsertTracker({ ...base, images: images.map((img: StoredImage) => img.id) });
    const latest = trackerStore.trackers[0];
    await trackerService.saveImages(latest?.id ?? tempId, images);
  }
  await trackerStore.refresh();
  await router.push('/trackers');
};

const removeExisting = async (imageId: string) => {
  existingImages.value = existingImages.value.filter((image) => image.id !== imageId);
};
</script>

<template>
  <section class="flex flex-col gap-5">
    <Card class="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-gradient-to-b from-white to-rose-50/50 shadow-[var(--shadow-soft)]">
      <CardHeader class="relative z-10 p-5">
      <CardTitle class="mt-2 text-4xl leading-tight font-extrabold text-slate-900">{{ trackerId ? 'Update tracker' : 'Create a tracker' }}</CardTitle>
      <CardDescription class="mt-3 text-sm text-slate-500">{{ trackerId ? 'Update details, receipt date, and images.' : 'Add details, receipt date, and images.' }}</CardDescription>
      </CardHeader>
      <div class="pointer-events-none absolute inset-0 bg-radial-[at_85%_5%] from-rose-300/30 via-transparent to-transparent"></div>
    </Card>
    <TrackerForm :tracker="tracker" :existing-images="existingImages" @submit="handleSubmit" @remove-existing="removeExisting" />
  </section>
</template>
