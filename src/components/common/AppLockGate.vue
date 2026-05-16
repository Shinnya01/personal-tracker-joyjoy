<script setup lang="ts">
import { RouterView } from 'vue-router';
import { onMounted, watch } from 'vue';
import { useSettingsStore } from '../../stores/settingsStore';

const settingsStore = useSettingsStore();

onMounted(async () => {
  await settingsStore.load();
});

watch(
  () => settingsStore.settings.darkMode,
  (mode) => {
    const root = document.documentElement;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldDark = mode === 'dark' || (mode === 'system' && prefersDark);
    root.classList.toggle('dark', shouldDark);
  },
  { immediate: true },
);
</script>

<template>
  <RouterView />
</template>
