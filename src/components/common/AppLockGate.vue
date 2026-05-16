<script setup lang="ts">
import { RouterView } from 'vue-router';
import { onMounted, watch } from 'vue';
import { LockKeyhole } from 'lucide-vue-next';
import { useSettingsStore } from '../../stores/settingsStore';
import { useAppLock } from '../../composables/useAppLock';
import Card from '../ui/Card.vue';
import Button from '../ui/Button.vue';
import Input from '../ui/Input.vue';

const settingsStore = useSettingsStore();
const lock = useAppLock();

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

const pinModel = defineModel<string>('pin', { default: '' });

const submitPin = async () => {
  const ok = await lock.unlockWithPin(pinModel.value);
  if (!ok) {
    alert('Invalid PIN');
  }
  pinModel.value = '';
};
</script>

<template>
  <Card v-if="lock.lockEnabled && !lock.isUnlocked" class="lock-screen">
    <h1><LockKeyhole :size="18" /> Unlock Tracker</h1>
    <p class="muted">Enter your PIN to continue.</p>
    <form class="form-grid" @submit.prevent="submitPin">
      <Input v-model="pinModel" type="password" placeholder="PIN" />
      <Button type="submit">Unlock</Button>
    </form>
  </Card>
  <RouterView v-else />
</template>

