import {
  IMAGE_FALLBACK_QUALITY,
  IMAGE_JPEG_QUALITY,
  MAX_IMAGE_DATA_URL_LENGTH,
  MAX_IMAGE_DIMENSION_PX,
  MAX_IMAGE_FILE_BYTES,
  MIN_IMAGE_DIMENSION,
} from './constants.ts';

/** Rejects non-image files or files exceeding 5 MB before decoding/resizing. */
export function validateImageFile(file: { size: number; type: string }): void {
  if (!file.type.startsWith('image/')) {
    throw new Error('Faqat rasm faylini tanlang (JPG, PNG, WebP).');
  }
  if (file.size <= 0) {
    throw new Error("Tanlangan rasm fayli bo'sh.");
  }
  if (file.size > MAX_IMAGE_FILE_BYTES) {
    throw new Error('Rasm hajmi 5 MB dan oshmasligi kerak. Kichikroq rasm tanlang.');
  }
}

/** Scales image dimensions so the longest side fits within maxSide while keeping aspect ratio. */
export function computeScaledDimensions(
  width: number,
  height: number,
  maxSide = MAX_IMAGE_DIMENSION_PX
): { width: number; height: number } {
  const safeW = Math.max(MIN_IMAGE_DIMENSION, width);
  const safeH = Math.max(MIN_IMAGE_DIMENSION, height);
  if (safeW <= maxSide && safeH <= maxSide) {
    return { width: Math.round(safeW), height: Math.round(safeH) };
  }
  const scale = maxSide / Math.max(safeW, safeH);
  return {
    width: Math.max(MIN_IMAGE_DIMENSION, Math.round(safeW * scale)),
    height: Math.max(MIN_IMAGE_DIMENSION, Math.round(safeH * scale)),
  };
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error("Rasmni o'qib bo'lmadi. Boshqa fayl tanlang."));
      }
    };
    reader.onerror = () => reject(new Error("Rasmni o'qib bo'lmadi. Boshqa fayl tanlang."));
    reader.readAsDataURL(file);
  });
}

function loadHtmlImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Rasmni o'qib bo'lmadi. Boshqa fayl tanlang."));
    img.src = src;
  });
}

/**
 * Resizes and compresses a browser File to a compact JPEG base64 data URL (<= 800px, quality ~0.7)
 * using FileReader + Canvas (compatible with strict `img-src 'self' data: https:` CSP without `blob:`).
 */
export async function compressImageToBase64(file: File): Promise<string> {
  validateImageFile(file);
  const sourceDataUrl = await readFileAsDataUrl(file);
  const img = await loadHtmlImage(sourceDataUrl);
  const target = computeScaledDimensions(img.naturalWidth, img.naturalHeight);

  const canvas = document.createElement('canvas');
  canvas.width = target.width;
  canvas.height = target.height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Brauzer rasmni siqishni qo‘llamaydi.');
  }
  ctx.drawImage(img, 0, 0, target.width, target.height);

  let dataUrl = canvas.toDataURL('image/jpeg', IMAGE_JPEG_QUALITY);
  if (dataUrl.length > MAX_IMAGE_DATA_URL_LENGTH) {
    dataUrl = canvas.toDataURL('image/jpeg', IMAGE_FALLBACK_QUALITY);
  }
  if (dataUrl.length > MAX_IMAGE_DATA_URL_LENGTH) {
    throw new Error('Rasm siqilgandan keyin ham juda katta. Boshqa rasm tanlang.');
  }
  return dataUrl;
}
