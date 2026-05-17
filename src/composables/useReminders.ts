import { computed, onMounted, onUnmounted } from 'vue';
import { useSettingsStore } from '../stores/settingsStore';
import { useTrackerStore } from '../stores/trackerStore';
import { useUiStore } from '../stores/uiStore';

export const useReminders = () => {
  const settingsStore = useSettingsStore();
  const trackerStore = useTrackerStore();
  const uiStore = useUiStore();

  let timer: number | undefined;
  const onTrackerCreated = () => {
    void runCheck();
  };
  const FIXED_DUE_DAY = 5;
  const monthKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  const monthIndex = (date: Date) => date.getFullYear() * 12 + date.getMonth();

  const runCheck = async () => {
    if (!settingsStore.isLoaded) {
      await settingsStore.load();
    }
    await trackerStore.refresh();
    if (!settingsStore.settings.reminder.enabled) return;
    const nowDate = new Date();
    const todayDay = nowDate.getDate();
    if (todayDay < FIXED_DUE_DAY) return;
    const thisMonthKey = monthKey(nowDate);
    const isLate = todayDay > FIXED_DUE_DAY;
    const due = trackerStore.trackers.filter((item) => {
      if (!item.deliveryReceiptDate) return false;
      const base = new Date(item.deliveryReceiptDate);
      if (Number.isNaN(base.getTime())) return false;
      if (monthIndex(nowDate) <= monthIndex(base)) return false;
      return true;
    });

    for (const item of due) {
      const key = `${item.id}:${thisMonthKey}`;
      if (settingsStore.settings.dismissedReminderMonths?.[key]) continue;

      const statusLabel = isLate ? 'Late Reminder' : 'Reminder Due Today';
      const statusMessage = isLate
        ? `${item.title} is late and should be sent.`
        : `${item.title} should be sent today.`;
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


