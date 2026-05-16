import { computed } from 'vue';
import type { ReminderBuckets, TrackerItem } from '../types/tracker';

export const useDashboardStats = (source: () => TrackerItem[]) => {
  const stats = computed(() => {
    const items = source();
    const now = Date.now();
    const thisMonth = items.filter((i) => i.deliveryReceiptDate && new Date(i.deliveryReceiptDate).getMonth() === new Date().getMonth()).length;
    const overdue = items.filter((i) => i.deliveryReceiptDate && new Date(i.deliveryReceiptDate).getTime() < now).length;

    return {
      total: items.length,
      pending: thisMonth,
      inProgress: items.filter((i) => !i.deliveryReceiptDate).length,
      completed: items.filter((i) => !!i.deliveryReceiptDate).length,
      overdue,
    };
  });

  const reminderBuckets = computed<ReminderBuckets>(() => {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const dated = source()
      .filter((item) => item.deliveryReceiptDate)
      .sort((a, b) => +new Date(a.deliveryReceiptDate as string) - +new Date(b.deliveryReceiptDate as string));

    const today = dated.filter((item) => {
      const t = new Date(item.deliveryReceiptDate as string).getTime();
      return t >= startOfDay.getTime() && t <= endOfDay.getTime();
    });
    const overdue = dated.filter((item) => new Date(item.deliveryReceiptDate as string).getTime() < startOfDay.getTime());
    const upcoming = dated.filter((item) => new Date(item.deliveryReceiptDate as string).getTime() > endOfDay.getTime());

    return { today, upcoming, overdue };
  });

  return { stats, reminderBuckets };
};

