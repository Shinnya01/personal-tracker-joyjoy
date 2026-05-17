<script setup lang="ts">
import { computed, onBeforeUnmount, watch } from 'vue';
import { useUiStore } from '../../stores/uiStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useTrackerStore } from '../../stores/trackerStore';
import { acquireGlobalScrollLock, releaseGlobalScrollLock } from '../../composables/useGlobalScrollLock';
import Card from '../ui/Card.vue';
import Button from '../ui/Button.vue';
import TrackerCard from '../tracker/TrackerCard.vue';

const uiStore = useUiStore();
const settingsStore = useSettingsStore();
const trackerStore = useTrackerStore();

const alertItems = computed(() => {
  const current = uiStore.reminderAlert.open ? [uiStore.reminderAlert] : [];
  return [...current, ...uiStore.reminderQueue];
});

watch(
  () => uiStore.reminderAlert.open,
  (open) => {
    if (open) acquireGlobalScrollLock('reminder-alert-dialog');
    else releaseGlobalScrollLock('reminder-alert-dialog');
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  releaseGlobalScrollLock('reminder-alert-dialog');
});

const dismissAllAlerts = async () => {
  for (const item of alertItems.value) {
    if (item.trackerId && item.monthKey) {
      await settingsStore.dismissReminderForMonth(item.trackerId, item.monthKey);
    }
    uiStore.dismissReminderAlertByKey(item.dedupeKey);
  }
};
</script>

<template>
  <div v-if="uiStore.reminderAlert.open" class="overlay">
    <Card class="dialog" style="max-width: 520px;">
      <h3>Reminder Alerts</h3>
      <p class="muted">Items due/late this cycle.</p>
      <div class="stack" style="margin-top:.7rem;">
        <Card v-for="item in alertItems" :key="item.dedupeKey || item.title" class="rounded-2xl p-3">
          <TrackerCard v-if="item.trackerId && trackerStore.getById(item.trackerId)" :tracker="trackerStore.getById(item.trackerId)!" />
          <div v-else>
            <p class="text-sm font-semibold text-slate-900">{{ item.title }}</p>
            <p class="muted">{{ item.message }}</p>
          </div>
        </Card>
      </div>
      <div class="dialog-actions">
        <Button @click="dismissAllAlerts">Dismiss All</Button>
      </div>
    </Card>
  </div>
</template>
