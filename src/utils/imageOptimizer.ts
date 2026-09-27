/**
 * VC MART - Product Image Optimization & Validation Utility
 * Compresses and resizes high-resolution photos in-browser before uploading to Firebase Storage
 */

export const MAX_PRODUCT_IMAGES = 7;
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
];
export const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate a single image file for format and size constraints
 */
export function validateImageFile(file: File): ImageValidationResult {
  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  const isAllowedExt = ALLOWED_EXTENSIONS.includes(extension);
  const isAllowedMime = ALLOWED_MIME_TYPES.includes(file.type.toLowerCase()) || isAllowedExt;

  if (!isAllowedMime) {
    return {
      valid: false,
      error: 'Please upload JPG, JPEG, PNG or WEBP images.',
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: 'Image must be smaller than 10 MB.',
    };
  }

  return { valid: true };
}

/**
 * Format bytes to readable string (e.g. 2.4 MB, 450 KB)
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Optimizes an image file by resizing dimensions (max 1600px) and compressing to WebP/JPEG
 */
export async function optimizeImageFile(
  file: File,
  maxDimension = 1600,
  quality = 0.85
): Promise<File> {
  return new Promise((resolve) => {
    // If SVG or already tiny, don't re-compress
    if (file.size < 120 * 1024 && file.type === 'image/webp') {
      return resolve(file);
    }

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;

      // Scale down if exceeds maxDimension
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return resolve(file);
      }

      // Smooth resizing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      // Prefer WebP for high compression & alpha support, fallback to JPEG
      const outputType = 'image/webp';
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            return resolve(file);
          }

          const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || 'product-image';
          const optimizedFile = new File([blob], `${baseName}.webp`, {
            type: outputType,
            lastModified: Date.now(),
          });

          // Only use optimized file if it's actually smaller or resized
          if (optimizedFile.size < file.size || width !== img.naturalWidth) {
            resolve(optimizedFile);
          } else {
            resolve(file);
          }
        },
        outputType,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };

    img.src = objectUrl;
  });
}
