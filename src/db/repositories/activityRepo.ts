import type { ActivityLog } from '../../types/tracker';
import { ensureNoError, requireSupabase, requireUserId } from '../../lib/cloud';

const toActivity = (row: any): ActivityLog => ({
  id: String(row.id),
  trackerId: row.tracker_id ?? undefined,
  type: row.type,
  message: row.message,
  previewImageDataUrl: row.preview_image_data_url ?? undefined,
  createdAt: String(row.created_at ?? new Date().toISOString()),
});

const toRow = (item: ActivityLog, userId: string) => ({
  id: item.id,
  user_id: userId,
  tracker_id: item.trackerId ?? null,
  type: item.type,
  message: item.message,
  preview_image_data_url: item.previewImageDataUrl ?? null,
  created_at: item.createdAt,
});

export const activityRepo = {
  async listRecent(limit = 20) {
    const client = requireSupabase();
    const userId = await requireUserId();
    const { data, error } = await client.from('activities').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(limit);
    if (error) {
      const message = String(error.message || '').toLowerCase();
      if (message.includes('permission denied') || message.includes('row-level security')) {
        return [];
      }
      ensureNoError(error, 'Failed to load activity logs');
    }
    return (data ?? []).map(toActivity);
  },
  async put(item: ActivityLog) {
    const client = requireSupabase();
    const userId = await requireUserId();
    const { error } = await client.from('activities').upsert(toRow(item, userId), { onConflict: 'id' });
    ensureNoError(error, 'Failed to save activity log');
  },
  async bulkPut(items: ActivityLog[]) {
    if (!items.length) return;
    const client = requireSupabase();
    const userId = await requireUserId();
    const { error } = await client.from('activities').upsert(items.map((item) => toRow(item, userId)), { onConflict: 'id' });
    ensureNoError(error, 'Failed to save activity logs');
  },
  async clear() {
    const client = requireSupabase();
    const userId = await requireUserId();
    const { error } = await client.from('activities').delete().eq('user_id', userId);
    ensureNoError(error, 'Failed to clear activity logs');
  },
};
