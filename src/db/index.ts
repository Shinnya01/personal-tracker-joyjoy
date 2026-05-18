import Dexie, { type EntityTable } from 'dexie';
import type { ActivityLog, AppSettings, StoredImage, SyncQueueItem, TrackerItem } from '../types/tracker';

export class TrackerDatabase extends Dexie {
  trackers!: EntityTable<TrackerItem, 'id'>;
  images!: EntityTable<StoredImage, 'id'>;
  settings!: EntityTable<AppSettings, 'id'>;
  activities!: EntityTable<ActivityLog, 'id'>;
  syncQueue!: EntityTable<SyncQueueItem, 'id'>;

  constructor() {
    super('tracker-db');

    this.version(1).stores({
      trackers: 'id, title, category, deliveryReceiptDate, createdAt, updatedAt',
      categories: 'id, name, color',
      images: 'id, trackerId, createdAt',
      settings: 'id, updatedAt',
      activities: 'id, trackerId, type, createdAt',
    });

    this.version(2).stores({
      trackers: 'id, title, deliveryReceiptDate, createdAt, updatedAt',
      images: 'id, trackerId, createdAt',
      settings: 'id, updatedAt',
      activities: 'id, trackerId, type, createdAt',
    });

    this.version(3).stores({
      trackers: 'id, title, deliveryReceiptDate, createdAt, updatedAt, syncStatus, userId, deletedAt',
      images: 'id, trackerId, createdAt, updatedAt, syncStatus, userId, imagePath, deletedAt',
      settings: 'id, updatedAt',
      activities: 'id, trackerId, type, createdAt',
      syncQueue: 'id, entityType, entityId, action, updatedAt',
    });
  }
}

export const db = new TrackerDatabase();
