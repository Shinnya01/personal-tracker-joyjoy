import { db } from '../index';
import type { AppSettings } from '../../types/tracker';

export const settingsRepo = {
  get: () => db.settings.get('app'),
  getAny: async () => {
    const all = await db.settings.toArray();
    return all[0];
  },
  put: (settings: AppSettings) => db.settings.put(settings),
  clear: () => db.settings.clear(),
};

