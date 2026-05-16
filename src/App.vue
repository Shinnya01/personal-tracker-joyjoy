<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { Toaster } from 'vue-sonner';
import AppLockGate from './components/common/AppLockGate.vue';
import ConfirmDialog from './components/common/ConfirmDialog.vue';
import ToastStack from './components/common/ToastStack.vue';
import Card from './components/ui/Card.vue';
import Button from './components/ui/Button.vue';
import Input from './components/ui/Input.vue';
import { useReminders } from './composables/useReminders';
import { ensureSeedData } from './services/seedService';
import { useTrackerStore } from './stores/trackerStore';
import { useSettingsStore } from './stores/settingsStore';

const settingsStore = useSettingsStore();
const trackerStore = useTrackerStore();
const displayNameInput = ref('');

useReminders();

onMounted(async () => {
  await settingsStore.load();
  await ensureSeedData();
  await trackerStore.refresh();
});

const shouldAskName = computed(() => !settingsStore.settings.displayName?.trim());

const saveName = async () => {
  const value = displayNameInput.value.trim();
  if (!value) return;
  await settingsStore.persist({ ...settingsStore.settings, displayName: value });
  displayNameInput.value = '';
};
</script>

<template>
  <AppLockGate />
  <ToastStack />
  <ConfirmDialog />
  <Toaster rich-colors position="top-center" />

  <div v-if="shouldAskName" class="overlay" style="z-index:100">
    <Card class="dialog">
      <h3>Welcome to Tracker</h3>
      <p class="muted">What name should we call you?</p>
      <div class="form-grid" style="margin-top:.7rem;">
        <Input v-model="displayNameInput" placeholder="Enter your name" />
        <Button @click="saveName">Save</Button>
      </div>
    </Card>
  </div>
</template>
