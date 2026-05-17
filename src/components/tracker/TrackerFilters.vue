<script setup lang="ts">
import { Search } from 'lucide-vue-next';
import type { TrackerFilters } from '../../types/tracker';
import Card from '../ui/Card.vue';
import Input from '../ui/Input.vue';
import Select from '../ui/Select.vue';

const model = defineModel<TrackerFilters>({ required: true });
const SORT_OPTIONS = [
  { label: 'Newest', value: 'newest' },
  { label: 'Oldest', value: 'oldest' },
  { label: 'Delivery Date', value: 'deliveryDate' },
] as const;
const COMPANY_OPTIONS = [
  { label: 'All Companies', value: 'all' },
  { label: 'BIG GOALS CORPORATION', value: 'BIG GOALS CORPORATION' },
  { label: 'BIG GOALS PETROLEUM TRADING', value: 'BIG GOALS PETROLEUM TRADING' },
  { label: 'POSITIVE BUILDERS', value: 'POSITIVE BUILDERS' },
] as const;
</script>

<template>
  <Card class="rounded-3xl p-4">
    <div class="grid grid-cols-1 items-center gap-2">
      <div class="icon-input min-w-0">
        <Search :size="16" />
        <Input v-model="model.search" placeholder="Search trackers..." class="field-with-icon h-11 rounded-2xl text-sm" />
      </div>
      <div class="grid grid-cols-[2fr_1fr] gap-2">
        <Select v-model="model.company" :options="COMPANY_OPTIONS" class="h-11 rounded-2xl text-sm" />
        <Select v-model="model.sort" :options="SORT_OPTIONS" class="h-11 rounded-2xl text-sm" />
      </div>
    </div>
  </Card>
</template>

