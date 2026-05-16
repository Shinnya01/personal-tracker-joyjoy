export type TrackerSortMode = 'newest' | 'oldest' | 'deliveryDate';
export type BackupImportMode = 'replace' | 'merge';

export interface TrackerItem {
  id: string;
  title: string;
  category: string;
  deliveryReceiptDate?: string;
  images?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon?: string;
}

export interface StoredImage {
  id: string;
  trackerId: string;
  blob: Blob;
  name: string;
  type: string;
  size: number;
  createdAt: string;
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
  updatedAt: string;
}

export interface ActivityLog {
  id: string;
  trackerId?: string;
  type: 'created' | 'updated' | 'deleted' | 'backup_imported';
  message: string;
  createdAt: string;
}

export interface BackupPayload {
  version: 1;
  exportedAt: string;
  trackers: TrackerItem[];
  categories: Category[];
  images: Array<Omit<StoredImage, 'blob'> & { blobBase64: string }>;
  settings: AppSettings | null;
  activities: ActivityLog[];
}

export interface TrackerFilters {
  search: string;
  category: string | 'All';
  sort: TrackerSortMode;
}

export interface ReminderBuckets {
  today: TrackerItem[];
  upcoming: TrackerItem[];
  overdue: TrackerItem[];
}
