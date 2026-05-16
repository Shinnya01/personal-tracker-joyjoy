import { ref } from 'vue';
import type { StoredImage } from '../types/tracker';
import { createId, nowIso } from '../utils/date';

const canvasToBlob = (canvas: HTMLCanvasElement, type: string, quality: number) =>
  new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) return reject(new Error('Unable to process image'));
      resolve(blob);
    }, type, quality);
  });

export const useImageProcessor = () => {
  const previews = ref<Array<{ id: string; url: string; file: StoredImage }>>([]);

  const processFile = async (trackerId: string, file: File) => {
    const bitmap = await createImageBitmap(file);
    const max = 1600;
    const ratio = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * ratio);
    const height = Math.round(bitmap.height * ratio);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Cannot read image context');

    ctx.drawImage(bitmap, 0, 0, width, height);

    const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
    const blob = await canvasToBlob(canvas, outputType, 0.8);

    const image: StoredImage = {
      id: createId(),
      trackerId,
      blob,
      name: file.name,
      type: outputType,
      size: blob.size,
      createdAt: nowIso(),
    };

    const url = URL.createObjectURL(blob);
    previews.value.push({ id: image.id, url, file: image });
  };

  const processFiles = async (trackerId: string, files: FileList | null) => {
    if (!files) return;
    for (const file of Array.from(files)) {
      await processFile(trackerId, file);
    }
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

