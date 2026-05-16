<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { CalendarDays, FilePenLine, Save } from 'lucide-vue-next';
import type { Category, StoredImage, TrackerItem } from '../../types/tracker';
import ImageUploader from './ImageUploader.vue';
import Card from '../ui/Card.vue';
import Button from '../ui/Button.vue';
import Input from '../ui/Input.vue';

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
    <Card class="grid gap-7 rounded-4xl p-6">
      <label class="grid gap-3">
        <span class="flex items-center gap-2 text-lg font-semibold text-slate-900">
          <FilePenLine :size="22" class="text-rose-500" />
          Title
        </span>
        <Input v-model="model.title" class="h-[72px] rounded-3xl border-slate-200 bg-slate-50 px-6 text-lg placeholder:text-slate-400" placeholder="What are you tracking?" />
      </label>
      <label class="grid gap-3">
        <span class="flex items-center gap-2 text-lg font-semibold text-slate-900">
          <CalendarDays :size="22" class="text-rose-500" />
          Delivery Receipt Date
        </span>
        <Input v-model="model.deliveryReceiptDate" type="date" class="h-[72px] rounded-3xl border-slate-200 bg-slate-50 px-6 text-lg text-slate-700" />
      </label>
    </Card>

    <ImageUploader :tracker-id="trackerId" :existing="existingImages" @changed="(files) => (addedImages = files)" @remove-existing="removeExisting" />

    <Button
      type="submit"
      variant="default"
      size="lg"
      class="h-[60px] w-full rounded-3xl border-none bg-gradient-to-r from-rose-400 to-fuchsia-500 text-lg font-semibold"
    >
      <Save :size="18" />
      Save Tracker
    </Button>
  </form>
</template>

