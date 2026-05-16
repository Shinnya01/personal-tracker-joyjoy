<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { RouterLink } from 'vue-router';
import { AlertCircle, BellRing, ClockArrowUp } from 'lucide-vue-next';
import SectionHeader from '../components/common/SectionHeader.vue';
import Card from '../components/ui/Card.vue';
import Badge from '../components/ui/Badge.vue';
import { useTrackerStore } from '../stores/trackerStore';

const trackerStore = useTrackerStore();
onMounted(() => { void trackerStore.refresh(); });
const buckets = computed(() => trackerStore.reminderBuckets);
</script>

<template>
  <section class="stack stack-lg">
    <SectionHeader title="Delivery Dates" subtitle="Today, upcoming, overdue" />

    <div class="segment-row">
      <Badge variant="accent"><BellRing :size="12" /> Today {{ buckets.today.length }}</Badge>
      <Badge><ClockArrowUp :size="12" /> Upcoming {{ buckets.upcoming.length }}</Badge>
      <Badge variant="danger"><AlertCircle :size="12" /> Overdue {{ buckets.overdue.length }}</Badge>
    </div>

    <Card class="panel-card"><h3>Today</h3><ul class="reminder-list"><li v-for="item in buckets.today" :key="item.id"><RouterLink :to="`/trackers/${item.id}`">{{ item.title }}</RouterLink></li></ul></Card>
    <Card class="panel-card"><h3>Upcoming</h3><ul class="reminder-list"><li v-for="item in buckets.upcoming" :key="item.id"><RouterLink :to="`/trackers/${item.id}`">{{ item.title }}</RouterLink></li></ul></Card>
    <Card class="panel-card"><h3>Overdue</h3><ul class="reminder-list"><li v-for="item in buckets.overdue" :key="item.id"><RouterLink :to="`/trackers/${item.id}`">{{ item.title }}</RouterLink></li></ul></Card>
  </section>
</template>

