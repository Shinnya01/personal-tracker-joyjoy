import { ref } from 'vue';
import { backupService } from '../services/backupService';
import type { BackupImportMode, BackupPayload } from '../types/tracker';

export const useBackup = () => {
  const isBusy = ref(false);

  const exportJson = async () => {
    isBusy.value = true;
    try {
      const payload = await backupService.exportPayload();
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tracker-backup-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      isBusy.value = false;
    }
  };

  const importJson = async (file: File, mode: BackupImportMode) => {
    isBusy.value = true;
    try {
      const content = await file.text();
      const payload = JSON.parse(content) as BackupPayload;
      await backupService.importPayload(payload, mode);
    } finally {
      isBusy.value = false;
    }
  };

  return { isBusy, exportJson, importJson };
};

