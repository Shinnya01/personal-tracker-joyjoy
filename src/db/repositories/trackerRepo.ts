import type { TrackerItem } from '../../types/tracker';
import { ensureNoError, requireSupabase, requireUserId } from '../../lib/cloud';

const toTracker = (row: any): TrackerItem => ({
  id: String(row.id),
  title: row.title,
  company: row.company ?? undefined,
  category: row.category ?? undefined,
  notes: row.notes ?? undefined,
  deliveryReceiptDate: row.delivery_receipt_date ?? undefined,
  deliveryReceiptEndDate: row.delivery_receipt_end_date ?? undefined,
  images: Array.isArray(row.images) ? row.images : [],
  createdAt: String(row.created_at ?? row.updated_at ?? new Date().toISOString()),
  updatedAt: String(row.updated_at ?? row.created_at ?? new Date().toISOString()),
  userId: row.user_id ?? undefined,
  deletedAt: row.deleted_at ?? undefined,
  syncStatus: 'synced',
});

const toRow = (tracker: TrackerItem, userId: string) => ({
  id: tracker.id,
  user_id: userId,
  title: tracker.title,
  company: tracker.company ?? null,
  category: tracker.category ?? null,
  notes: tracker.notes ?? null,
  delivery_receipt_date: tracker.deliveryReceiptDate ?? null,
  delivery_receipt_end_date: tracker.deliveryReceiptEndDate ?? null,
  images: tracker.images ?? [],
  updated_at: tracker.updatedAt,
  deleted_at: tracker.deletedAt ?? null,
});

export const trackerRepo = {
  async list() {
    const client = requireSupabase();
    const userId = await requireUserId();
    const { data, error } = await client.from('trackers').select('*').eq('user_id', userId).order('updated_at', { ascending: false });
    ensureNoError(error, 'Failed to load trackers');
    return (data ?? []).map(toTracker);
  },
  async listPage(limit: number, offset: number) {
    const client = requireSupabase();
    const userId = await requireUserId();
    const from = Math.max(0, offset);
    const to = from + Math.max(1, limit) - 1;
    const { data, error } = await client
      .from('trackers')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .range(from, to);
    ensureNoError(error, 'Failed to load tracker page');
    return (data ?? []).map(toTracker);
  },
  async getById(id: string) {
    const client = requireSupabase();
    const userId = await requireUserId();
    const { data, error } = await client.from('trackers').select('*').eq('user_id', userId).eq('id', id).maybeSingle();
    ensureNoError(error, `Failed to load tracker ${id}`);
    return data ? toTracker(data) : undefined;
  },
  async put(tracker: TrackerItem) {
    const client = requireSupabase();
    const userId = await requireUserId();
    const { error } = await client.from('trackers').upsert(toRow(tracker, userId), { onConflict: 'id' });
    ensureNoError(error, `Failed to save tracker ${tracker.id}`);
  },
  async bulkPut(trackers: TrackerItem[]) {
    const client = requireSupabase();
    const userId = await requireUserId();
    if (!trackers.length) return;
    const { error } = await client.from('trackers').upsert(trackers.map((item) => toRow(item, userId)), { onConflict: 'id' });
    ensureNoError(error, 'Failed to save trackers');
  },
  async delete(id: string) {
    const client = requireSupabase();
    const userId = await requireUserId();
    const { error } = await client.from('trackers').delete().eq('user_id', userId).eq('id', id);
    ensureNoError(error, `Failed to delete tracker ${id}`);
  },
  async clear() {
    const client = requireSupabase();
    const userId = await requireUserId();
    const { error } = await client.from('trackers').delete().eq('user_id', userId);
    ensureNoError(error, 'Failed to clear trackers');
  },
};
