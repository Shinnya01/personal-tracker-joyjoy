<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { Building2, CalendarDays, ChevronLeft, ChevronRight, FilePenLine, NotebookText, Save } from 'lucide-vue-next';
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
import { parseDate } from '@internationalized/date';
import type { StoredImage, TrackerItem } from '../../types/tracker';
import { CATEGORY_OPTIONS, COMPANY_OPTIONS } from '../../constants/trackerOptions';
import ImageUploader from './ImageUploader.vue';
import Card from '../ui/Card.vue';
import Button from '../ui/Button.vue';
import Switch from '../ui/Switch.vue';
import Select from '../ui/Select.vue';
import Input from '../ui/Input.vue';
import Textarea from '../ui/Textarea.vue';

interface FormModel {
  title: string;
  company: string;
  category: string;
  notes: string;
  deliveryReceiptDate: string;
  deliveryReceiptEndDate: string;
}

export interface TrackerSubmitPayload extends Omit<TrackerItem, 'id' | 'createdAt' | 'updatedAt' | 'images'> {
  images: StoredImage[];
  keepImageIds: string[];
}

const props = withDefaults(defineProps<{ tracker?: TrackerItem | null; existingImages?: StoredImage[]; isSubmitting?: boolean }>(), {
  isSubmitting: false,
});
const emit = defineEmits<{ submit: [payload: TrackerSubmitPayload]; removeExisting: [string] }>();

const model = reactive<FormModel>({
  title: '',
  company: '',
  category: '',
  notes: '',
  deliveryReceiptDate: '',
  deliveryReceiptEndDate: '',
});

const addedImages = ref<StoredImage[]>([]);
const keepImageIds = ref<string[]>([]);
const showDateWarning = ref(false);
const showCompanyWarning = ref(false);
const showCategoryWarning = ref(false);
const isImagesProcessing = ref(false);
const pickerOpen = ref(false);
const pickerValue = ref<any>(undefined);
const isRangeEnabled = ref(false);

watch(
  () => props.tracker,
  (tracker) => {
    if (!tracker) return;
    model.title = tracker.title;
    model.company = tracker.company ?? '';
    model.category = tracker.category ?? '';
    model.notes = tracker.notes ?? '';
    model.deliveryReceiptDate = tracker.deliveryReceiptDate ? tracker.deliveryReceiptDate.slice(0, 10) : '';
    model.deliveryReceiptEndDate = tracker.deliveryReceiptEndDate ? tracker.deliveryReceiptEndDate.slice(0, 10) : '';
    isRangeEnabled.value = Boolean(model.deliveryReceiptEndDate);
    keepImageIds.value = [...(tracker.images ?? [])];
  },
  { immediate: true },
);

const syncPickerFromModel = () => {
  const start = model.deliveryReceiptDate.trim();
  const end = model.deliveryReceiptEndDate.trim();
  if (!start) {
    pickerValue.value = undefined;
    return;
  }
  try {
    const startDate = parseDate(start);
    if (isRangeEnabled.value) {
      pickerValue.value = end ? [startDate, parseDate(end)] : [startDate];
    } else {
      pickerValue.value = startDate;
    }
  } catch {
    pickerValue.value = undefined;
  }
};

watch(
  () => [model.deliveryReceiptDate, model.deliveryReceiptEndDate, isRangeEnabled.value],
  () => {
    syncPickerFromModel();
  },
  { immediate: true },
);

watch(pickerValue, (value) => {
  if (!value) return;
  if (isRangeEnabled.value) {
    const rawValues = (Array.isArray(value) ? value : [value])
      .map((item) => String(item.toString()))
      .filter(Boolean)
      .sort();
    const values = rawValues.filter((item) => item <= todayKey);
    if (values.length !== rawValues.length) {
      if (!values.length) {
        syncPickerFromModel();
        return;
      }
      pickerValue.value = values.map((item) => parseDate(item));
      return;
    }
    if (!values.length) return;
    model.deliveryReceiptDate = values[0];
    model.deliveryReceiptEndDate = values[1] ?? '';
    showDateWarning.value = false;
    if (values[1]) pickerOpen.value = false;
    return;
  }
  const picked = Array.isArray(value) ? value[0] : value;
  const pickedKey = String(picked.toString());
  if (pickedKey > todayKey) {
    syncPickerFromModel();
    return;
  }
  model.deliveryReceiptDate = pickedKey;
  model.deliveryReceiptEndDate = '';
  showDateWarning.value = false;
  pickerOpen.value = false;
});

watch(isRangeEnabled, (enabled) => {
  if (!enabled) {
    model.deliveryReceiptEndDate = '';
    if (Array.isArray(pickerValue.value)) {
      pickerValue.value = pickerValue.value[0];
    }
  } else if (model.deliveryReceiptDate.trim()) {
    syncPickerFromModel();
  }
});

const trackerId = computed(() => props.tracker?.id ?? 'draft');
const dateLabel = computed(() => {
  const start = model.deliveryReceiptDate.trim();
  const end = model.deliveryReceiptEndDate.trim();
  if (start && end) return `${start} - ${end}`;
  return start || 'Select date';
});
const selectedRange = computed(() => {
  if (!isRangeEnabled.value || !Array.isArray(pickerValue.value)) return null;
  const values = pickerValue.value
    .map((item: any) => String(item.toString()))
    .filter(Boolean)
    .sort();
  if (!values.length) return null;
  return {
    start: values[0],
    end: values[1] ?? values[0],
  };
});

const dateToKey = (date: any) => String(date?.toString?.() ?? '');

const isRangeStart = (date: any) => {
  const key = dateToKey(date);
  return Boolean(selectedRange.value && key === selectedRange.value.start);
};

const isRangeEnd = (date: any) => {
  const key = dateToKey(date);
  return Boolean(selectedRange.value && key === selectedRange.value.end);
};

const isInRange = (date: any) => {
  if (!selectedRange.value) return false;
  const key = dateToKey(date);
  return key > selectedRange.value.start && key < selectedRange.value.end;
};

const todayKey = (() => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
})();

const isFutureDate = (date: any) => dateToKey(date) > todayKey;

const setToday = () => {
  const today = parseDate(todayKey);
  if (isRangeEnabled.value) {
    pickerValue.value = [today];
    model.deliveryReceiptDate = todayKey;
    model.deliveryReceiptEndDate = '';
  } else {
    pickerValue.value = today;
    model.deliveryReceiptDate = todayKey;
    model.deliveryReceiptEndDate = '';
  }
  showDateWarning.value = false;
};

const submit = () => {
  if (isImagesProcessing.value || props.isSubmitting) return;
  const hasCompany = Boolean(model.company.trim());
  const hasCategory = Boolean(model.category.trim());
  showCompanyWarning.value = !hasCompany;
  showCategoryWarning.value = !hasCategory;
  const rawDate = model.deliveryReceiptDate.trim();
  const rawEndDate = model.deliveryReceiptEndDate.trim();
  const isValidDateFormat = /^\d{4}-\d{2}-\d{2}$/.test(rawDate);
  const isValidEndDateFormat = !rawEndDate || /^\d{4}-\d{2}-\d{2}$/.test(rawEndDate);
  const startTime = new Date(rawDate).getTime();
  const endTime = rawEndDate ? new Date(rawEndDate).getTime() : NaN;
  const todayTime = new Date(todayKey).getTime();
  const needsRangeEnd = isRangeEnabled.value && !rawEndDate;

  const hasDateError =
    !rawDate ||
    !isValidDateFormat ||
    Number.isNaN(startTime) ||
    !isValidEndDateFormat ||
    (!!rawEndDate && Number.isNaN(endTime)) ||
    needsRangeEnd ||
    (!!rawEndDate && endTime < startTime) ||
    startTime > todayTime ||
    (!!rawEndDate && endTime > todayTime);
  showDateWarning.value = hasDateError;

  if (!hasCompany || !hasCategory || hasDateError) return;

  emit('submit', {
    title: model.title.trim(),
    company: model.company,
    category: model.category,
    notes: model.notes.trim(),
    deliveryReceiptDate: new Date(rawDate).toISOString(),
    deliveryReceiptEndDate: rawEndDate ? new Date(rawEndDate).toISOString() : undefined,
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
        <Input
          v-model="model.title"
          class="ui-input rounded-2xl border-slate-200 bg-slate-50 text-sm placeholder:text-slate-400 md:rounded-3xl md:text-lg"
          placeholder="What are you tracking?"
        />
      </label>
      <label class="grid gap-3">
        <span class="flex items-center gap-2 text-base font-semibold text-slate-900 md:text-lg">
          <Building2 :size="22" class="text-rose-500" />
          Company
        </span>
        <Select
          v-model="model.company"
          :options="COMPANY_OPTIONS"
          placeholder="Select company"
          class="rounded-2xl border-slate-200 bg-slate-50 text-sm md:rounded-3xl md:text-lg"
        />
        <p v-if="showCompanyWarning" class="text-sm text-[var(--danger)]">Please select a company.</p>
      </label>
      <label class="grid gap-3">
        <span class="flex items-center gap-2 text-base font-semibold text-slate-900 md:text-lg">
          <Building2 :size="22" class="text-rose-500" />
          Category
        </span>
        <Select
          v-model="model.category"
          :options="CATEGORY_OPTIONS"
          placeholder="Select category"
          class="rounded-2xl border-slate-200 bg-slate-50 text-sm md:rounded-3xl md:text-lg"
        />
        <p v-if="showCategoryWarning" class="text-sm text-[var(--danger)]">Please select a category.</p>
      </label>
      <label class="grid gap-3">
        <span class="flex items-center gap-2 text-base font-semibold text-slate-900 md:text-lg">
          <NotebookText :size="22" class="text-rose-500" />
          Note
        </span>
        <Textarea
          v-model="model.notes"
          class="ui-input ui-textarea rounded-2xl border-slate-200 bg-slate-50 text-sm placeholder:text-slate-400 md:rounded-3xl md:text-base"
          placeholder="Add notes for this tracker"
        />
      </label>
      <div class="grid min-w-0 gap-3">
        <span class="flex items-center gap-2 text-base font-semibold text-slate-900 md:text-lg">
          <CalendarDays :size="22" class="text-rose-500" />
          Delivery Receipt Date
        </span>
        <PopoverRoot v-model:open="pickerOpen">
          <PopoverTrigger as-child>
            <button
              type="button"
              class="ui-input block w-full min-w-0 max-w-full rounded-2xl border-slate-200 bg-slate-50 text-left text-[16px] leading-tight text-slate-700  md:rounded-3xl md:text-lg"
            >
              {{ dateLabel }}
            </button>
          </PopoverTrigger>
          <PopoverPortal>
            <PopoverContent
              side="bottom"
              align="start"
              :align-offset="0"
              :side-offset="8"
              :avoid-collisions="false"
              class="z-50 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3 shadow-[var(--shadow-soft)]"
            >
              <div class="mb-2 flex items-center justify-end">
                <div class="flex items-center gap-2">
                  <span class="text-xs font-medium text-slate-600">Range</span>
                  <Switch v-model="isRangeEnabled" />
                </div>
              </div>
              <CalendarRoot
                v-model="pickerValue"
                :multiple="isRangeEnabled"
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
                          :disabled="isFutureDate(date)"
                          :class="[
                            'grid h-9 w-9 place-items-center rounded-lg text-sm transition-colors',
                            isInRange(date) ? 'bg-rose-100 text-rose-700' : '',
                            isRangeStart(date) || isRangeEnd(date) ? 'bg-[var(--accent)] text-white' : '',
                            !isRangeStart(date) && !isRangeEnd(date) ? 'data-[selected]:bg-[var(--accent)] data-[selected]:text-white' : '',
                            isFutureDate(date) ? 'cursor-not-allowed opacity-35' : '',
                          ]"
                        />
                      </CalendarCell>
                    </CalendarGridRow>
                  </CalendarGridBody>
                </CalendarGrid>
              </CalendarRoot>
              <div class="mt-3 flex justify-end gap-2">
                <Button type="button" size="sm" variant="secondary" @click="setToday">Today</Button>
                <Button type="button" size="sm" @click="pickerOpen = false">Done</Button>
              </div>
            </PopoverContent>
          </PopoverPortal>
        </PopoverRoot>
        <p v-if="showDateWarning" class="text-sm text-[var(--danger)]">
          {{
            isRangeEnabled
              ? 'Please select a valid start and end date range not beyond today.'
              : 'Please select a valid delivery receipt date not beyond today.'
          }}
        </p>
      </div>
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
      :disabled="isImagesProcessing || props.isSubmitting"
      class="h-[56px] w-full rounded-2xl border-none bg-gradient-to-r from-rose-400 to-fuchsia-500 text-sm font-semibold disabled:opacity-60 md:h-[60px] md:rounded-3xl md:text-lg"
    >
      <Save :size="18" />
      Save Tracker
    </Button>
  </form>
</template>
