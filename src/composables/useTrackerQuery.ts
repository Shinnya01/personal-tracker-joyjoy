import { computed, ref } from 'vue';
import type { TrackerFilters, TrackerItem } from '../types/tracker';

export const useTrackerQuery = (source: () => TrackerItem[]) => {
  const filters = ref<TrackerFilters>({
    search: '',
    company: 'all',
    category: 'all',
    sort: 'newest',
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
    const { search, company, category, sort } = filters.value;

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

    items.sort((a, b) => {
      if (sort === 'newest') return +new Date(b.createdAt) - +new Date(a.createdAt);
      if (sort === 'oldest') return +new Date(a.createdAt) - +new Date(b.createdAt);
      return +(new Date(a.deliveryReceiptDate ?? 0)) - +(new Date(b.deliveryReceiptDate ?? 0));
    });

    return items;
  });

  return { filters, filteredTrackers };
};

