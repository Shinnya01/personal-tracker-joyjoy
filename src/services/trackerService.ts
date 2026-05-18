import { db } from '../db';
import { trackerRepo } from '../db/repositories/trackerRepo';
import { imageRepo } from '../db/repositories/imageRepo';
import { activityRepo } from '../db/repositories/activityRepo';
import { syncQueueRepo } from '../db/repositories/syncQueueRepo';
import { createId, nowIso } from '../utils/date';
import type { StoredImage, TrackerItem } from '../types/tracker';

export interface TrackerWriteInput extends Omit<TrackerItem, 'id' | 'createdAt' | 'updatedAt' | 'images'> {
  images?: string[];
}

export const trackerService = {
  async blobToDataUrl(blob: Blob) {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        if (typeof result !== 'string') {
          reject(new Error('Unable to read image preview.'));
          return;
        }
        resolve(result);
      };
      reader.onerror = () => reject(reader.error ?? new Error('Unable to read image preview.'));
      reader.readAsDataURL(blob);
    });
  },

  async create(input: TrackerWriteInput) {
    const now = nowIso();
    const tracker: TrackerItem = {
      id: createId(),
      ...input,
      images: input.images ?? [],
      createdAt: now,
      updatedAt: now,
      syncStatus: 'pending',
    };

    await db.transaction('rw', db.trackers, db.activities, db.syncQueue, async () => {
      await trackerRepo.put(tracker);
      await syncQueueRepo.put({ id: createId(), entityType: 'tracker', entityId: tracker.id, action: 'upsert', updatedAt: now });
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
      syncStatus: 'pending',
    };

    await db.transaction('rw', db.trackers, db.activities, db.syncQueue, async () => {
      await trackerRepo.put(updated);
      await syncQueueRepo.put({ id: createId(), entityType: 'tracker', entityId: updated.id, action: 'upsert', updatedAt: updated.updatedAt });
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
    const firstImage = imageIds[0] ? await imageRepo.getById(imageIds[0]) : undefined;
    const previewImageDataUrl = firstImage?.blob ? await this.blobToDataUrl(firstImage.blob) : undefined;
    await db.transaction('rw', db.trackers, db.images, db.activities, db.syncQueue, async () => {
      await syncQueueRepo.put({ id: createId(), entityType: 'tracker', entityId: id, action: 'delete', updatedAt: nowIso() });
      for (const imageId of imageIds) {
        await syncQueueRepo.put({ id: createId(), entityType: 'image', entityId: imageId, action: 'delete', updatedAt: nowIso() });
      }
      await trackerRepo.delete(id);
      if (imageIds.length) await imageRepo.bulkDelete(imageIds);
      await activityRepo.put({
        id: createId(),
        trackerId: id,
        type: 'deleted',
        message: `Deleted tracker: ${existing.title}`,
        previewImageDataUrl,
        createdAt: nowIso(),
      });
    });
  },

  async saveImages(trackerId: string, files: StoredImage[]) {
    const timestamp = nowIso();
    const prepared = files.map((file) => ({ ...file, trackerId, updatedAt: timestamp, syncStatus: 'pending' as const }));
    await imageRepo.bulkPut(prepared);
    for (const file of prepared) {
      await syncQueueRepo.put({ id: createId(), entityType: 'image', entityId: file.id, action: 'upsert', updatedAt: timestamp });
    }
  },
};

