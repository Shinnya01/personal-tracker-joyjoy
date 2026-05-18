import { db } from '../index';
import type { SyncQueueItem } from '../../types/tracker';

export const syncQueueRepo = {
  list: () => db.syncQueue.orderBy('updatedAt').toArray(),
  put: (item: SyncQueueItem) => db.syncQueue.put(item),
  bulkPut: (items: SyncQueueItem[]) => db.syncQueue.bulkPut(items),
  delete: (id: string) => db.syncQueue.delete(id),
  clear: () => db.syncQueue.clear(),
};
