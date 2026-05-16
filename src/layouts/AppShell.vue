<script setup lang="ts">
import { RouterLink, RouterView, useRoute } from 'vue-router';
import { computed } from 'vue';
import { Bell, CirclePlus, House, ListTodo, Plus, Settings } from 'lucide-vue-next';
import { routeNames } from '../router';

const route = useRoute();

const tabs: Array<{ name: string; label: string; to: { name: string }; fab: boolean; icon: any }> = [
  { name: routeNames.dashboard, label: 'Home', to: { name: routeNames.dashboard }, fab: false, icon: House },
  { name: routeNames.trackers, label: 'Tracker', to: { name: routeNames.trackers }, fab: false, icon: ListTodo },
  { name: routeNames.trackerNew, label: '', to: { name: routeNames.trackerNew }, fab: true, icon: Plus },
  { name: routeNames.reminders, label: 'Reminders', to: { name: routeNames.reminders }, fab: false, icon: Bell },
  { name: routeNames.settings, label: 'Settings', to: { name: routeNames.settings }, fab: false, icon: Settings },
];

const currentPath = computed(() => route.path);

const isActive = (tabName: string) => {
  if (tabName === routeNames.trackers) return currentPath.value.startsWith('/trackers') && currentPath.value !== '/trackers/new';
  if (tabName === routeNames.trackerNew) return currentPath.value === '/trackers/new';
  if (tabName === routeNames.dashboard) return currentPath.value === '/';
  return route.name === tabName;
};
</script>

<template>
  <div class="app-shell">
    <main class="app-main">
      <RouterView v-slot="{ Component }">
        <Transition name="route-fade" mode="out-in">
          <component :is="Component" />
        </Transition>
      </RouterView>
    </main>

    <nav class="tab-bar-glass w-full max-w-full overflow-x-hidden overflow-y-visible grid grid-cols-5" aria-label="Primary">
      <RouterLink
        v-for="tab in tabs"
        :key="tab.name"
        :to="tab.to"
        class="tab-link min-w-0 max-w-full overflow-hidden"
        :class="{ 'tab-link--active': isActive(tab.name), 'tab-link--fab': tab.fab }"
      >
        <component :is="tab.icon" :size="tab.fab ? 17 : 16" class="shrink-0" />
        <span class="block w-full truncate text-center">{{ tab.label }}</span>
      </RouterLink>
    </nav>
  </div>
</template>


