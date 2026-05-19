import { trackerRepo } from '../db/repositories/trackerRepo';
import { imageRepo } from '../db/repositories/imageRepo';
import { activityRepo } from '../db/repositories/activityRepo';
import { createId, nowIso } from '../utils/date';
import type { StoredImage, TrackerItem } from '../types/tracker';

export interface TrackerWriteInput extends Omit<TrackerItem, 'id' | 'createdAt' | 'updatedAt' | 'images'> {
  images?: string[];
}

export const trackerService = {
  async safeActivityLog(input: {
    id: string;
    trackerId?: string;
    type: 'created' | 'updated' | 'deleted' | 'backup_imported';
    message: string;
    previewImageDataUrl?: string;
    createdAt: string;
  }) {
    try {
      await activityRepo.put(input);
    } catch (error) {
      console.warn('Activity log skipped:', error);
    }
  },

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
      syncStatus: 'synced',
    };

    await trackerRepo.put(tracker);
    await this.safeActivityLog({
      id: createId(),
      trackerId: tracker.id,
      type: 'created',
      message: `Created tracker: ${tracker.title}`,
      createdAt: now,
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
      syncStatus: 'synced',
    };

    await trackerRepo.put(updated);
    await this.safeActivityLog({
      id: createId(),
      trackerId: updated.id,
      type: 'updated',
      message: `Updated tracker: ${updated.title}`,
      createdAt: updated.updatedAt,
    });

    return updated;
  },

  async remove(id: string) {
    const existing = await trackerRepo.getById(id);
    if (!existing) return;

    const imageIds = existing.images ?? [];
    const firstImage = imageIds[0] ? await imageRepo.getById(imageIds[0]) : undefined;
    const previewImageDataUrl = firstImage?.blob ? await this.blobToDataUrl(firstImage.blob) : undefined;

    await trackerRepo.delete(id);
    if (imageIds.length) await imageRepo.bulkDelete(imageIds);
    await this.safeActivityLog({
      id: createId(),
      trackerId: id,
      type: 'deleted',
      message: `Deleted tracker: ${existing.title}`,
      previewImageDataUrl,
      createdAt: nowIso(),
    });
  },

  async saveImages(trackerId: string, files: StoredImage[]) {
    const timestamp = nowIso();
    const prepared = files.map((file) => ({ ...file, trackerId, updatedAt: timestamp, syncStatus: 'synced' as const }));
    await imageRepo.bulkPut(prepared);
  },
};
