import type { OfferSlide, Product } from '../types';

export const salePath = (offer: Pick<OfferSlide, 'id'>) => `/sale/${encodeURIComponent(offer.id)}`;

export function saleProductIds(offer: Pick<OfferSlide, 'selectedProductIds'>): string[] {
  return Array.isArray(offer.selectedProductIds)
    ? [...new Set(offer.selectedProductIds.filter((id): id is string => typeof id === 'string' && !!id && !id.includes('/')))]
    : [];
}

export function selectSaleProducts(offer: OfferSlide, products: Product[]): Product[] {
  const byId = new Map(products.map(product => [product.id, product]));
  return saleProductIds(offer).flatMap(id => {
    const product = byId.get(id);
    if (!product || product.status !== 'active' || (product as Product & { is_active?: boolean; deletedAt?: string }).is_active === false || (product as Product & { deletedAt?: string }).deletedAt || (offer.shopId && product.shopId !== offer.shopId)) return [];
    return [product];
  });
}
