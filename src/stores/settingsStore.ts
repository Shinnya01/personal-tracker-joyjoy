import { defineStore } from 'pinia';
import { ref, toRaw } from 'vue';
import { settingsRepo } from '../db/repositories/settingsRepo';
import type { AppSettings, LockSettings } from '../types/tracker';
import { DEFAULT_SETTINGS } from '../utils/constants';
import { nowIso } from '../utils/date';

const normalizeSettings = (value: Partial<AppSettings> | null | undefined): AppSettings => ({
  ...DEFAULT_SETTINGS,
  ...(value ?? {}),
  id: 'app',
  displayName: typeof value?.displayName === 'string' ? value.displayName : undefined,
  reminder: {
    ...DEFAULT_SETTINGS.reminder,
    ...(value?.reminder ?? {}),
  },
  lock: {
    ...DEFAULT_SETTINGS.lock,
    ...(value?.lock ?? {}),
  },
  lastReminderEvents: value?.lastReminderEvents ?? {},
  updatedAt: value?.updatedAt ?? nowIso(),
});

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref<AppSettings>({ ...DEFAULT_SETTINGS });
  const isLoaded = ref(false);

  const load = async () => {
    if (isLoaded.value) return;
    const found = (await settingsRepo.get()) ?? (await settingsRepo.getAny());
    if (found) {
      const normalized = normalizeSettings(found);
      settings.value = normalized;
      if (found.id !== 'app') {
        await settingsRepo.put(normalized);
      }
    } else {
      const initialSettings = normalizeSettings(undefined);
      await settingsRepo.put(initialSettings);
      settings.value = initialSettings;
    }
    isLoaded.value = true;
  };

  const persist = async (next: AppSettings) => {
    const existing = (await settingsRepo.get()) ?? (await settingsRepo.getAny());
    settings.value = normalizeSettings({
      ...(existing ?? {}),
      ...next,
      updatedAt: nowIso(),
    });
    const plain = JSON.parse(JSON.stringify(toRaw(settings.value))) as AppSettings;
    await settingsRepo.put(plain);
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

