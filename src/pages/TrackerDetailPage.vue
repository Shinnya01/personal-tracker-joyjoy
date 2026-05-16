<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { CalendarClock, Pencil, Trash2 } from 'lucide-vue-next';
import { useTrackerStore } from '../stores/trackerStore';
import { imageRepo } from '../db/repositories/imageRepo';
import type { StoredImage } from '../types/tracker';
import { useUiStore } from '../stores/uiStore';
import Card from '../components/ui/Card.vue';
import Button from '../components/ui/Button.vue';
import Badge from '../components/ui/Badge.vue';

const route = useRoute();
const router = useRouter();
const trackerStore = useTrackerStore();
const uiStore = useUiStore();
const images = ref<StoredImage[]>([]);

const createObjectUrl = (blob: Blob) => window.URL.createObjectURL(blob);
const trackerId = computed(() => String(route.params.id));
const tracker = computed(() => trackerStore.getById(trackerId.value));

onMounted(async () => {
  await trackerStore.refresh();
  images.value = await imageRepo.listByTrackerId(trackerId.value);
});

const remove = async () => {
  const ok = await uiStore.askConfirm('Delete tracker', 'This action cannot be undone.');
  if (!ok) return;
  await trackerStore.deleteTracker(trackerId.value);
  await router.push('/trackers');
};
</script>

<template>
  <section v-if="tracker" class="stack stack-lg detail-page">
    <Card class="panel-card">
      <h1 class="detail-title">{{ tracker.title }}</h1>
      <div class="chip-row"><Badge>{{ tracker.category }}</Badge></div>
      <p v-if="tracker.deliveryReceiptDate" class="meta-line"><CalendarClock :size="14" /> Delivery Receipt: {{ new Date(tracker.deliveryReceiptDate).toLocaleDateString() }}</p>
    </Card>

    <Card class="panel-card">
      <h3>Gallery</h3>
      <div class="image-grid image-grid-large">
        <img v-for="image in images" :key="image.id" :src="createObjectUrl(image.blob)" alt="tracker image" />
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

