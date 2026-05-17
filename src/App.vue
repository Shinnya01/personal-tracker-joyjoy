<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { Toaster } from 'vue-sonner';
import AppLockGate from './components/common/AppLockGate.vue';
import ConfirmDialog from './components/common/ConfirmDialog.vue';
import ReminderAlertDialog from './components/common/ReminderAlertDialog.vue';
import Card from './components/ui/Card.vue';
import Button from './components/ui/Button.vue';
import Input from './components/ui/Input.vue';
import { useReminders } from './composables/useReminders';
import { useInteractionRecovery } from './composables/useInteractionRecovery';
import { acquireGlobalScrollLock, releaseGlobalScrollLock } from './composables/useGlobalScrollLock';
import { useTrackerStore } from './stores/trackerStore';
import { useSettingsStore } from './stores/settingsStore';

const settingsStore = useSettingsStore();
const trackerStore = useTrackerStore();
const displayNameInput = ref('');

useReminders();
useInteractionRecovery();

onMounted(async () => {
  await settingsStore.load();
  await trackerStore.refresh();
});

const shouldAskName = computed(() => settingsStore.isLoaded && !settingsStore.settings.displayName?.trim());

watch(
  () => shouldAskName.value,
  (open) => {
    if (open) acquireGlobalScrollLock('welcome-name-dialog');
    else releaseGlobalScrollLock('welcome-name-dialog');
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  releaseGlobalScrollLock('welcome-name-dialog');
});

const saveName = async () => {
  const value = displayNameInput.value.trim();
  if (!value) return;
  await settingsStore.persist({ ...settingsStore.settings, displayName: value });
  displayNameInput.value = '';
};
</script>

<template>
  <AppLockGate />
  <ConfirmDialog />
  <ReminderAlertDialog />
  <Toaster rich-colors position="bottom-right" />

  <div v-if="shouldAskName" class="overlay" style="z-index:100">
    <Card class="dialog">
      <h3>Welcome to Tracker</h3>
      <p class="muted">What name should we call you?</p>
      <form class="form-grid" style="margin-top:.7rem;" @submit.prevent="saveName">
        <Input v-model="displayNameInput" placeholder="Enter your name" />
        <Button type="submit">Save</Button>
      </form>
    </Card>
  </div>
</template>
