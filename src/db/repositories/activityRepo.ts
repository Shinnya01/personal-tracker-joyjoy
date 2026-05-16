import { db } from '../index';
import type { ActivityLog } from '../../types/tracker';

export const activityRepo = {
  listRecent: (limit = 20) => db.activities.orderBy('createdAt').reverse().limit(limit).toArray(),
  put: (item: ActivityLog) => db.activities.put(item),
  bulkPut: (items: ActivityLog[]) => db.activities.bulkPut(items),
  clear: () => db.activities.clear(),
};

