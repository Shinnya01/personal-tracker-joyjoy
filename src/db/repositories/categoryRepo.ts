import { db } from '../index';
import type { Category } from '../../types/tracker';

export const categoryRepo = {
  list: () => db.categories.toArray(),
  bulkPut: (items: Category[]) => db.categories.bulkPut(items),
  clear: () => db.categories.clear(),
};

