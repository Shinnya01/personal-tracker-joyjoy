<script setup lang="ts">
import { Search } from 'lucide-vue-next';
import type { TrackerFilters } from '../../types/tracker';
import Card from '../ui/Card.vue';
import Input from '../ui/Input.vue';
import Select from '../ui/Select.vue';

const model = defineModel<TrackerFilters>({ required: true });
defineProps<{ categories: string[] }>();
</script>

<template>
  <Card class="filter-panel">
    <div class="icon-input">
      <Search :size="16" />
      <Input v-model="model.search" placeholder="Search trackers..." class="field-with-icon" />
    </div>
    <div class="segmented-row">
      <Select v-model="model.category">
        <option value="All">All Categories</option>
        <option v-for="category in categories" :key="category" :value="category">{{ category }}</option>
      </Select>
      <Select v-model="model.sort">
        <option value="newest">Newest</option>
        <option value="oldest">Oldest</option>
        <option value="deliveryDate">Delivery Date</option>
      </Select>
    </div>
  </Card>
</template>

