<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { CalendarDays, FilePenLine, Save } from 'lucide-vue-next';
import type { StoredImage, TrackerItem } from '../../types/tracker';
import ImageUploader from './ImageUploader.vue';
import Card from '../ui/Card.vue';
import Button from '../ui/Button.vue';
import Input from '../ui/Input.vue';

interface FormModel {
  title: string;
  deliveryReceiptDate: string;
}

export interface TrackerSubmitPayload extends Omit<TrackerItem, 'id' | 'createdAt' | 'updatedAt' | 'images'> {
  images: StoredImage[];
  keepImageIds: string[];
}

const props = defineProps<{ tracker?: TrackerItem | null; existingImages?: StoredImage[] }>();
const emit = defineEmits<{ submit: [payload: TrackerSubmitPayload]; removeExisting: [string] }>();

const model = reactive<FormModel>({
  title: '',
  deliveryReceiptDate: '',
});

const addedImages = ref<StoredImage[]>([]);
const keepImageIds = ref<string[]>([]);
const showDateWarning = ref(false);
const isImagesProcessing = ref(false);

watch(
  () => props.tracker,
  (tracker) => {
    if (!tracker) return;
    model.title = tracker.title;
    model.deliveryReceiptDate = tracker.deliveryReceiptDate ? tracker.deliveryReceiptDate.slice(0, 10) : '';
    keepImageIds.value = [...(tracker.images ?? [])];
  },
  { immediate: true },
);

const trackerId = computed(() => props.tracker?.id ?? 'draft');

const submit = () => {
  if (isImagesProcessing.value) return;
  if (!model.deliveryReceiptDate) {
    showDateWarning.value = true;
    return;
  }
  showDateWarning.value = false;
  emit('submit', {
    title: model.title.trim(),
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
        <span class="flex items-center gap-2 text-base font-semibold text-slate-900 md:text-lg">
          <FilePenLine :size="22" class="text-rose-500" />
          Title
        </span>
        <Input v-model="model.title" class="h-[56px] rounded-2xl border-slate-200 bg-slate-50 px-4 text-sm placeholder:text-slate-400 md:h-[72px] md:rounded-3xl md:px-6 md:text-lg" placeholder="What are you tracking?" />
      </label>
      <label class="grid min-w-0 gap-3">
        <span class="flex items-center gap-2 text-base font-semibold text-slate-900 md:text-lg">
          <CalendarDays :size="22" class="text-rose-500" />
          Delivery Receipt Date
        </span>
        <Input
          v-model="model.deliveryReceiptDate"
          type="date"
          class="block h-[56px] w-full min-w-0 max-w-full rounded-2xl border-slate-200 bg-slate-50 px-4 pr-10 text-[16px] leading-tight text-slate-700 md:h-[72px] md:rounded-3xl md:px-6 md:pr-12 md:text-lg"
        />
        <p v-if="showDateWarning" class="text-sm text-[var(--danger)]">Delivery receipt date is required.</p>
      </label>
    </Card>

    <ImageUploader
      :tracker-id="trackerId"
      :existing="existingImages"
      @changed="(files) => (addedImages = files)"
      @processing="(value) => (isImagesProcessing = value)"
      @remove-existing="removeExisting"
    />

    <Button
      type="submit"
      variant="default"
      size="lg"
      :disabled="isImagesProcessing"
      class="h-[56px] w-full rounded-2xl border-none bg-gradient-to-r from-rose-400 to-fuchsia-500 text-sm font-semibold disabled:opacity-60 md:h-[60px] md:rounded-3xl md:text-lg"
    >
      <Save :size="18" />
      Save Tracker
    </Button>
  </form>
</template>


