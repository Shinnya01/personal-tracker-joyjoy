import { ref } from 'vue';
import type { StoredImage } from '../types/tracker';
import { createId, nowIso } from '../utils/date';
import { normalizeImageFile } from '../utils/image';

export const useImageProcessor = () => {
  const previews = ref<Array<{ id: string; url: string; file: StoredImage }>>([]);

  const processFile = async (trackerId: string, file: File) => {
    const normalized = await normalizeImageFile(file);
    const timestamp = nowIso();

    const image: StoredImage = {
      id: createId(),
      trackerId,
      blob: normalized.blob,
      name: file.name,
      type: normalized.type,
      size: normalized.size,
      createdAt: timestamp,
      updatedAt: timestamp,
      syncStatus: 'pending',
    };

    const url = URL.createObjectURL(normalized.blob);
    previews.value.push({ id: image.id, url, file: image });
  };

  const processFiles = async (trackerId: string, files: FileList | null) => {
    if (!files) return { added: 0, failed: [] as string[] };
    const failed: string[] = [];
    let added = 0;
    for (const file of Array.from(files)) {
      try {
        await processFile(trackerId, file);
        added += 1;
      } catch {
        failed.push(file.name);
      }
    }
    return { added, failed };
  };

  const removePreview = (id: string) => {
    const target = previews.value.find((item) => item.id === id);
    if (target) URL.revokeObjectURL(target.url);
    previews.value = previews.value.filter((item) => item.id !== id);
  };

  const clear = () => {
    previews.value.forEach((item) => URL.revokeObjectURL(item.url));
    previews.value = [];
  };

  return { previews, processFiles, removePreview, clear };
};
