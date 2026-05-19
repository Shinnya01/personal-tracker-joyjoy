import { settingsRepo } from '../db/repositories/settingsRepo';
import { trackerRepo } from '../db/repositories/trackerRepo';
import { activityRepo } from '../db/repositories/activityRepo';
import { DEFAULT_SETTINGS } from '../utils/constants';
import { createId, nowIso } from '../utils/date';
import type { TrackerItem } from '../types/tracker';

const seedTrackers = (): TrackerItem[] => {
  const now = nowIso();
  return [
    {
      id: createId(),
      title: 'Prepare invoice package',
      deliveryReceiptDate: new Date(Date.now() + 86400000).toISOString(),
      images: [],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: createId(),
      title: 'Deliver supplier documents',
      deliveryReceiptDate: new Date(Date.now() + 172800000).toISOString(),
      images: [],
      createdAt: now,
      updatedAt: now,
    },
  ];
};

export const ensureSeedData = async () => {
  const settings = await settingsRepo.get();
  if (settings?.seededAt) return;

  const now = nowIso();
  const existingTrackers = await trackerRepo.list();
  if (!existingTrackers.length) {
    await trackerRepo.bulkPut(seedTrackers());
    await activityRepo.put({
      id: createId(),
      type: 'created',
      message: 'Sample tracker data seeded.',
      createdAt: now,
    });
  }

  const nextSettings = settings
    ? { ...settings, seededAt: settings.seededAt ?? now, updatedAt: now }
    : { ...DEFAULT_SETTINGS, seededAt: now, updatedAt: now };

  await settingsRepo.put(nextSettings);
};
