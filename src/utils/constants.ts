import type { AppSettings } from '../types/tracker';

export const DEFAULT_SETTINGS: AppSettings = {
  id: 'app',
  darkMode: 'system',
  reminder: {
    enabled: true,
    intervalMinutes: 1,
    notificationSoundEnabled: true,
  },
  lock: {
    enabled: false,
    biometricEnabled: false,
  },
  lastReminderEvents: {},
  updatedAt: new Date().toISOString(),
};

