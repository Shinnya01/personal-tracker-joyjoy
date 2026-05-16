import { computed, ref } from 'vue';
import type { TrackerFilters, TrackerItem } from '../types/tracker';

export const useTrackerQuery = (source: () => TrackerItem[]) => {
  const filters = ref<TrackerFilters>({
    search: '',
    sort: 'newest',
  });

  const filteredTrackers = computed(() => {
    let items = [...source()];
    const { search, sort } = filters.value;

    if (search.trim()) {
      const keyword = search.toLowerCase();
      items = items.filter((item) => item.title.toLowerCase().includes(keyword));
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

