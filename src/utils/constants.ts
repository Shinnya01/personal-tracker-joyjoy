import type { AppSettings, Category } from '../types/tracker';

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'general', name: 'General', color: '#3b82f6' },
  { id: 'health', name: 'Health', color: '#16a34a' },
  { id: 'work', name: 'Work', color: '#f97316' },
  { id: 'finance', name: 'Finance', color: '#a855f7' },
];

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

