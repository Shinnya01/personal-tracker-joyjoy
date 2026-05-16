import { db } from '../index';
import type { AppSettings } from '../../types/tracker';

export const settingsRepo = {
  get: () => db.settings.get('app'),
  put: (settings: AppSettings) => db.settings.put(settings),
  clear: () => db.settings.clear(),
};

