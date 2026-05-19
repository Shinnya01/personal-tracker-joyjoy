import type { AppSettings } from '../../types/tracker';
import { ensureNoError, requireSupabase, requireUserId } from '../../lib/cloud';

const rowToSettings = (row: any): AppSettings => ({
  id: 'app',
  displayName: row.display_name ?? undefined,
  darkMode: row.dark_mode,
  reminder: row.reminder ?? { enabled: true, intervalMinutes: 1, notificationSoundEnabled: true },
  lock: row.lock ?? { enabled: false, biometricEnabled: false },
  seededAt: row.seeded_at ?? undefined,
  lastReminderEvents: row.last_reminder_events ?? {},
  dismissedReminderMonths: row.dismissed_reminder_months ?? {},
  updatedAt: String(row.updated_at ?? new Date().toISOString()),
});

const settingsToRow = (settings: AppSettings, userId: string) => ({
  id: 'app',
  user_id: userId,
  display_name: settings.displayName ?? null,
  dark_mode: settings.darkMode,
  reminder: settings.reminder,
  lock: settings.lock,
  seeded_at: settings.seededAt ?? null,
  last_reminder_events: settings.lastReminderEvents ?? {},
  dismissed_reminder_months: settings.dismissedReminderMonths ?? {},
  updated_at: settings.updatedAt,
});

export const settingsRepo = {
  async get() {
    const client = requireSupabase();
    const userId = await requireUserId();
    const { data, error } = await client.from('app_settings').select('*').eq('user_id', userId).eq('id', 'app').maybeSingle();
    ensureNoError(error, 'Failed to load settings');
    return data ? rowToSettings(data) : undefined;
  },
  async getAny() {
    const client = requireSupabase();
    const userId = await requireUserId();
    const { data, error } = await client.from('app_settings').select('*').eq('user_id', userId).limit(1);
    ensureNoError(error, 'Failed to load settings');
    return data?.[0] ? rowToSettings(data[0]) : undefined;
  },
  async put(settings: AppSettings) {
    const client = requireSupabase();
    const userId = await requireUserId();
    const { error } = await client.from('app_settings').upsert(settingsToRow(settings, userId), { onConflict: 'id,user_id' });
    ensureNoError(error, 'Failed to save settings');
  },
  async clear() {
    const client = requireSupabase();
    const userId = await requireUserId();
    const { error } = await client.from('app_settings').delete().eq('user_id', userId);
    ensureNoError(error, 'Failed to clear settings');
  },
};
