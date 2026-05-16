import { db } from '../index';
import type { TrackerItem } from '../../types/tracker';

export const trackerRepo = {
  list: () => db.trackers.toArray(),
  getById: (id: string) => db.trackers.get(id),
  put: (tracker: TrackerItem) => db.trackers.put(tracker),
  bulkPut: (trackers: TrackerItem[]) => db.trackers.bulkPut(trackers),
  delete: (id: string) => db.trackers.delete(id),
  clear: () => db.trackers.clear(),
};

