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

export const useUiStore = defineStore('ui', () => {
  const toasts = ref<ToastMessage[]>([]);
  const confirm = ref<ConfirmState>({ open: false, title: '', message: '' });

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

  return {
    toasts,
    confirm,
    pushToast,
    askConfirm,
    resolveConfirm,
  };
});

