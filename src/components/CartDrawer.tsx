import React, { useState } from 'react';
import {
  X,
  Trash2,
  ShoppingBag,
  ArrowRight,
  Truck,
  ShieldCheck,
  Tag,
  Check,
  AlertCircle,
  Plus,
  Minus,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Logo } from './Logo';
import { getColorHex, safeStringArray } from '../utils/clothingSizes';

export const CartDrawer: React.FC = () => {
  const {
    cart,
    cartSubtotal,
    cartDiscount,
    deliveryFee,
    freeDeliveryThreshold,
    cartTotal,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    isCartDrawerOpen,
    setIsCartDrawerOpen,
    setCurrentView,
    shops,
    currentUser,
    openAuthModal,
    shoppingMode,
    isWholesaleEligibleForCheckout,
    wholesaleCartErrors,
  } = useStore();

  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState<string | null>(null);

  if (!isCartDrawerOpen) return null;

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError(null);
    if (!couponInput.trim()) return;

    const res = applyCoupon(couponInput.trim());
    if (!res.success) {
      setCouponError(res.message);
    } else {
      setCouponInput('');
    }
  };

  const handleCheckout = () => {
    if (!isWholesaleEligibleForCheckout) {
      return;
    }
    setIsCartDrawerOpen(false);
    if (!currentUser) {
      openAuthModal(
        'Please sign in or create an account to proceed to checkout. Your cart items are preserved!',
        'customer',
        () => {
          setCurrentView('checkout');
        }
      );
    } else {
      setCurrentView('checkout');
    }
  };

  const freeDeliveryDiff = freeDeliveryThreshold - cartSubtotal;
  const hasWholesaleItems = cart.some((item) => item?.product && (item.shoppingMode || shoppingMode) === 'wholesale');
  const hasRetailItems = cart.some((item) => item?.product && (item.shoppingMode || shoppingMode) === 'retail');

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-300">
        {/* 1. Header */}
        <div className="p-4 sm:p-5 bg-[#FAF7F2] border-b border-[#E8DEC8] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Logo size="sm" variant="image-only" />
            <h2 className="font-bold text-base text-stone-900 font-['Marcellus']">
              Shopping Cart ({cart.reduce((s, i) => s + i.quantity, 0)} Items)
            </h2>
          </div>

          <button
            onClick={() => setIsCartDrawerOpen(false)}
            className="p-1.5 rounded-full hover:bg-[#F0E7DA] text-stone-600 hover:text-stone-900 cursor-pointer"
            aria-label="Close cart"
          >
            <X size={20} />
          </button>
        </div>

        {/* Free Delivery Bar */}
        <div className="bg-[#2A1810] text-white px-4 py-2 text-xs flex items-center justify-between">
          {freeDeliveryDiff > 0 ? (
            <span className="text-[#EAD8C3]">
              Add <strong className="text-[#DFB062]">₹{freeDeliveryDiff}</strong> more for{' '}
              <strong className="text-emerald-400">FREE Delivery</strong>
            </span>
          ) : (
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <Truck size={14} /> You&apos;ve unlocked FREE Delivery across India!
            </span>
          )}
          <span className="text-[10px] text-stone-400">Min. ₹{freeDeliveryThreshold}</span>
        </div>

        {/* 2. Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 divide-y divide-stone-100">
          {cart.length === 0 ? (
            <div className="py-16 text-center">
              <div className="flex justify-center mb-3">
                <Logo size="md" variant="image-only" />
              </div>
              <h3 className="text-base font-bold text-stone-900 font-['Marcellus']">
                Your cart is empty
              </h3>
              <p className="text-xs text-stone-500 mt-1 max-w-xs mx-auto">
                Explore items from Vinayak Collection, Kinshuk Spare Parts, and Khushi Communication.
              </p>
              <button
                type="button"
                onClick={() => {
                  setIsCartDrawerOpen(false);
                  setCurrentView('shop');
                }}
                className="mt-5 px-6 py-2.5 bg-[#965215] hover:bg-[#7A3F0E] text-white rounded-full text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                START SHOPPING
              </button>
            </div>
          ) : (
            cart.map((item) => {
              if (!item || !item.product) return null;
              const shop = shops.find((s) => s.id === item.product.shopId);
              const isItemWholesale = (item.shoppingMode || shoppingMode) === 'wholesale';
              const rawColors = item.wholesaleColors || item.product?.wholesale_mix_colors || item.product?.wholesaleMixColors;
              const wholesaleMixColors = safeStringArray(rawColors).length > 0
                ? safeStringArray(rawColors)
                : ['Black', 'White', 'Blue', 'Red', 'Green', 'Maroon'];
              const setSize = Number(item.product.setSize || item.product.set_size || wholesaleMixColors.length || 6);
              const unitPrice = Number(
                isItemWholesale
                  ? (item.unitPrice ?? item.product.wholesale_price ?? item.product.wholesalePrice ?? item.product.salePrice ?? 0)
                  : (item.product.salePrice ?? item.unitPrice ?? 0)
              ) || 0;
              const totalPieces = Number(item.totalPieces ?? (isItemWholesale ? item.quantity * setSize : item.quantity)) || item.quantity;
              const prodStock = Number(item.product.stock ?? 0);
              const hasInsufficientStock = isItemWholesale
                ? totalPieces > prodStock
                : item.quantity > prodStock;

              const itemImage =
                item.colorImageUrl ||
                (Array.isArray(item.product.images) && item.product.images[0]) ||
                item.product.image ||
                item.product.image_url ||
                'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=800&auto=format&fit=crop';

              return (
                <div key={item.id} className="pt-3.5 first:pt-0 flex gap-3">
                  <img
                    src={itemImage}
                    alt={item.product.name || 'Product'}
                    className="w-18 h-18 object-cover rounded-xl border border-stone-200 bg-[#FAF7F2] shrink-0"
                  />

                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      {/* Shop Division and Mode tag */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[9px] uppercase font-bold text-[#965215] bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                          {shop?.name || item.product.categoryName || 'VC Mart'}
                        </span>
                        {isItemWholesale ? (
                          <span className="text-[9px] uppercase font-extrabold text-blue-900 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                            MIX COLOR SET &bull; {setSize} PCS
                          </span>
                        ) : null}
                      </div>

                      <h4 className="text-xs font-bold text-stone-900 truncate mt-1">
                        {item.product.name}
                      </h4>

                      {/* Variant and Set Details */}
                      {isItemWholesale ? (
                        <div className="text-[11px] text-blue-900 bg-blue-50/60 p-2 rounded-lg border border-blue-200/60 mt-1 space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-extrabold bg-blue-900 text-white text-[9px] px-1.5 py-0.2 rounded uppercase">
                              MIX COLOR SET
                            </span>
                            {item.selectedSize && (
                              <span>Size: <strong className="font-mono">{item.selectedSize}</strong></span>
                            )}
                            {item.selectedColor && (
                              <span>Color: <strong className="font-semibold">{item.selectedColor}</strong></span>
                            )}
                            <span>Sets: <strong>{item.quantity}</strong></span>
                            <span>Pieces: <strong>{totalPieces}</strong></span>
                          </div>
                          {wholesaleMixColors.length > 0 && (
                            <p className="text-[10px] text-stone-600 truncate" title={wholesaleMixColors.join(', ')}>
                              Colors: <strong className="text-stone-800">{wholesaleMixColors.join(', ')}</strong>
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-[11px] text-stone-700 mt-1 flex-wrap">
                          {item.selectedColor && (
                            <span className="inline-flex items-center gap-1 bg-[#FAF7F2] border border-[#E8DEC8] px-1.5 py-0.5 rounded font-bold text-stone-800">
                              <span
                                className="w-2.5 h-2.5 rounded-full border border-stone-300 inline-block"
                                style={{ backgroundColor: getColorHex(item.selectedColor) }}
                              />
                              Color: {item.selectedColor}
                            </span>
                          )}
                          {item.selectedSize && (
                            <span className="bg-[#FAF7F2] border border-[#E8DEC8] px-1.5 py-0.5 rounded font-bold text-stone-900 font-mono">
                              Size: {item.selectedSize}
                            </span>
                          )}
                          <span className="text-stone-500 font-semibold">Qty: <strong>{item.quantity}</strong></span>
                          <span className="text-stone-400">&bull;</span>
                          <span className="text-stone-500">₹{unitPrice} each</span>
                        </div>
                      )}

                      {hasInsufficientStock && (
                        <p className="text-[10px] text-red-600 font-bold mt-1">
                          ⚠️ Insufficient stock! Required: {totalPieces} pcs. Available: {prodStock} pcs.
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <div className="flex flex-col">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-xs font-extrabold text-[#7A3F0E]">
                            ₹{(unitPrice * item.quantity).toLocaleString('en-IN')}
                          </span>
                          <span className="text-[10px] text-stone-500">
                            (₹{unitPrice.toLocaleString('en-IN')}{isItemWholesale ? '/set' : '/item'})
                          </span>
                        </div>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center border border-stone-300 rounded-lg bg-white overflow-hidden shadow-2xs">
                        <button
                          type="button"
                          onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                          className="px-2 py-0.5 text-stone-600 hover:bg-stone-100 font-bold text-xs cursor-pointer"
                        >
                          <Minus size={11} />
                        </button>
                        <span className="px-2 py-0.5 text-xs font-bold text-stone-900 min-w-5 text-center">
                          {item.quantity} {isItemWholesale ? 'set' : ''}
                        </span>
                        <button
                          type="button"
                          disabled={(() => {
                            const rawVariants = item.product?.size_variants || item.product?.sizeVariants;
                            const sizeVariants = Array.isArray(rawVariants)
                              ? rawVariants
                              : typeof rawVariants === 'string'
                              ? safeStringArray(rawVariants)
                              : [];
                            const sizeVariant = item.selectedSize && Array.isArray(sizeVariants)
                              ? sizeVariants.find(
                                  (v: any) => String(v?.size || '').toLowerCase() === String(item.selectedSize || '').toLowerCase()
                                )
                              : undefined;
                            const availableItemStock = sizeVariant && typeof sizeVariant === 'object'
                              ? Number((sizeVariant as any).stock_quantity ?? (sizeVariant as any).stock ?? prodStock)
                              : prodStock;
                            return isItemWholesale
                              ? (item.quantity + 1) * setSize > prodStock
                              : item.quantity >= availableItemStock;
                          })()}
                          onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                          className="px-2 py-0.5 text-stone-600 hover:bg-stone-100 font-bold text-xs cursor-pointer disabled:opacity-30"
                        >
                          <Plus size={11} />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeFromCart(item.id)}
                        className="p-1 text-stone-400 hover:text-red-600 cursor-pointer"
                        title="Remove item"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 3. Footer with Totals and Checkout */}
        {cart.length > 0 && (
          <div className="p-4 sm:p-5 bg-[#FAF7F2] border-t border-[#E8DEC8] space-y-3">
            {/* Coupon Code Section */}
            {appliedCoupon ? (
              <div className="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs">
                <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                  <Tag size={13} className="text-emerald-600" />
                  <span>Coupon {appliedCoupon.code} Applied</span>
                </div>
                <button
                  type="button"
                  onClick={removeCoupon}
                  className="text-[11px] text-red-600 font-bold hover:underline cursor-pointer"
                >
                  Remove
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter coupon (e.g. VINAYAK10)"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  className="flex-1 px-3 py-1.5 text-xs uppercase bg-white border border-stone-300 rounded-xl focus:border-[#965215]"
                />
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#965215] text-white text-xs font-bold rounded-xl hover:bg-[#7A3F0E] cursor-pointer"
                >
                  Apply
                </button>
              </form>
            )}

            {couponError && (
              <p className="text-[11px] text-red-600 flex items-center gap-1">
                <AlertCircle size={12} /> {couponError}
              </p>
            )}

            {/* Quick coupon hint pills */}
            {!appliedCoupon && (
              <div className="flex items-center gap-1 text-[10px] text-stone-500 overflow-x-auto">
                <span className="shrink-0 font-medium">Try:</span>
                <button
                  type="button"
                  onClick={() => setCouponInput('INSTA100')}
                  className="font-mono bg-white border border-dashed border-stone-300 px-1.5 py-0.5 rounded hover:border-[#965215] cursor-pointer"
                >
                  INSTA100
                </button>
                <button
                  type="button"
                  onClick={() => setCouponInput('FLAT100')}
                  className="font-mono bg-white border border-dashed border-stone-300 px-1.5 py-0.5 rounded hover:border-[#965215] cursor-pointer"
                >
                  FLAT100
                </button>
                <button
                  type="button"
                  onClick={() => setCouponInput('WELCOME10')}
                  className="font-mono bg-white border border-dashed border-stone-300 px-1.5 py-0.5 rounded hover:border-[#965215] cursor-pointer"
                >
                  WELCOME10
                </button>
              </div>
            )}

            {/* Price Calculations */}
            <div className="space-y-1.5 text-xs text-stone-600 pt-2 border-t border-stone-200">
              <div className="flex justify-between">
                <span>Cart Subtotal</span>
                <span className="font-semibold text-stone-900">₹{cartSubtotal.toLocaleString('en-IN')}</span>
              </div>

              {cartDiscount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Coupon Discount</span>
                  <span className="font-bold">-₹{cartDiscount.toLocaleString('en-IN')}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Estimated Delivery</span>
                {deliveryFee === 0 ? (
                  <span className="font-bold text-emerald-700">FREE</span>
                ) : (
                  <span className="font-semibold text-stone-900">₹{deliveryFee}</span>
                )}
              </div>

              <div className="flex justify-between text-sm font-extrabold text-[#2A1810] pt-2 border-t border-stone-300">
                <span>Total Amount</span>
                <span className="text-base text-[#7A3F0E]">₹{cartTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Wholesale Cart Requirement Warnings */}
            {!isWholesaleEligibleForCheckout && wholesaleCartErrors.length > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                  <AlertCircle size={14} className="text-amber-700 shrink-0" />
                  <span>Wholesale Purchase Requirements:</span>
                </div>
                {wholesaleCartErrors.map((err, i) => (
                  <p key={i} className="text-[11px] text-amber-800 pl-5">
                    &bull; {err}
                  </p>
                ))}
              </div>
            )}

            {/* Checkout Button */}
            <button
              type="button"
              disabled={!isWholesaleEligibleForCheckout}
              onClick={handleCheckout}
              className={`w-full py-3.5 rounded-xl text-xs sm:text-sm font-bold tracking-wider uppercase shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer ${
                !isWholesaleEligibleForCheckout
                  ? 'bg-stone-300 text-stone-500 cursor-not-allowed shadow-none'
                  : hasWholesaleItems
                  ? 'bg-blue-900 hover:bg-blue-950 text-white'
                  : 'bg-[#965215] hover:bg-[#7A3F0E] text-white'
              }`}
            >
              <span>{hasWholesaleItems && hasRetailItems ? 'PROCEED TO MIXED CHECKOUT' : hasWholesaleItems ? 'PROCEED TO WHOLESALE CHECKOUT' : 'PROCEED TO CHECKOUT'}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
