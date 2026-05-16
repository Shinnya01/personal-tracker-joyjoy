import { db } from '../db';
import { trackerRepo } from '../db/repositories/trackerRepo';
import { imageRepo } from '../db/repositories/imageRepo';
import { activityRepo } from '../db/repositories/activityRepo';
import { createId, nowIso } from '../utils/date';
import type { StoredImage, TrackerItem } from '../types/tracker';

export interface TrackerWriteInput extends Omit<TrackerItem, 'id' | 'createdAt' | 'updatedAt' | 'images'> {
  images?: string[];
}

export const trackerService = {
  async create(input: TrackerWriteInput) {
    const now = nowIso();
    const tracker: TrackerItem = {
      id: createId(),
      ...input,
      images: input.images ?? [],
      createdAt: now,
      updatedAt: now,
    };

    await db.transaction('rw', db.trackers, db.activities, async () => {
      await trackerRepo.put(tracker);
      await activityRepo.put({
        id: createId(),
        trackerId: tracker.id,
        type: 'created',
        message: `Created tracker: ${tracker.title}`,
        createdAt: now,
      });
    });

    return tracker;
  },

  async update(id: string, patch: Partial<TrackerWriteInput>) {
    const existing = await trackerRepo.getById(id);
    if (!existing) return null;

    const updated: TrackerItem = {
      ...existing,
      ...patch,
      images: patch.images ?? existing.images ?? [],
      updatedAt: nowIso(),
    };

    await db.transaction('rw', db.trackers, db.activities, async () => {
      await trackerRepo.put(updated);
      await activityRepo.put({
        id: createId(),
        trackerId: updated.id,
        type: 'updated',
        message: `Updated tracker: ${updated.title}`,
        createdAt: updated.updatedAt,
      });
    });

    return updated;
  },

  async remove(id: string) {
    const existing = await trackerRepo.getById(id);
    if (!existing) return;

    const imageIds = existing.images ?? [];
    await db.transaction('rw', db.trackers, db.images, db.activities, async () => {
      await trackerRepo.delete(id);
      if (imageIds.length) await imageRepo.bulkDelete(imageIds);
      await activityRepo.put({
        id: createId(),
        trackerId: id,
        type: 'deleted',
        message: `Deleted tracker: ${existing.title}`,
        createdAt: nowIso(),
      });
    });
  },

  async saveImages(trackerId: string, files: StoredImage[]) {
    await imageRepo.bulkPut(files.map((file) => ({ ...file, trackerId })));
  },
};

