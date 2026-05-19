import type { SyncQueueItem } from '../../types/tracker';

export const syncQueueRepo = {
  async list(): Promise<SyncQueueItem[]> {
    return [];
  },
  async put(_item: SyncQueueItem) {},
  async bulkPut(_items: SyncQueueItem[]) {},
  async delete(_id: string) {},
  async clear() {},
};
