import Dexie, { type EntityTable } from 'dexie';
import type { ActivityLog, AppSettings, StoredImage, TrackerItem } from '../types/tracker';

export class TrackerDatabase extends Dexie {
  trackers!: EntityTable<TrackerItem, 'id'>;
  images!: EntityTable<StoredImage, 'id'>;
  settings!: EntityTable<AppSettings, 'id'>;
  activities!: EntityTable<ActivityLog, 'id'>;

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
  }
}

export const db = new TrackerDatabase();
