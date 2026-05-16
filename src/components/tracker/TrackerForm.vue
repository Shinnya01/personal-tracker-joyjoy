<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { Calendar, Tag } from 'lucide-vue-next';
import type { Category, StoredImage, TrackerItem } from '../../types/tracker';
import ImageUploader from './ImageUploader.vue';
import Card from '../ui/Card.vue';
import Button from '../ui/Button.vue';
import Input from '../ui/Input.vue';
import Select from '../ui/Select.vue';

interface FormModel {
  title: string;
  category: string;
  deliveryReceiptDate: string;
}

export interface TrackerSubmitPayload extends Omit<TrackerItem, 'id' | 'createdAt' | 'updatedAt' | 'images'> {
  images: StoredImage[];
  keepImageIds: string[];
}

const props = defineProps<{ tracker?: TrackerItem | null; categories: Category[]; existingImages?: StoredImage[] }>();
const emit = defineEmits<{ submit: [payload: TrackerSubmitPayload]; removeExisting: [string] }>();

const model = reactive<FormModel>({
  title: '',
  category: props.categories[0]?.id ?? 'general',
  deliveryReceiptDate: '',
});

const addedImages = ref<StoredImage[]>([]);
const keepImageIds = ref<string[]>([]);

watch(
  () => props.tracker,
  (tracker) => {
    if (!tracker) return;
    model.title = tracker.title;
    model.category = tracker.category;
    model.deliveryReceiptDate = tracker.deliveryReceiptDate ? tracker.deliveryReceiptDate.slice(0, 10) : '';
    keepImageIds.value = [...(tracker.images ?? [])];
  },
  { immediate: true },
);

const trackerId = computed(() => props.tracker?.id ?? 'draft');

const submit = () => {
  emit('submit', {
    title: model.title.trim(),
    category: model.category,
    deliveryReceiptDate: model.deliveryReceiptDate ? new Date(model.deliveryReceiptDate).toISOString() : undefined,
    images: addedImages.value,
    keepImageIds: keepImageIds.value,
  });
};

const removeExisting = (id: string) => {
  keepImageIds.value = keepImageIds.value.filter((imageId) => imageId !== id);
  emit('removeExisting', id);
};
</script>

<template>
  <form class="form-stack" @submit.prevent="submit">
    <Card class="form-grid premium-form-grid">
      <label class="form-label"><span>Title</span><Input v-model="model.title" placeholder="What are you tracking?" /></label>
      <label class="form-label"><span><Tag :size="14" /> Category</span><Select v-model="model.category"><option v-for="category in categories" :key="category.id" :value="category.id">{{ category.name }}</option></Select></label>
      <label class="form-label"><span><Calendar :size="14" /> Delivery Receipt Date</span><Input v-model="model.deliveryReceiptDate" type="date" /></label>
    </Card>

    <ImageUploader :tracker-id="trackerId" :existing="existingImages" @changed="(files) => (addedImages = files)" @remove-existing="removeExisting" />

    <Button type="submit" variant="default" size="lg">Save Tracker</Button>
  </form>
</template>

