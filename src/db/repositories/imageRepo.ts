import type { StoredImage } from '../../types/tracker';
import { TRACKER_IMAGES_BUCKET, ensureNoError, imagePathFor, requireSupabase, requireUserId } from '../../lib/cloud';

const toStoredImage = async (row: any): Promise<StoredImage | null> => {
  const client = requireSupabase();
  const path = String(row.image_path ?? '').trim();
  if (!path) return null;
  const { data, error } = await client.storage.from(TRACKER_IMAGES_BUCKET).download(path);
  ensureNoError(error, `Failed to download image ${row.id}`);
  if (!data) return null;
  return {
    id: String(row.id),
    trackerId: String(row.tracker_id),
    blob: data,
    name: row.name,
    type: row.type,
    size: row.size,
    createdAt: String(row.created_at ?? row.updated_at ?? new Date().toISOString()),
    updatedAt: String(row.updated_at ?? row.created_at ?? new Date().toISOString()),
    userId: row.user_id ?? undefined,
    syncStatus: 'synced',
    imagePath: path,
    deletedAt: row.deleted_at ?? undefined,
  };
};

const upsertRowFor = async (item: StoredImage) => {
  const client = requireSupabase();
  const userId = await requireUserId();
  const path = item.imagePath || imagePathFor(userId, item.trackerId, item.id, item.type);
  const upload = await client.storage.from(TRACKER_IMAGES_BUCKET).upload(path, item.blob, {
    upsert: true,
    contentType: item.type,
    cacheControl: '3600',
  });
  ensureNoError(upload.error, `Failed to upload image ${item.id}`);
  const { error } = await client.from('tracker_images').upsert({
    id: item.id,
    user_id: userId,
    tracker_id: item.trackerId,
    image_path: path,
    name: item.name,
    type: item.type,
    size: item.size,
    created_at: item.createdAt,
    updated_at: item.updatedAt ?? item.createdAt,
    deleted_at: item.deletedAt ?? null,
  }, { onConflict: 'id' });
  ensureNoError(error, `Failed to save image ${item.id}`);
};

export const imageRepo = {
  async list() {
    const client = requireSupabase();
    const userId = await requireUserId();
    const { data, error } = await client.from('tracker_images').select('*').eq('user_id', userId).order('updated_at', { ascending: false });
    ensureNoError(error, 'Failed to load images');
    const mapped = await Promise.all((data ?? []).map(toStoredImage));
    return mapped.filter((item): item is StoredImage => Boolean(item));
  },
  async listByTrackerId(trackerId: string) {
    const client = requireSupabase();
    const userId = await requireUserId();
    const { data, error } = await client.from('tracker_images').select('*').eq('user_id', userId).eq('tracker_id', trackerId).order('updated_at', { ascending: false });
    ensureNoError(error, `Failed to load tracker images (${trackerId})`);
    const mapped = await Promise.all((data ?? []).map(toStoredImage));
    return mapped.filter((item): item is StoredImage => Boolean(item));
  },
  async getById(id: string) {
    const client = requireSupabase();
    const userId = await requireUserId();
    const { data, error } = await client.from('tracker_images').select('*').eq('user_id', userId).eq('id', id).maybeSingle();
    ensureNoError(error, `Failed to load image ${id}`);
    if (!data) return undefined;
    return await toStoredImage(data) ?? undefined;
  },
  put: upsertRowFor,
  async bulkPut(items: StoredImage[]) {
    for (const item of items) await upsertRowFor(item);
  },
  async bulkDelete(ids: string[]) {
    if (!ids.length) return;
    const client = requireSupabase();
    const userId = await requireUserId();
    const { data, error } = await client.from('tracker_images').select('id,image_path').eq('user_id', userId).in('id', ids);
    ensureNoError(error, 'Failed to read image paths for delete');
    const paths = (data ?? []).map((row: any) => String(row.image_path ?? '').trim()).filter(Boolean);
    if (paths.length) {
      const del = await client.storage.from(TRACKER_IMAGES_BUCKET).remove(paths);
      ensureNoError(del.error, 'Failed to delete image files');
    }
    const { error: dbError } = await client.from('tracker_images').delete().eq('user_id', userId).in('id', ids);
    ensureNoError(dbError, 'Failed to delete images');
  },
  async clear() {
    const all = await imageRepo.list();
    await imageRepo.bulkDelete(all.map((item) => item.id));
  },
};
