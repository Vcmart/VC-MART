import type { Product, CustomerReview } from '../types';
import { inferCategoryHierarchy } from '../utils/clothingSizes';

// One-way adapter for legacy product documents. Firestore remains the canonical store.
export function ensureProductWholesaleFields(input: Product): Product {
  const p = input || ({} as Product);
  const setSize = Math.max(1, Math.floor(Number(p.setSize ?? p.set_size ?? 12) || 12));
  const wholesaleMinimumSets = Math.max(1, Math.floor(Number(p.wholesaleMinimumSets ?? p.wholesale_minimum_sets ?? 1) || 1));
  const retailPrice = Math.max(0, Number(p.retailPrice ?? p.retail_price ?? p.salePrice ?? p.price ?? 0) || 0);
  const wholesalePrice = Math.max(0, Number(p.wholesalePrice ?? p.wholesale_price ?? Math.round(retailPrice * 0.65 * setSize)) || 0);
  const sizeVariants = (Array.isArray(p.sizeVariants) ? p.sizeVariants : Array.isArray(p.size_variants) ? p.size_variants : []).map((variant) => ({
    ...variant,
    stock_quantity: Math.max(0, Number(variant.stock_quantity ?? variant.stock ?? 0) || 0),
    active: variant.active !== false,
  }));
  const sizes = Array.isArray(p.sizes) ? p.sizes.map(String) : sizeVariants.map((variant) => variant.size);
  const images = (Array.isArray(p.images) ? p.images : [p.image || p.image_url]).filter((url): url is string => typeof url === 'string' && /^https?:\/\//.test(url));
  const hierarchy = inferCategoryHierarchy(p.categoryName || 'General', p.shopId);
  const stock = sizeVariants.length ? sizeVariants.reduce((sum, variant) => sum + (variant.active ? variant.stock_quantity : 0), 0) : Math.max(0, Number(p.stock) || 0);
  const colors = Array.isArray(p.colors) ? p.colors : [];
  const wholesaleMixColors = (p.wholesaleMixColors || p.wholesale_mix_colors || []).map(String);
  const wholesaleEnabled = Boolean(p.wholesaleEnabled ?? p.wholesale_enabled ?? false);
  const status: Product['status'] = p.status === 'active' || p.status === 'inactive' ? p.status : 'inactive';

  return {
    ...p,
    sku: p.sku || '',
    name: String(p.name || ''),
    shopId: p.shopId,
    categoryId: p.categoryId || hierarchy.categoryId,
    categoryName: p.categoryName || hierarchy.categoryName,
    subcategoryId: p.subcategoryId || hierarchy.subcategoryId,
    subcategoryName: p.subcategoryName || hierarchy.subcategoryName,
    description: p.description || '',
    shortDescription: p.shortDescription || '',
    images,
    price: retailPrice,
    salePrice: retailPrice,
    retailPrice,
    wholesalePrice,
    wholesale_price: wholesalePrice,
    wholesaleEnabled,
    wholesale_enabled: wholesaleEnabled,
    setSize,
    set_size: setSize,
    wholesaleMinimumSets,
    wholesale_minimum_sets: wholesaleMinimumSets,
    wholesaleMixColors,
    wholesale_mix_colors: wholesaleMixColors,
    sizeVariants,
    size_variants: sizeVariants,
    sizes,
    colors,
    stock,
    status,
    createdAt: p.createdAt || new Date(0).toISOString(),
    updatedAt: p.updatedAt || p.createdAt || new Date(0).toISOString(),
  };
}

// Ratings/reviews require verified purchase data; no demonstration reviews are shipped.
export const initialReviews: CustomerReview[] = [];
