/**
 * Image Processing Utility
 * 
 * Normalizes, converts HEIC/HEIF, auto-orients, scales down, and compresses
 * photos straight from iPhones, iPads, Android tablets, and digital cameras
 * before uploading to the server.
 */

export interface ProcessImageOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 to 1.0
  preserveTransparency?: boolean;
}

export interface ProcessedImageResult {
  file: File;
  previewUrl: string;
  originalSize: number;
  compressedSize: number;
  width: number;
  height: number;
}

/**
 * Checks if a given file or mime type is HEIC/HEIF
 */
export function isHeicFile(file: File | Blob): boolean {
  if (file.type && /image\/(heic|heif|heic-sequence|heif-sequence)/i.test(file.type)) {
    return true;
  }
  if ('name' in file && typeof file.name === 'string') {
    return /\.(heic|heif)$/i.test(file.name);
  }
  return false;
}

/**
 * Converts a HEIC/HEIF blob to a standard JPEG Blob.
 * Uses dynamic import of `heic2any` so the bundle remains light until HEIC is actually chosen.
 */
async function convertHeicIfNeeded(file: File): Promise<Blob> {
  if (!isHeicFile(file)) {
    return file;
  }

  try {
    const heic2anyModule = await import('heic2any');
    const heic2any = (heic2anyModule.default || heic2anyModule) as any;
    const converted = await heic2any({
      blob: file,
      toType: 'image/jpeg',
      quality: 0.9,
    });
    return Array.isArray(converted) ? converted[0] : converted;
  } catch (error) {
    console.warn('HEIC client-conversion fallback, attempting direct browser decode:', error);
    // Some browsers (like Safari on iOS/macOS) can decode HEIC natively via <img> or ImageBitmap
    return file;
  }
}

/**
 * Loads a Blob or File into an HTMLImageElement
 */
function loadImage(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image. File may be corrupted or an unsupported format.'));
    };
    img.src = url;
  });
}

/**
 * Main Normalization & Compression Function
 * 
 * - Converts HEIC/HEIF -> JPEG
 * - Scales down mega-resolution (e.g. 48MP/12MP down to specified max dimensions)
 * - Auto-corrects EXIF rotation
 * - Compresses to web-optimized JPEG or PNG (~100KB-350KB)
 */
export async function normalizeImage(
  file: File,
  options: ProcessImageOptions = {}
): Promise<ProcessedImageResult> {
  const {
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 0.85,
    preserveTransparency = false,
  } = options;

  const originalSize = file.size;

  // 1. Convert HEIC if needed
  const preparedBlob = await convertHeicIfNeeded(file);

  // 2. Load into HTML Image
  const img = await loadImage(preparedBlob);

  // 3. Compute target aspect ratio & dimensions
  let { width, height } = img;
  if (width > maxWidth || height > maxHeight) {
    const ratio = Math.min(maxWidth / width, maxHeight / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  // 4. Render to Canvas
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context not available');
  }

  // Draw image (modern browsers respect EXIF orientation automatically)
  const isPng = file.type === 'image/png' && preserveTransparency;
  if (!isPng) {
    // Fill white background for non-transparent JPEGs to avoid black artifact on transparent layers
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);
  }

  ctx.drawImage(img, 0, 0, width, height);

  // 5. Export to compressed Blob
  const exportFormat = isPng ? 'image/png' : 'image/jpeg';
  const compressedBlob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas export failed'));
      },
      exportFormat,
      isPng ? undefined : quality
    );
  });

  // 6. Clean and build normalized File name
  const cleanName = file.name
    .replace(/\.[^/.]+$/, '') // remove existing extension
    .replace(/\s+/g, '_')     // replace spaces with underscores
    .replace(/[^a-zA-Z0-9_-]/g, ''); // sanitize

  const extension = isPng ? '.png' : '.jpg';
  const normalizedFileName = `${cleanName || 'image'}${extension}`;

  const normalizedFile = new File([compressedBlob], normalizedFileName, {
    type: exportFormat,
    lastModified: Date.now(),
  });

  const previewUrl = URL.createObjectURL(compressedBlob);

  return {
    file: normalizedFile,
    previewUrl,
    originalSize,
    compressedSize: normalizedFile.size,
    width,
    height,
  };
}
