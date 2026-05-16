import { db } from '../index';
import type { StoredImage } from '../../types/tracker';

export const imageRepo = {
  list: () => db.images.toArray(),
  listByTrackerId: (trackerId: string) => db.images.where('trackerId').equals(trackerId).toArray(),
  getById: (id: string) => db.images.get(id),
  put: (item: StoredImage) => db.images.put(item),
  bulkPut: (items: StoredImage[]) => db.images.bulkPut(items),
  bulkDelete: (ids: string[]) => db.images.bulkDelete(ids),
  clear: () => db.images.clear(),
};

