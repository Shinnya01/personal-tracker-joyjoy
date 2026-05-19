import { supabase } from './supabase';

export const TRACKER_IMAGES_BUCKET = 'tracker-images';

export const requireSupabase = () => {
  if (!supabase) throw new Error('Supabase is not configured.');
  return supabase;
};

export const requireUserId = async () => {
  const client = requireSupabase();
  const { data, error } = await client.auth.getUser();
  if (error) throw new Error(error.message);
  const userId = data.user?.id;
  if (!userId) throw new Error('Login required.');
  return userId;
};

export const imagePathFor = (userId: string, trackerId: string, imageId: string, type: string) =>
  `${userId}/${trackerId}/${imageId}.${type === 'image/png' ? 'png' : 'jpg'}`;

export const ensureNoError = (error: { message: string } | null, fallback: string) => {
  if (error) throw new Error(`${fallback}: ${error.message}`);
};
