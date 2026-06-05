import { computed, onMounted, onUnmounted } from 'vue';
import { useAuthStore } from '../stores/authStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useTrackerStore } from '../stores/trackerStore';
import { useUiStore } from '../stores/uiStore';
import { getReminderCycleState, isReminderDue, monthKey } from '../utils/reminders';

export const useReminders = () => {
  const settingsStore = useSettingsStore();
  const trackerStore = useTrackerStore();
  const uiStore = useUiStore();
  const authStore = useAuthStore();

  let timer: number | undefined;
  const onTrackerCreated = () => {
    void runCheck();
  };

  const runCheck = async () => {
    if (!authStore.isLoggedIn) return;
    if (!settingsStore.isLoaded) {
      await settingsStore.load();
    }
    await trackerStore.refresh();
    if (!settingsStore.settings.reminder.enabled) return;
    const nowDate = new Date();
    const cycleState = getReminderCycleState(nowDate);
    if (cycleState === 'upcoming') return;
    const thisMonthKey = monthKey(nowDate);
    const due = trackerStore.trackers.filter((item) => isReminderDue(item, nowDate));

    for (const item of due) {
      const key = `${item.id}:${thisMonthKey}`;
      if (settingsStore.settings.dismissedReminderMonths?.[key]) continue;

      const statusLabel = cycleState === 'today' ? 'Reminder Due Today' : 'Late Reminder';
      const statusMessage = cycleState === 'today'
        ? `${item.title} should be sent today.`
        : `${item.title} is late and should be sent.`;
      uiStore.showReminderAlert({
        title: statusLabel,
        message: statusMessage,
        trackerId: item.id,
        monthKey: thisMonthKey,
        dedupeKey: key,
      });

      if (!settingsStore.settings.lastReminderEvents?.[key]) {
        uiStore.pushToast({ text: statusMessage, tone: 'warning' });
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(statusLabel, { body: statusMessage });
        }
        await settingsStore.markReminderTriggered(key);
      }
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
    window.addEventListener('tracker-created', onTrackerCreated);
  });
  onUnmounted(() => {
    stop();
    window.removeEventListener('tracker-created', onTrackerCreated);
  });

  return { runCheck };
};

