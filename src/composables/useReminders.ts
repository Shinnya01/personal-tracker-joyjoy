import { computed, onMounted, onUnmounted } from 'vue';
import { useSettingsStore } from '../stores/settingsStore';
import { useTrackerStore } from '../stores/trackerStore';
import { useUiStore } from '../stores/uiStore';

export const useReminders = () => {
  const settingsStore = useSettingsStore();
  const trackerStore = useTrackerStore();
  const uiStore = useUiStore();

  let timer: number | undefined;

  const runCheck = async () => {
    if (!settingsStore.isLoaded) {
      await settingsStore.load();
    }
    if (!settingsStore.settings.reminder.enabled) return;
    const now = Date.now();
    const due = trackerStore.trackers.filter((item) => item.deliveryReceiptDate && new Date(item.deliveryReceiptDate).getTime() <= now);

    for (const item of due) {
      const key = `${item.id}:${item.deliveryReceiptDate}`;
      if (settingsStore.settings.lastReminderEvents?.[key]) continue;

      uiStore.pushToast({ text: `Delivery receipt date reached: ${item.title}`, tone: 'warning' });
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Tracker Reminder', { body: item.title });
      }

      await settingsStore.markReminderTriggered(key);
    }
  };

  const start = async () => {
    await runCheck();
    const ms = computed(() => Math.max(settingsStore.settings.reminder.intervalMinutes, 1) * 60000);
    timer = window.setInterval(() => {
      void runCheck();
    }, ms.value);
  };

  const stop = () => {
    if (timer) window.clearInterval(timer);
  };

  onMounted(() => {
    void start();
  });
  onUnmounted(stop);

  return { runCheck };
};

