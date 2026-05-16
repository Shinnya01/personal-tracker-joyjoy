<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { RouterLink } from 'vue-router';
import { Plus } from 'lucide-vue-next';
import SectionHeader from '../components/common/SectionHeader.vue';
import TrackerCard from '../components/tracker/TrackerCard.vue';
import TrackerFilters from '../components/tracker/TrackerFilters.vue';
import Button from '../components/ui/Button.vue';
import Card from '../components/ui/Card.vue';
import Skeleton from '../components/ui/Skeleton.vue';
import { useTrackerStore } from '../stores/trackerStore';

const trackerStore = useTrackerStore();

onMounted(() => {
  void trackerStore.refresh();
});

const categoryNames = computed(() => trackerStore.categories.map((c) => c.id));
</script>

<template>
  <section class="stack stack-lg">
    <SectionHeader title="Trackers" subtitle="Search, filter, and sort" />
    <TrackerFilters v-model="trackerStore.filters" :categories="categoryNames" />

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

