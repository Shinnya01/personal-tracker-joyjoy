export type TrackerSortMode = 'newest' | 'oldest' | 'deliveryDate';
export type BackupImportMode = 'replace' | 'merge';

export interface TrackerItem {
  id: string;
  title: string;
  company?: string;
  category?: string;
  notes?: string;
  deliveryReceiptDate?: string;
  deliveryReceiptEndDate?: string;
  images?: string[];
  createdAt: string;
  updatedAt: string;
  userId?: string;
  syncStatus?: 'pending' | 'synced';
  deletedAt?: string;
}

export interface StoredImage {
  id: string;
  trackerId: string;
  blob: Blob;
  name: string;
  type: string;
  size: number;
  createdAt: string;
  updatedAt?: string;
  userId?: string;
  syncStatus?: 'pending' | 'synced';
  imagePath?: string;
  deletedAt?: string;
}

export interface ReminderSettings {
  enabled: boolean;
  intervalMinutes: number;
  notificationSoundEnabled: boolean;
}

export interface LockSettings {
  enabled: boolean;
  pinHash?: string;
  pinSalt?: string;
  biometricEnabled: boolean;
}

export interface AppSettings {
  id: 'app';
  displayName?: string;
  darkMode: 'system' | 'light' | 'dark';
  reminder: ReminderSettings;
  lock: LockSettings;
  seededAt?: string;
  lastReminderEvents?: Record<string, string>;
  dismissedReminderMonths?: Record<string, string>;
  updatedAt: string;
}

export interface ActivityLog {
  id: string;
  trackerId?: string;
  type: 'created' | 'updated' | 'deleted' | 'backup_imported';
  message: string;
  previewImageDataUrl?: string;
  createdAt: string;
}

export interface BackupPayload {
  version: 1;
  exportedAt: string;
  trackers: TrackerItem[];
  images: Array<Omit<StoredImage, 'blob'> & { blobBase64: string }>;
  settings: AppSettings | null;
  activities: ActivityLog[];
}

export interface TrackerFilters {
  search: string;
  company: string;
  category: string;
  sort: TrackerSortMode;
  updatedAtStart: string;
  updatedAtEnd: string;
}

export interface ReminderBuckets {
  today: TrackerItem[];
  upcoming: TrackerItem[];
  overdue: TrackerItem[];
}

export interface SyncQueueItem {
  id: string;
  entityType: 'tracker' | 'image';
  entityId: string;
  action: 'upsert' | 'delete';
  updatedAt: string;
}
