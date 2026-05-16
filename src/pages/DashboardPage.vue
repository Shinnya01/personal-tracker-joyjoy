<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { RouterLink } from 'vue-router';
import { CircleDashed, ListChecks } from 'lucide-vue-next';
import Card from '../components/ui/Card.vue';
import Button from '../components/ui/Button.vue';
import { useTrackerStore } from '../stores/trackerStore';
import { useSettingsStore } from '../stores/settingsStore';

const trackerStore = useTrackerStore();
const settingsStore = useSettingsStore();

onMounted(() => {
  void trackerStore.refresh();
});

const greetingText = computed(() => {
  const name = settingsStore.settings.displayName?.trim();
  return name ? `Good morning, ${name}` : 'Good morning';
});

const overviewItems = computed(() => [
  { label: 'Total', value: trackerStore.stats.total, icon: ListChecks, color: 'pink' },
  { label: 'This Month', value: trackerStore.stats.pending, icon: CircleDashed, color: 'orange' },
]);
</script>

<template>
  <section class="dashboard stack stack-lg">
    <div class="hero ui-card">
      <div class="hero-content">
        <p class="greeting">{{ greetingText }}</p>
        <h1 class="headline">Let’s make today count.</h1>
        <p class="subtitle">Stay organized and keep everything on track.</p>
      </div>
      <div class="hero-bg"></div>
    </div>

    <div class="section-title">
      <h2>Overview</h2>
    </div>

    <div class="overview-grid card-grid analytics-grid">
      <div v-for="item in overviewItems" :key="item.label">
        <Card class="stat-card-modern stat-card">
          <div class="stat-icon" :class="item.color">
            <component :is="item.icon" :size="22" />
          </div>
          <p class="stat-label">{{ item.label }}</p>
          <h3 class="stat-value">{{ item.value }}</h3>
        </Card>
      </div>
    </div>

    <Card class="activity-card panel-card">
      <div class="activity-header row-between">
        <h3>Recent Activity</h3>
        <RouterLink to="/trackers" class="view-all inline-link">View all</RouterLink>
      </div>

      <div v-if="trackerStore.activities.length" class="activity-list">
        <div v-for="activity in trackerStore.activities.slice(0, 5)" :key="activity.id" class="activity-item">
          <div class="activity-dot"></div>
          <div>
            <p class="activity-text">{{ activity.message }}</p>
          </div>
        </div>
      </div>

      <div v-else class="empty-state">No recent activity</div>
    </Card>

    <Card class="quick-card panel-card row-between">
      <div>
        <h3>Quick Add Tracker</h3>
        <p class="quick-subtitle muted">Create a new tracker in seconds</p>
      </div>
      <RouterLink to="/trackers/new">
        <Button size="lg" class="pink-button">+ Add</Button>
      </RouterLink>
    </Card>
  </section>
</template>
