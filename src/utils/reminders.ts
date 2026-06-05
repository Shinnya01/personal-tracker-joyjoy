import type { TrackerItem } from '../types/tracker';

export const REMINDER_DUE_DAY = 5;

export const monthKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

export const monthIndex = (date: Date) => date.getFullYear() * 12 + date.getMonth();

export const getReminderCycleState = (date = new Date()) => {
  const day = date.getDate();
  if (day < REMINDER_DUE_DAY) return 'upcoming' as const;
  if (day === REMINDER_DUE_DAY) return 'today' as const;
  return 'overdue' as const;
};

export const isReminderDue = (item: TrackerItem, now = new Date()) => {
  if (!item.deliveryReceiptDate) return false;
  const base = new Date(item.deliveryReceiptDate);
  if (Number.isNaN(base.getTime())) return false;
  return monthIndex(now) - monthIndex(base) === 1;
};
