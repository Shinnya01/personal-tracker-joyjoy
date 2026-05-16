import { db } from '../db';
import { activityRepo } from '../db/repositories/activityRepo';
import { imageRepo } from '../db/repositories/imageRepo';
import { settingsRepo } from '../db/repositories/settingsRepo';
import { trackerRepo } from '../db/repositories/trackerRepo';
import { createId, nowIso } from '../utils/date';
import type { BackupImportMode, BackupPayload, StoredImage } from '../types/tracker';

const blobToBase64 = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '');
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

const base64ToBlob = (base64: string, mimeType: string) => {
  const bytes = atob(base64);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i += 1) arr[i] = bytes.charCodeAt(i);
  return new Blob([arr], { type: mimeType });
};

export const backupService = {
  async exportPayload(): Promise<BackupPayload> {
    const [trackers, images, settings, activities] = await Promise.all([
      trackerRepo.list(),
      imageRepo.list(),
      settingsRepo.get(),
      activityRepo.listRecent(500),
    ]);

    const serializedImages = await Promise.all(
      images.map(async (image) => ({
        id: image.id,
        trackerId: image.trackerId,
        name: image.name,
        type: image.type,
        size: image.size,
        createdAt: image.createdAt,
        blobBase64: await blobToBase64(image.blob),
      })),
    );

    return {
      version: 1,
      exportedAt: nowIso(),
      trackers,
      images: serializedImages,
      settings: settings ?? null,
      activities,
    };
  },

  async importPayload(payload: BackupPayload, mode: BackupImportMode) {
    const images: StoredImage[] = payload.images.map((img) => ({
      id: img.id,
      trackerId: img.trackerId,
      name: img.name,
      type: img.type,
      size: img.size,
      createdAt: img.createdAt,
      blob: base64ToBlob(img.blobBase64, img.type),
    }));

    await db.transaction('rw', [db.trackers, db.images, db.settings, db.activities], async () => {
      if (mode === 'replace') {
        await Promise.all([trackerRepo.clear(), imageRepo.clear(), activityRepo.clear()]);
      }

      await trackerRepo.bulkPut(payload.trackers);
      await imageRepo.bulkPut(images);
      if (payload.settings) await settingsRepo.put(payload.settings);
      await activityRepo.bulkPut([
        ...payload.activities,
        {
          id: createId(),
          type: 'backup_imported',
          message: `Imported backup in ${mode} mode`,
          createdAt: nowIso(),
        },
      ]);
    });
  },

  async clearAllData(resetSettings = false) {
    await db.transaction('rw', [db.trackers, db.images, db.activities, db.settings], async () => {
      await Promise.all([trackerRepo.clear(), imageRepo.clear(), activityRepo.clear()]);
      if (resetSettings) {
        await settingsRepo.clear();
      }
    });
  },
};

