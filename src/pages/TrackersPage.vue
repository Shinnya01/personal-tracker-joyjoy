<script setup lang="ts">
import { onMounted } from 'vue';
import { RouterLink } from 'vue-router';
import { Plus } from 'lucide-vue-next';
import TrackerCard from '../components/tracker/TrackerCard.vue';
import TrackerFilters from '../components/tracker/TrackerFilters.vue';
import Button from '../components/ui/Button.vue';
import Card from '../components/ui/Card.vue';
import CardHeader from '../components/ui/CardHeader.vue';
import CardTitle from '../components/ui/CardTitle.vue';
import CardDescription from '../components/ui/CardDescription.vue';
import Skeleton from '../components/ui/Skeleton.vue';
import { useTrackerStore } from '../stores/trackerStore';

const trackerStore = useTrackerStore();

onMounted(() => {
  void trackerStore.refresh();
});
</script>

<template>
  <section class="flex flex-col gap-5">
    <Card class="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-gradient-to-b from-white to-rose-50/50 shadow-[var(--shadow-soft)]">
      <CardHeader class="relative z-10 p-6">
        <CardTitle class="text-4xl leading-tight font-extrabold text-slate-900">Trackers</CardTitle>
        <CardDescription class="mt-3 text-sm text-slate-500">Search and sort your records.</CardDescription>
      </CardHeader>
      <div class="pointer-events-none absolute inset-0 bg-radial-[at_85%_5%] from-rose-300/30 via-transparent to-transparent"></div>
    </Card>

    <TrackerFilters v-model="trackerStore.filters" />

    <div class="stack">
      <RouterLink to="/trackers/new"><Button size="lg"><Plus :size="16" /> Add tracker</Button></RouterLink>
      <Skeleton v-if="trackerStore.isLoading" class="h-24 w-full" />
      <Card v-else-if="!trackerStore.filteredTrackers.length" class="empty-state">No trackers found. Create your first tracker.</Card>
      <RouterLink v-for="item in trackerStore.filteredTrackers" :key="item.id" :to="`/trackers/${item.id}`" class="tracker-link">
        <TrackerCard :tracker="item" />
      </RouterLink>
    </div>
  </section>
</template>

