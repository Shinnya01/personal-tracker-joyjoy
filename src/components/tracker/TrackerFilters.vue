<script setup lang="ts">
import { Search } from 'lucide-vue-next';
import type { TrackerFilters } from '../../types/tracker';
import Card from '../ui/Card.vue';
import Input from '../ui/Input.vue';
import Select from '../ui/Select.vue';

const model = defineModel<TrackerFilters>({ required: true });
</script>

<template>
  <Card class="rounded-3xl p-4">
    <div class="grid grid-cols-[1fr_auto] items-center gap-2">
      <div class="icon-input min-w-0">
        <Search :size="16" />
        <Input v-model="model.search" placeholder="Search trackers..." class="field-with-icon h-11 rounded-2xl text-sm" />
      </div>
      <Select v-model="model.sort" class="h-11 min-w-[124px] rounded-2xl px-3 text-sm">
        <option value="newest">Newest</option>
        <option value="oldest">Oldest</option>
        <option value="deliveryDate">Delivery Date</option>
      </Select>
    </div>
  </Card>
</template>

