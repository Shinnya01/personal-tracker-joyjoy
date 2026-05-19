<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { Search, ChevronLeft, ChevronRight } from 'lucide-vue-next';
import { parseDate } from '@internationalized/date';
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
import type { TrackerFilters } from '../../types/tracker';
import { CATEGORY_FILTER_OPTIONS, COMPANY_FILTER_OPTIONS } from '../../constants/trackerOptions';
import Card from '../ui/Card.vue';
import Input from '../ui/Input.vue';
import Select from '../ui/Select.vue';
import Button from '../ui/Button.vue';

const model = defineModel<TrackerFilters>({ required: true });
const SORT_OPTIONS = [
  { label: 'Newest', value: 'newest' },
  { label: 'Oldest', value: 'oldest' },
  { label: 'Delivery Date', value: 'deliveryDate' },
] as const;

const startOpen = ref(false);
const endOpen = ref(false);
const startValue = ref<any>(undefined);
const endValue = ref<any>(undefined);

const todayKey = (() => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
})();

const startLabel = computed(() => model.value.updatedAtStart || 'Updated start');
const endLabel = computed(() => model.value.updatedAtEnd || 'Updated end');

watch(
  () => model.value.updatedAtStart,
  (value) => {
    startValue.value = value ? parseDate(value) : undefined;
  },
  { immediate: true },
);

watch(
  () => model.value.updatedAtEnd,
  (value) => {
    endValue.value = value ? parseDate(value) : undefined;
  },
  { immediate: true },
);

watch(startValue, (value) => {
  if (!value) return;
  const key = String(value.toString());
  if (key > todayKey) return;
  model.value.updatedAtStart = key;
  if (model.value.updatedAtEnd && model.value.updatedAtEnd < key) {
    model.value.updatedAtEnd = key;
    endValue.value = parseDate(key);
  }
  startOpen.value = false;
});

watch(endValue, (value) => {
  if (!value) return;
  const key = String(value.toString());
  if (key > todayKey) return;
  model.value.updatedAtEnd = key;
  if (model.value.updatedAtStart && model.value.updatedAtStart > key) {
    model.value.updatedAtStart = key;
    startValue.value = parseDate(key);
  }
  endOpen.value = false;
});

const clearStart = () => {
  model.value.updatedAtStart = '';
  startValue.value = undefined;
};

const clearEnd = () => {
  model.value.updatedAtEnd = '';
  endValue.value = undefined;
};
</script>

<template>
  <Card class="rounded-3xl p-4">
    <div class="grid grid-cols-1 items-center gap-2">
      <div class="grid grid-cols-[2fr_1fr] gap-2">
        <div class="icon-input min-w-0">
          <Search :size="16" />
          <Input v-model="model.search" placeholder="Search trackers..." class="field-with-icon h-11 rounded-2xl text-sm" />
        </div>
        <Select v-model="model.sort" :options="SORT_OPTIONS" class="h-11 rounded-2xl text-sm" />
      </div>
      <div class="grid grid-cols-2 gap-2">
        <Select v-model="model.company" :options="COMPANY_FILTER_OPTIONS" class="h-11 rounded-2xl text-sm" />
        <Select v-model="model.category" :options="CATEGORY_FILTER_OPTIONS" class="h-11 rounded-2xl text-sm" />
      </div>
      <div class="grid gap-1">
        <p class="px-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">Updated At Filter</p>
      </div>
      <div class="grid grid-cols-2 gap-2">
        <PopoverRoot v-model:open="startOpen">
          <PopoverTrigger as-child>
            <button type="button" class="ui-input h-11 rounded-2xl bg-slate-50 text-left text-sm">{{ startLabel }}</button>
          </PopoverTrigger>
          <PopoverPortal>
            <PopoverContent
              side="bottom"
              align="start"
              :side-offset="8"
              :avoid-collisions="false"
              class="z-50 w-[min(20rem,calc(100vw-2rem))] rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3 shadow-[var(--shadow-soft)]"
            >
              <CalendarRoot v-model="startValue" :weekday-format="'short'" :fixed-weeks="true" class="w-full" v-slot="{ grid, weekDays }">
                <CalendarHeader class="mb-2 flex items-center justify-between">
                  <CalendarPrev as-child>
                    <Button type="button" size="icon" variant="secondary"><ChevronLeft :size="16" /></Button>
                  </CalendarPrev>
                  <CalendarHeading class="text-sm font-semibold text-slate-900" />
                  <CalendarNext as-child>
                    <Button type="button" size="icon" variant="secondary"><ChevronRight :size="16" /></Button>
                  </CalendarNext>
                </CalendarHeader>
                <CalendarGrid v-for="month in grid" :key="month.value.toString()" class="w-full">
                  <CalendarGridHead>
                    <CalendarGridRow class="grid grid-cols-7">
                      <CalendarHeadCell v-for="day in weekDays" :key="day" class="pb-1 text-center text-xs font-medium text-slate-500">{{ day }}</CalendarHeadCell>
                    </CalendarGridRow>
                  </CalendarGridHead>
                  <CalendarGridBody>
                    <CalendarGridRow v-for="(weekDates, index) in month.rows" :key="`start-week-${index}`" class="grid grid-cols-7">
                      <CalendarCell v-for="date in weekDates" :key="date.toString()" :date="date" class="grid place-items-center py-0.5">
                        <CalendarCellTrigger
                          :day="date"
                          :month="month.value"
                          :disabled="String(date.toString()) > todayKey"
                          class="grid h-9 w-9 place-items-center rounded-lg text-sm transition-colors data-[selected]:bg-[var(--accent)] data-[selected]:text-white disabled:cursor-not-allowed disabled:opacity-35"
                        />
                      </CalendarCell>
                    </CalendarGridRow>
                  </CalendarGridBody>
                </CalendarGrid>
              </CalendarRoot>
              <div class="mt-2 flex justify-end"><Button type="button" size="sm" variant="secondary" @click="clearStart">Clear</Button></div>
            </PopoverContent>
          </PopoverPortal>
        </PopoverRoot>

        <PopoverRoot v-model:open="endOpen">
          <PopoverTrigger as-child>
            <button type="button" class="ui-input h-11 rounded-2xl bg-slate-50 text-left text-sm">{{ endLabel }}</button>
          </PopoverTrigger>
          <PopoverPortal>
            <PopoverContent
              side="bottom"
              align="start"
              :side-offset="8"
              :avoid-collisions="false"
              class="z-50 w-[min(20rem,calc(100vw-2rem))] rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3 shadow-[var(--shadow-soft)]"
            >
              <CalendarRoot v-model="endValue" :weekday-format="'short'" :fixed-weeks="true" class="w-full" v-slot="{ grid, weekDays }">
                <CalendarHeader class="mb-2 flex items-center justify-between">
                  <CalendarPrev as-child>
                    <Button type="button" size="icon" variant="secondary"><ChevronLeft :size="16" /></Button>
                  </CalendarPrev>
                  <CalendarHeading class="text-sm font-semibold text-slate-900" />
                  <CalendarNext as-child>
                    <Button type="button" size="icon" variant="secondary"><ChevronRight :size="16" /></Button>
                  </CalendarNext>
                </CalendarHeader>
                <CalendarGrid v-for="month in grid" :key="month.value.toString()" class="w-full">
                  <CalendarGridHead>
                    <CalendarGridRow class="grid grid-cols-7">
                      <CalendarHeadCell v-for="day in weekDays" :key="day" class="pb-1 text-center text-xs font-medium text-slate-500">{{ day }}</CalendarHeadCell>
                    </CalendarGridRow>
                  </CalendarGridHead>
                  <CalendarGridBody>
                    <CalendarGridRow v-for="(weekDates, index) in month.rows" :key="`end-week-${index}`" class="grid grid-cols-7">
                      <CalendarCell v-for="date in weekDates" :key="date.toString()" :date="date" class="grid place-items-center py-0.5">
                        <CalendarCellTrigger
                          :day="date"
                          :month="month.value"
                          :disabled="String(date.toString()) > todayKey"
                          class="grid h-9 w-9 place-items-center rounded-lg text-sm transition-colors data-[selected]:bg-[var(--accent)] data-[selected]:text-white disabled:cursor-not-allowed disabled:opacity-35"
                        />
                      </CalendarCell>
                    </CalendarGridRow>
                  </CalendarGridBody>
                </CalendarGrid>
              </CalendarRoot>
              <div class="mt-2 flex justify-end"><Button type="button" size="sm" variant="secondary" @click="clearEnd">Clear</Button></div>
            </PopoverContent>
          </PopoverPortal>
        </PopoverRoot>
      </div>
    </div>
  </Card>
</template>
