<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { CalendarDays, ChevronLeft, ChevronRight, FilePenLine, Save } from 'lucide-vue-next';
import {
  CalendarCell,
  CalendarCellTrigger,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHead,
  CalendarGridRow,
  CalendarHeadCell,
  CalendarHeader,
  CalendarHeading,
  CalendarNext,
  CalendarPrev,
  CalendarRoot,
  PopoverContent,
  PopoverPortal,
  PopoverRoot,
  PopoverTrigger,
} from 'radix-vue';
import { parseDate, type DateValue } from '@internationalized/date';
import type { StoredImage, TrackerItem } from '../../types/tracker';
import ImageUploader from './ImageUploader.vue';
import Card from '../ui/Card.vue';
import Button from '../ui/Button.vue';

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
const pickerOpen = ref(false);
const pickerValue = ref<DateValue | undefined>(undefined);

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

watch(
  () => model.deliveryReceiptDate,
  (value) => {
    const trimmed = value.trim();
    if (!trimmed) {
      pickerValue.value = undefined;
      return;
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      try {
        pickerValue.value = parseDate(trimmed);
      } catch {
        pickerValue.value = undefined;
      }
    }
  },
  { immediate: true },
);

watch(pickerValue, (value) => {
  if (!value) return;
  model.deliveryReceiptDate = value.toString();
  showDateWarning.value = false;
  pickerOpen.value = false;
});

const trackerId = computed(() => props.tracker?.id ?? 'draft');

const submit = () => {
  if (isImagesProcessing.value) return;
  const rawDate = model.deliveryReceiptDate.trim();
  const isValidDateFormat = /^\d{4}-\d{2}-\d{2}$/.test(rawDate);
  if (!rawDate || !isValidDateFormat || Number.isNaN(new Date(rawDate).getTime())) {
    showDateWarning.value = true;
    return;
  }
  showDateWarning.value = false;
  emit('submit', {
    title: model.title.trim(),
    deliveryReceiptDate: new Date(rawDate).toISOString(),
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
        <input
          v-model="model.title"
          class="ui-input h-[56px] rounded-2xl border-slate-200 bg-slate-50 px-4 text-sm placeholder:text-slate-400 md:h-[72px] md:rounded-3xl md:px-6 md:text-lg"
          placeholder="What are you tracking?"
        />
      </label>
      <label class="grid min-w-0 gap-3">
        <span class="flex items-center gap-2 text-base font-semibold text-slate-900 md:text-lg">
          <CalendarDays :size="22" class="text-rose-500" />
          Delivery Receipt Date
        </span>
        <PopoverRoot v-model:open="pickerOpen">
          <PopoverTrigger as-child>
            <button
              type="button"
              class="ui-input block h-[56px] w-full min-w-0 max-w-full rounded-2xl border-slate-200 bg-slate-50 px-4 text-left text-[16px] leading-tight text-slate-700 md:h-[72px] md:rounded-3xl md:px-6 md:text-lg"
            >
              {{ model.deliveryReceiptDate || 'Select date' }}
            </button>
          </PopoverTrigger>
          <PopoverPortal>
            <PopoverContent
              align="start"
              :side-offset="8"
              class="z-50 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3 shadow-[var(--shadow-soft)]"
            >
              <CalendarRoot
                v-model="pickerValue"
                :multiple="false"
                :weekday-format="'short'"
                :fixed-weeks="true"
                class="w-full"
                v-slot="{ grid, weekDays }"
              >
                <CalendarHeader class="mb-2 flex items-center justify-between">
                  <CalendarPrev as-child>
                    <Button type="button" size="icon" variant="secondary">
                      <ChevronLeft :size="16" />
                    </Button>
                  </CalendarPrev>
                  <CalendarHeading class="text-sm font-semibold text-slate-900" />
                  <CalendarNext as-child>
                    <Button type="button" size="icon" variant="secondary">
                      <ChevronRight :size="16" />
                    </Button>
                  </CalendarNext>
                </CalendarHeader>

                <CalendarGrid v-for="month in grid" :key="month.value.toString()" class="w-full">
                  <CalendarGridHead>
                    <CalendarGridRow class="grid grid-cols-7">
                      <CalendarHeadCell
                        v-for="day in weekDays"
                        :key="day"
                        class="pb-1 text-center text-xs font-medium text-slate-500"
                      >
                        {{ day }}
                      </CalendarHeadCell>
                    </CalendarGridRow>
                  </CalendarGridHead>
                  <CalendarGridBody>
                    <CalendarGridRow
                      v-for="(weekDates, index) in month.rows"
                      :key="`week-${index}`"
                      class="grid grid-cols-7"
                    >
                      <CalendarCell
                        v-for="date in weekDates"
                        :key="date.toString()"
                        :date="date"
                        class="grid place-items-center py-0.5"
                      >
                        <CalendarCellTrigger
                          :day="date"
                          :month="month.value"
                          class="grid h-9 w-9 place-items-center rounded-lg text-sm data-[selected]:bg-[var(--accent)] data-[selected]:text-white"
                        />
                      </CalendarCell>
                    </CalendarGridRow>
                  </CalendarGridBody>
                </CalendarGrid>
              </CalendarRoot>
            </PopoverContent>
          </PopoverPortal>
        </PopoverRoot>
        <p v-if="showDateWarning" class="text-sm text-[var(--danger)]">Please select a delivery receipt date.</p>
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


