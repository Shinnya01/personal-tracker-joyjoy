import { ref } from 'vue';
import { useAuthStore } from '../stores/authStore';
import { useTrackerStore } from '../stores/trackerStore';
import { useUiStore } from '../stores/uiStore';
import { syncService } from '../services/syncService';

export const useManualSync = () => {
  const authStore = useAuthStore();
  const trackerStore = useTrackerStore();
  const uiStore = useUiStore();
  const isSyncing = ref(false);

  const syncNow = async () => {
    if (!authStore.isLoggedIn) {
      uiStore.pushToast({ tone: 'info', text: 'Login to sync data.' });
      return;
    }
    if (!navigator.onLine) {
      uiStore.pushToast({ tone: 'warning', text: 'Offline now. Sync will run when internet is back.' });
      return;
    }
    if (isSyncing.value) return;
    isSyncing.value = true;
    try {
      await syncService.syncNow();
      await trackerStore.refresh();
      uiStore.pushToast({ tone: 'success', text: 'Sync complete.' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sync failed.';
      uiStore.pushToast({ tone: 'error', text: message });
    } finally {
      isSyncing.value = false;
    }
  };

  return { authStore, isSyncing, syncNow };
};
