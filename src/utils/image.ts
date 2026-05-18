const FALLBACK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 240"><rect width="320" height="240" fill="#f8fafc"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#94a3b8" font-size="20" font-family="sans-serif">No Image</text></svg>`;

export const FALLBACK_IMAGE_DATA_URL = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(FALLBACK_SVG)}`;

const canvasToBlob = (canvas: HTMLCanvasElement, type: string, quality?: number) =>
  new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) return reject(new Error('Unable to process image'));
      resolve(blob);
    }, type, quality);
  });

const decodeViaImageBitmap = async (file: File) => createImageBitmap(file);

const decodeViaImageElement = async (file: File): Promise<HTMLImageElement> => {
  const img = new Image();
  const objectUrl = URL.createObjectURL(file);
  try {
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Unsupported image format on this device.'));
      img.src = objectUrl;
    });
    return img;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
};

const decodeImage = async (file: File) => {
  try {
    return await decodeViaImageBitmap(file);
  } catch {
    return decodeViaImageElement(file);
  }
};

const drawToCanvas = (image: CanvasImageSource, width: number, height: number) => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Cannot read image context');
  ctx.drawImage(image, 0, 0, width, height);
  return canvas;
};

export const normalizeImageFile = async (file: File, maxSide = 1600): Promise<{ blob: Blob; type: string; size: number }> => {
  const decoded = await decodeImage(file);
  const width = 'naturalWidth' in decoded ? decoded.naturalWidth : decoded.width;
  const height = 'naturalHeight' in decoded ? decoded.naturalHeight : decoded.height;
  const ratio = Math.min(1, maxSide / Math.max(width, height));
  const targetWidth = Math.round(width * ratio);
  const targetHeight = Math.round(height * ratio);
  const canvas = drawToCanvas(decoded, targetWidth, targetHeight);
  const sourceType = (file.type || '').toLowerCase();
  const isPngLike = sourceType.includes('png');
  const outputType = isPngLike ? 'image/png' : 'image/jpeg';
  const quality = outputType === 'image/jpeg' ? 0.82 : undefined;
  const blob = await canvasToBlob(canvas, outputType, quality);
  return { blob, type: outputType, size: blob.size };
};
