import { defineStore } from 'pinia';
import { ref } from 'vue';

export interface ToastMessage {
  id: string;
  text: string;
  tone: 'info' | 'success' | 'warning' | 'error';
}

interface ConfirmState {
  open: boolean;
  title: string;
  message: string;
  resolve?: (accepted: boolean) => void;
}

interface ReminderAlertState {
  open: boolean;
  title: string;
  message: string;
  trackerId?: string;
  monthKey?: string;
  dedupeKey?: string;
}

export const useUiStore = defineStore('ui', () => {
  const toasts = ref<ToastMessage[]>([]);
  const confirm = ref<ConfirmState>({ open: false, title: '', message: '' });
  const reminderAlert = ref<ReminderAlertState>({ open: false, title: '', message: '' });
  const reminderQueue = ref<ReminderAlertState[]>([]);

  const pushToast = ({ text, tone }: Omit<ToastMessage, 'id'>) => {
    const id = crypto.randomUUID();
    toasts.value.push({ id, text, tone });
    window.setTimeout(() => {
      toasts.value = toasts.value.filter((toast) => toast.id !== id);
    }, 3000);
  };

  const askConfirm = (title: string, message: string) =>
    new Promise<boolean>((resolve) => {
      confirm.value = { open: true, title, message, resolve };
    });

  const resolveConfirm = (accepted: boolean) => {
    confirm.value.resolve?.(accepted);
    confirm.value = { open: false, title: '', message: '' };
  };

  const showReminderAlert = (alert: Omit<ReminderAlertState, 'open'>) => {
    const existsInQueue = reminderQueue.value.some((item) => item.dedupeKey && item.dedupeKey === alert.dedupeKey);
    const isCurrent = reminderAlert.value.open && reminderAlert.value.dedupeKey && reminderAlert.value.dedupeKey === alert.dedupeKey;
    if (existsInQueue || isCurrent) return;

    reminderQueue.value.push({ ...alert, open: false });
    if (!reminderAlert.value.open) {
      const next = reminderQueue.value.shift();
      if (next) reminderAlert.value = { ...next, open: true };
    }
  };

  const closeReminderAlert = () => {
    const next = reminderQueue.value.shift();
    if (next) {
      reminderAlert.value = { ...next, open: true };
      return;
    }
    reminderAlert.value = { open: false, title: '', message: '' };
  };

  const dismissReminderAlertByKey = (dedupeKey?: string) => {
    if (!dedupeKey) return;
    reminderQueue.value = reminderQueue.value.filter((item) => item.dedupeKey !== dedupeKey);
    if (reminderAlert.value.dedupeKey === dedupeKey) {
      const next = reminderQueue.value.shift();
      if (next) {
        reminderAlert.value = { ...next, open: true };
      } else {
        reminderAlert.value = { open: false, title: '', message: '' };
      }
    }
  };

  return {
    toasts,
    confirm,
    reminderAlert,
    reminderQueue,
    pushToast,
    askConfirm,
    resolveConfirm,
    showReminderAlert,
    closeReminderAlert,
    dismissReminderAlertByKey,
  };
});

