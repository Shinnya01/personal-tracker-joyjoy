import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { activityRepo } from '../db/repositories/activityRepo';
import { categoryRepo } from '../db/repositories/categoryRepo';
import { trackerRepo } from '../db/repositories/trackerRepo';
import { trackerService, type TrackerWriteInput } from '../services/trackerService';
import type { ActivityLog, Category, TrackerItem } from '../types/tracker';
import { useDashboardStats } from '../composables/useDashboardStats';
import { useTrackerQuery } from '../composables/useTrackerQuery';

export const useTrackerStore = defineStore('tracker', () => {
  const trackers = ref<TrackerItem[]>([]);
  const categories = ref<Category[]>([]);
  const activities = ref<ActivityLog[]>([]);
  const isLoading = ref(false);

  const { filters, filteredTrackers } = useTrackerQuery(() => trackers.value);
  const { stats, reminderBuckets } = useDashboardStats(() => trackers.value);

  const refresh = async () => {
    isLoading.value = true;
    try {
      const [t, c, a] = await Promise.all([trackerRepo.list(), categoryRepo.list(), activityRepo.listRecent(20)]);
      trackers.value = t;
      categories.value = c;
      activities.value = a;
    } finally {
      isLoading.value = false;
    }
  };

  const upsertTracker = async (payload: TrackerWriteInput, id?: string) => {
    if (id) await trackerService.update(id, payload);
    else await trackerService.create(payload);
    await refresh();
  };

  const deleteTracker = async (id: string) => {
    await trackerService.remove(id);
    await refresh();
  };

  const getById = computed(() => (id: string) => trackers.value.find((item) => item.id === id));

  return {
    trackers,
    categories,
    activities,
    isLoading,
    filters,
    filteredTrackers,
    stats,
    reminderBuckets,
    getById,
    refresh,
    upsertTracker,
    deleteTracker,
  };
});

