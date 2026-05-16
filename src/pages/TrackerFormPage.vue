<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { PencilLine, PlusCircle } from 'lucide-vue-next';
import TrackerForm from '../components/tracker/TrackerForm.vue';
import Card from '../components/ui/Card.vue';
import { useTrackerStore } from '../stores/trackerStore';
import { imageRepo } from '../db/repositories/imageRepo';
import { trackerService } from '../services/trackerService';
import type { StoredImage } from '../types/tracker';

const route = useRoute();
const router = useRouter();
const trackerStore = useTrackerStore();
const existingImages = ref<StoredImage[]>([]);

const trackerId = computed(() => (route.params.id ? String(route.params.id) : null));
const tracker = computed(() => (trackerId.value ? trackerStore.getById(trackerId.value) : undefined));

onMounted(async () => {
  await trackerStore.refresh();
  if (trackerId.value) existingImages.value = await imageRepo.listByTrackerId(trackerId.value);
});

const handleSubmit = async (payload: any) => {
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
  <section class="stack stack-lg">
    <Card class="panel-card">
      <h1>{{ trackerId ? 'Edit Tracker' : 'Create Tracker' }}</h1>
      <p class="muted">{{ trackerId ? 'Update delivery details and keep it current.' : 'Capture a new item quickly.' }}</p>
      <p class="muted">{{ trackerId ? '' : 'Add title, category, delivery receipt date and images.' }}</p>
      <div class="chip-row"><span class="chip chip-accent"><PencilLine v-if="trackerId" :size="12" /><PlusCircle v-else :size="12" /> {{ trackerId ? 'Editing' : 'New tracker' }}</span></div>
    </Card>
    <TrackerForm :tracker="tracker" :categories="trackerStore.categories" :existing-images="existingImages" @submit="handleSubmit" @remove-existing="removeExisting" />
  </section>
</template>

