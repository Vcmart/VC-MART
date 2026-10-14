import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { requireFirebase } from './firebase';

// Existing branding rules allow public reads and admin image uploads under 5 MB.
export async function uploadOfferImage(file: File): Promise<string> {
  if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) throw new Error('Choose a JPG, PNG, WebP or GIF image.');
  if (file.size >= 5 * 1024 * 1024) throw new Error('Banner images must be smaller than 5 MB.');
  const { storage } = requireFirebase();
  const name = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const uploaded = await uploadBytes(ref(storage, `branding/offer-${crypto.randomUUID()}-${name}`), file, { contentType: file.type });
  return getDownloadURL(uploaded.ref);
}

export function validateOfferImage(url: string): Promise<string> {
  const value = url.trim();
  try {
    if (new URL(value).protocol !== 'https:') throw new Error();
  } catch {
    return Promise.reject(new Error('Enter a direct HTTPS image URL or upload a banner image.'));
  }
  return new Promise((resolve, reject) => {
    const image = new Image();
    const finish = (error?: string) => {
      clearTimeout(timer);
      image.onload = null;
      image.onerror = null;
      if (error) reject(new Error(error));
      else resolve(value);
    };
    const timer = setTimeout(() => finish('Banner image timed out. Check its public download URL.'), 15000);
    image.onload = () => image.naturalWidth > 0 ? finish() : finish('Banner image is empty.');
    image.onerror = () => finish('Banner image cannot load. Use a direct image download URL, not a sharing webpage, or upload the file.');
    // No crossOrigin: displaying an external image does not require CORS.
    image.src = value;
  });
}
