import type { Product } from '../types';
import { getProductColors } from './clothingSizes';
export { getDiscountPercentage } from './pricing';

export const DEFAULT_PRODUCT_IMAGE = 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=800&auto=format&fit=crop';

export function getProductImageUrls(product: Product): string[] {
  const savedImages = product.images?.filter(Boolean) || [];
  const base = savedImages.length ? savedImages : [product.image || product.image_url].filter((url): url is string => Boolean(url));
  const gallery = [...(product.product_images || []), ...(product.productImages || [])]
    .map((image) => image.url)
    .filter((url): url is string => Boolean(url));
  const colorImages = getProductColors(product).map((color) => color.imageUrl).filter((url): url is string => Boolean(url));
  const images = Array.from(new Set([...base, ...gallery, ...colorImages].filter((url): url is string => Boolean(url))));
  return images.length ? images : [DEFAULT_PRODUCT_IMAGE];
}
