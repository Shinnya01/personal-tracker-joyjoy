import { db } from '../db';
import { imageRepo } from '../db/repositories/imageRepo';
import { syncQueueRepo } from '../db/repositories/syncQueueRepo';
import { trackerRepo } from '../db/repositories/trackerRepo';
import { hasSupabaseConfig, supabase } from '../lib/supabase';
import type { StoredImage, TrackerItem } from '../types/tracker';

const BUCKET = 'tracker-images';

const ensureReady = () => {
  if (!hasSupabaseConfig || !supabase) throw new Error('Supabase is not configured.');
};

const trackerPayload = (item: TrackerItem, userId: string) => ({
  id: item.id,
  user_id: userId,
  title: item.title,
  company: item.company ?? null,
  notes: item.notes ?? null,
  delivery_receipt_date: item.deliveryReceiptDate ?? null,
  delivery_receipt_end_date: item.deliveryReceiptEndDate ?? null,
  images: item.images ?? [],
  updated_at: item.updatedAt,
  deleted_at: item.deletedAt ?? null,
});

const imagePathFor = (userId: string, image: StoredImage) => `${userId}/${image.trackerId}/${image.id}.${image.type === 'image/png' ? 'png' : 'jpg'}`;
const imageExtensionFor = (type: string | null | undefined) => (type === 'image/png' ? 'png' : 'jpg');

const normalizeStoragePath = (rawPath: unknown): string | null => {
  if (typeof rawPath !== 'string') return null;
  const trimmed = rawPath.trim();
  if (!trimmed) return null;
  if (!trimmed.includes('://')) return trimmed.replace(/^\/+/, '');
  try {
    const url = new URL(trimmed);
    const marker = `/object/public/${BUCKET}/`;
    const idx = url.pathname.indexOf(marker);
    if (idx >= 0) return decodeURIComponent(url.pathname.slice(idx + marker.length));
    return decodeURIComponent(url.pathname.replace(/^\/+/, ''));
  } catch {
    return trimmed.replace(/^\/+/, '');
  }
};

const notFoundError = (message: string) => {
  const lower = message.toLowerCase();
  return lower.includes('object not found') || lower.includes('not found') || lower.includes('404');
};

const imagePathCandidatesForDownload = (
  row: { id: string; tracker_id: string; type: string; image_path?: string | null },
  userId: string,
) => {
  const candidates = new Set<string>();
  const normalized = normalizeStoragePath(row.image_path);
  if (normalized) {
    candidates.add(normalized);
    if (!normalized.includes('/')) candidates.add(`${userId}/${row.tracker_id}/${normalized}`);
  }
  candidates.add(`${userId}/${row.tracker_id}/${row.id}.${imageExtensionFor(row.type)}`);
  return [...candidates];
};

export const syncService = {
  async syncNow() {
    ensureReady();
    if (!navigator.onLine) return;
    const { data: authData } = await supabase!.auth.getUser();
    const user = authData.user;
    if (!user) return;

    const queue = await syncQueueRepo.list();
    for (const item of queue) {
      if (item.entityType === 'tracker') {
        if (item.action === 'delete') {
          const { data: remoteTrackerImages } = await supabase!
            .from('tracker_images')
            .select('image_path')
            .eq('tracker_id', item.entityId)
            .eq('user_id', user.id);
          const storagePaths = (remoteTrackerImages ?? [])
            .map((row) => normalizeStoragePath(row.image_path))
            .filter((path): path is string => Boolean(path));
          if (storagePaths.length) {
            await supabase!.storage.from(BUCKET).remove(storagePaths);
          }
          await supabase!.from('trackers').delete().eq('id', item.entityId).eq('user_id', user.id);
          await supabase!.from('tracker_images').delete().eq('tracker_id', item.entityId).eq('user_id', user.id);
          await syncQueueRepo.delete(item.id);
          continue;
        }
        const tracker = await trackerRepo.getById(item.entityId);
        if (!tracker) {
          await syncQueueRepo.delete(item.id);
          continue;
        }
        await supabase!.from('trackers').upsert(trackerPayload({ ...tracker, userId: user.id }, user.id), { onConflict: 'id' });
        await db.trackers.update(tracker.id, { syncStatus: 'synced', userId: user.id });
        await syncQueueRepo.delete(item.id);
      }

      if (item.entityType === 'image') {
        if (item.action === 'delete') {
          const { data: remoteImage } = await supabase!
            .from('tracker_images')
            .select('image_path')
            .eq('id', item.entityId)
            .eq('user_id', user.id)
            .maybeSingle();
          const remoteImagePath = normalizeStoragePath(remoteImage?.image_path);
          if (remoteImagePath) {
            await supabase!.storage.from(BUCKET).remove([remoteImagePath]);
          }
          await supabase!.from('tracker_images').delete().eq('id', item.entityId).eq('user_id', user.id);
          await syncQueueRepo.delete(item.id);
          continue;
        }
        const image = await imageRepo.getById(item.entityId);
        if (!image) {
          await syncQueueRepo.delete(item.id);
          continue;
        }
        const imagePath = image.imagePath || imagePathFor(user.id, image);
        const uploadResult = await supabase!.storage.from(BUCKET).upload(imagePath, image.blob, {
          upsert: true,
          contentType: image.type,
          cacheControl: '3600',
        });
        if (uploadResult.error) throw new Error(`Image upload failed (${image.name}): ${uploadResult.error.message}`);
        await supabase!.from('tracker_images').upsert({
          id: image.id,
          user_id: user.id,
          tracker_id: image.trackerId,
          image_path: imagePath,
          name: image.name,
          type: image.type,
          size: image.size,
          updated_at: image.updatedAt ?? image.createdAt,
          deleted_at: image.deletedAt ?? null,
        }, { onConflict: 'id' });
        await db.images.update(image.id, { syncStatus: 'synced', userId: user.id, imagePath });
        await syncQueueRepo.delete(item.id);
      }
    }

    const { data: remoteTrackers } = await supabase!.from('trackers').select('*').eq('user_id', user.id).order('updated_at', { ascending: false });
    const remoteTrackerIds = new Set((remoteTrackers ?? []).map((row) => String(row.id)));
    for (const row of remoteTrackers ?? []) {
      const local = await trackerRepo.getById(row.id);
      const remoteUpdatedAt = String(row.updated_at ?? row.created_at ?? new Date().toISOString());
      if (!local || new Date(remoteUpdatedAt).getTime() > new Date(local.updatedAt).getTime()) {
        await trackerRepo.put({
          id: row.id,
          title: row.title,
          company: row.company ?? undefined,
          notes: row.notes ?? undefined,
          deliveryReceiptDate: row.delivery_receipt_date ?? undefined,
          deliveryReceiptEndDate: row.delivery_receipt_end_date ?? undefined,
          images: Array.isArray(row.images) ? row.images : [],
          createdAt: local?.createdAt ?? remoteUpdatedAt,
          updatedAt: remoteUpdatedAt,
          deletedAt: row.deleted_at ?? undefined,
          userId: user.id,
          syncStatus: 'synced',
        });
      }
    }
    const localTrackers = await trackerRepo.list();
    const localTrackerIdsToDelete = localTrackers
      .filter((item) => item.userId === user.id && item.syncStatus === 'synced' && !remoteTrackerIds.has(item.id))
      .map((item) => item.id);
    if (localTrackerIdsToDelete.length) {
      await db.trackers.bulkDelete(localTrackerIdsToDelete);
    }

    const { data: remoteImages } = await supabase!.from('tracker_images').select('*').eq('user_id', user.id).order('updated_at', { ascending: false });
    const remoteImageIds = new Set((remoteImages ?? []).map((row) => String(row.id)));
    for (const row of remoteImages ?? []) {
      const local = await imageRepo.getById(row.id);
      const remoteUpdatedAt = String(row.updated_at ?? row.created_at ?? new Date().toISOString());
      if (local && new Date(local.updatedAt ?? local.createdAt).getTime() >= new Date(remoteUpdatedAt).getTime()) continue;
      const candidates = imagePathCandidatesForDownload(row, user.id);
      let resolvedPath: string | null = null;
      let blob: Blob | null = null;
      let lastErrorMessage = '';
      for (const path of candidates) {
        const downloadResult = await supabase!.storage.from(BUCKET).download(path);
        if (downloadResult.error) {
          lastErrorMessage = downloadResult.error.message;
          if (notFoundError(downloadResult.error.message)) continue;
          throw new Error(`Image download failed (${path}): ${downloadResult.error.message}`);
        }
        if (downloadResult.data) {
          resolvedPath = path;
          blob = downloadResult.data;
          break;
        }
      }
      if (!blob || !resolvedPath) {
        throw new Error(`Image download failed (${String(row.image_path ?? row.id)}): ${lastErrorMessage || 'Object not found'}`);
      }

      if (row.image_path !== resolvedPath) {
        await supabase!.from('tracker_images').update({ image_path: resolvedPath }).eq('id', row.id).eq('user_id', user.id);
      }
      await imageRepo.put({
        id: row.id,
        trackerId: row.tracker_id,
        blob,
        name: row.name,
        type: row.type,
        size: row.size,
        createdAt: local?.createdAt ?? remoteUpdatedAt,
        updatedAt: remoteUpdatedAt,
        userId: user.id,
        syncStatus: 'synced',
        imagePath: resolvedPath,
      });
    }
    const localImages = await imageRepo.list();
    const localImageIdsToDelete = localImages
      .filter((item) => item.userId === user.id && item.syncStatus === 'synced' && !remoteImageIds.has(item.id))
      .map((item) => item.id);
    if (localImageIdsToDelete.length) {
      await db.images.bulkDelete(localImageIdsToDelete);
    }
  },
};
