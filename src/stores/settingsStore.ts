import { defineStore } from 'pinia';
import { ref } from 'vue';
import { settingsRepo } from '../db/repositories/settingsRepo';
import type { AppSettings, LockSettings } from '../types/tracker';
import { DEFAULT_SETTINGS } from '../utils/constants';
import { nowIso } from '../utils/date';

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref<AppSettings>({ ...DEFAULT_SETTINGS });
  const isLoaded = ref(false);

  const load = async () => {
    if (isLoaded.value) return;
    const found = await settingsRepo.get();
    settings.value = found ?? { ...DEFAULT_SETTINGS, updatedAt: nowIso() };
    isLoaded.value = true;
  };

  const persist = async (next: AppSettings) => {
    settings.value = { ...next, updatedAt: nowIso() };
    await settingsRepo.put(settings.value);
  };

  const setDarkMode = async (darkMode: AppSettings['darkMode']) => {
    await persist({ ...settings.value, darkMode });
  };

  const setReminderSettings = async (reminder: AppSettings['reminder']) => {
    await persist({ ...settings.value, reminder });
  };

  const markReminderTriggered = async (key: string) => {
    const lastReminderEvents = { ...(settings.value.lastReminderEvents ?? {}), [key]: nowIso() };
    await persist({ ...settings.value, lastReminderEvents });
  };

  const setLock = async (lock: LockSettings) => {
    await persist({ ...settings.value, lock });
  };

  return {
    settings,
    isLoaded,
    load,
    setDarkMode,
    setReminderSettings,
    markReminderTriggered,
    setLock,
    persist,
  };
});

