import { computed, ref } from 'vue';
import type { TrackerFilters, TrackerItem } from '../types/tracker';

export const useTrackerQuery = (source: () => TrackerItem[]) => {
  const filters = ref<TrackerFilters>({
    search: '',
    company: 'all',
    category: 'all',
    sort: 'newest',
    updatedAtStart: '',
    updatedAtEnd: '',
  });

  const ensureFilterShape = () => {
    if (!filters.value.category) {
      filters.value = { ...filters.value, category: 'all' };
    }
  };
  ensureFilterShape();

  const filteredTrackers = computed(() => {
    ensureFilterShape();
    let items = [...source()];
    const {
      search,
      company,
      category,
      sort,
      updatedAtStart,
      updatedAtEnd,
    } = filters.value;

    if (search.trim()) {
      const keyword = search.toLowerCase();
      items = items.filter((item) =>
        item.title.toLowerCase().includes(keyword)
        || (item.company ?? '').toLowerCase().includes(keyword)
        || (item.category ?? '').toLowerCase().includes(keyword),
      );
    }
    if (company !== 'all') {
      items = items.filter((item) => (item.company ?? '') === company);
    }
    if (category !== 'all') {
      items = items.filter((item) => (item.category ?? '') === category);
    }
    if (updatedAtStart) {
      const start = new Date(`${updatedAtStart}T00:00:00`).getTime();
      if (!Number.isNaN(start)) {
        items = items.filter((item) => new Date(item.updatedAt).getTime() >= start);
      }
    }
    if (updatedAtEnd) {
      const end = new Date(`${updatedAtEnd}T23:59:59.999`).getTime();
      if (!Number.isNaN(end)) {
        items = items.filter((item) => new Date(item.updatedAt).getTime() <= end);
      }
    }

    items.sort((a, b) => {
      if (sort === 'newest') return +new Date(b.createdAt) - +new Date(a.createdAt);
      if (sort === 'oldest') return +new Date(a.createdAt) - +new Date(b.createdAt);
      return +(new Date(a.deliveryReceiptDate ?? 0)) - +(new Date(b.deliveryReceiptDate ?? 0));
    });

    return items;
  });

  return { filters, filteredTrackers };
};

