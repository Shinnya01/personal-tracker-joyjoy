import { db } from '../db';
import { categoryRepo } from '../db/repositories/categoryRepo';
import { settingsRepo } from '../db/repositories/settingsRepo';
import { trackerRepo } from '../db/repositories/trackerRepo';
import { activityRepo } from '../db/repositories/activityRepo';
import { DEFAULT_CATEGORIES, DEFAULT_SETTINGS } from '../utils/constants';
import { createId, nowIso } from '../utils/date';
import type { TrackerItem } from '../types/tracker';

const seedTrackers = (): TrackerItem[] => {
  const now = nowIso();
  return [
    {
      id: createId(),
      title: 'Prepare invoice package',
      category: 'work',
      deliveryReceiptDate: new Date(Date.now() + 86400000).toISOString(),
      images: [],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: createId(),
      title: 'Deliver supplier documents',
      category: 'finance',
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

  await db.transaction('rw', db.settings, db.categories, db.trackers, db.activities, async () => {
    const now = nowIso();
    await categoryRepo.bulkPut(DEFAULT_CATEGORIES);
    await trackerRepo.bulkPut(seedTrackers());
    await settingsRepo.put({ ...DEFAULT_SETTINGS, seededAt: now, updatedAt: now });
    await activityRepo.put({
      id: createId(),
      type: 'created',
      message: 'Sample tracker data seeded.',
      createdAt: now,
    });
  });
};

