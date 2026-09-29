import type { CartItem, Product, ShoppingMode } from '../types';

export const WHOLESALE_DELIVERY_PER_SET = 250;

export function getProductPrice(product: Product, mode: ShoppingMode): number {
  const value = mode === 'wholesale'
    ? product.wholesalePrice ?? product.wholesale_price ?? product.salePrice ?? product.retail_price ?? product.retailPrice ?? product.price
    : product.salePrice ?? product.retail_price ?? product.retailPrice ?? product.price;
  return Math.max(0, Number(value) || 0);
}

export function getProductMrp(product: Product): number {
  return Math.max(0, Number(product.price) || 0);
}

export function getDiscountPercentage(mrp: number, sellingPrice: number): number | null {
  if (!Number.isFinite(mrp) || !Number.isFinite(sellingPrice) || mrp <= sellingPrice || sellingPrice <= 0) return null;
  return Math.round(((mrp - sellingPrice) / mrp) * 100);
}

export function getCartItemPrice(item: CartItem, fallbackMode: ShoppingMode): number {
  return getProductPrice(item.product, item.shoppingMode || fallbackMode);
}

export function calculateCartTotals(items: CartItem[], fallbackMode: ShoppingMode, discount = 0) {
  const subtotal = items.reduce((sum, item) => sum + getCartItemPrice(item, fallbackMode) * Math.max(0, Number(item.quantity) || 0), 0);
  const numberOfSets = items.reduce((sum, item) => sum + ((item.shoppingMode || fallbackMode) === 'wholesale' ? Math.max(0, Number(item.quantity) || 0) : 0), 0);
  const shippingCharge = numberOfSets * WHOLESALE_DELIVERY_PER_SET;
  return { subtotal, numberOfSets, shippingCharge, total: Math.max(0, subtotal - discount + shippingCharge) };
}
