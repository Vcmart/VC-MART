import React, { useState } from 'react';
import { Heart, Star, ShoppingBag, MessageCircle, Zap, ShieldCheck } from 'lucide-react';
import { Product } from '../types';
import { useStore } from '../context/StoreContext';
import { isClothingCategory } from '../utils/clothingSizes';
import { getDiscountPercentage, getProductImageUrls } from '../utils/productPresentation';
import { getProductPrice, getProductMrp } from '../utils/pricing';
import { ProductImageLightbox } from './ProductImageLightbox';

interface ProductCardProps {
  product: Product;
  badgeText?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, badgeText }) => {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const {
    addToCart,
    toggleWishlist,
    isInWishlist,
    openProductDetails,
    setCurrentView,
    shops,
    getWhatsAppProductUrl,
    shoppingMode,
  } = useStore();

  const isWholesale = shoppingMode === 'wholesale';
  const productImages = getProductImageUrls(product);
  const retailPrice = getProductPrice(product, 'retail');
  const mrp = getProductMrp(product);
  const discountPercentage = getDiscountPercentage(mrp, retailPrice);
  const setSize = product.set_size || product.setSize || 12;
  const wholesalePrice = getProductPrice(product, 'wholesale');
  const minSets = product.wholesale_minimum_sets || product.wholesaleMinimumSets || 1;

  const isOutOfStock = isWholesale ? product.stock < setSize : product.stock <= 0;
  const isLowStock = !isOutOfStock && product.stock <= (isWholesale ? setSize * 2 : 5);

  const isFavorite = isInWishlist(product.id);

  const shop = shops.find((s) => s.id === product.shopId);

  // Shop specific badge colors
  const getShopBadgeStyle = () => {
    switch (product.shopId) {
      case 'vinayak-collection':
        return 'bg-amber-100 text-[#7A3F0E] border-amber-300';
      case 'kinshuk-spare-parts':
        return 'bg-slate-100 text-slate-800 border-slate-300';
      case 'khushi-communication':
        return 'bg-sky-100 text-sky-900 border-sky-300';
      default:
        return 'bg-stone-100 text-stone-800 border-stone-200';
    }
  };

  const hasVariants =
    isWholesale ||
    isClothingCategory(product.categoryName, product.shopId) ||
    Boolean(product.sizes && product.sizes.length > 0) ||
    Boolean(product.size_variants && product.size_variants.length > 0) ||
    Boolean(product.colors && product.colors.length > 0) ||
    Boolean(product.color_variants && product.color_variants.length > 0) ||
    Boolean(product.clothingDetails?.colors && product.clothingDetails.colors.length > 0) ||
    Boolean(product.wholesale_available_sizes && product.wholesale_available_sizes.length > 0);

  const handleBuyNow = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOutOfStock) return;
    if (hasVariants) {
      openProductDetails(product);
      return;
    }
    addToCart(product, 1);
    setCurrentView('checkout');
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOutOfStock) return;
    if (hasVariants) {
      openProductDetails(product);
      return;
    }
    addToCart(product, 1);
  };

  return (
    <div
      id={`product-card-${product.id}`}
      onClick={() => openProductDetails(product)}
      className="group relative bg-white rounded-2xl overflow-hidden border border-[#E8DEC8] hover:border-[#B47226] shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col cursor-pointer"
    >
      {/* 1. Image Container */}
      <div className="relative aspect-square w-full bg-[#FAF7F2] overflow-hidden">
        <button type="button" aria-label={`View ${product.name} images full screen`} onClick={(event) => { event.stopPropagation(); setIsLightboxOpen(true); }} className="absolute inset-0 w-full h-full cursor-zoom-in">
          <img
            src={productImages[0]}
            alt={product.name}
            className="w-full h-full object-cover object-center group-hover:scale-106 transition-transform duration-500 ease-out"
            loading="lazy"
          />
        </button>

        {/* Top Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
          {/* Shop badge */}
          <span
            className={`text-[9px] sm:text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border shadow-xs backdrop-blur-md ${getShopBadgeStyle()}`}
          >
            {shop?.name || product.categoryName}
          </span>

          {/* Discount badge */}
          {!isWholesale && discountPercentage !== null && (
            <span className="text-[10px] font-black tracking-wider px-2 py-0.5 rounded-full bg-[#B91C1C] text-white shadow-xs">
              {discountPercentage}% OFF
            </span>
          )}

          {badgeText && (
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white shadow-xs">
              {badgeText}
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product.id);
          }}
          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-stone-700 hover:text-red-500 flex items-center justify-center shadow-md transition-all z-10 cursor-pointer"
          aria-label="Add to Wishlist"
        >
          <Heart
            size={16}
            className={isFavorite ? 'fill-red-500 text-red-500' : 'text-stone-700'}
          />
        </button>

        {/* WhatsApp Quick Inquire Button */}
        <a
          href={getWhatsAppProductUrl(product)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-md hover:scale-110 transition-transform z-10"
          title="Inquire on WhatsApp"
        >
          <MessageCircle size={16} className="fill-white" />
        </a>

        {/* Out of stock overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-white/85 backdrop-blur-xs flex flex-col items-center justify-center z-20 p-2 text-center">
            <span className="px-3 py-1 bg-stone-900 text-white text-xs font-bold uppercase tracking-wider rounded-md shadow-md">
              {isWholesale ? 'Insufficient Stock For Set' : 'Out of Stock'}
            </span>
            {isWholesale && (
              <span className="text-[10px] text-stone-600 mt-1 font-semibold">
                Needs min {setSize} pieces ({product.stock} available)
              </span>
            )}
          </div>
        )}
      </div>

      {/* 2. Content */}
      <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Subcategory & Rating Bar */}
          <div className="flex items-center justify-between gap-1 text-[11px] text-stone-500 mb-1">
            <span className="truncate">{product.subcategoryName || product.categoryName}</span>
            <div className="flex items-center gap-0.5 text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-bold shrink-0">
              <Star size={11} className="fill-amber-500 text-amber-500" />
              <span>{product.rating}</span>
              <span className="text-[10px] text-stone-400 font-normal">({product.reviewsCount})</span>
            </div>
          </div>

          {/* Product Title */}
          <h3 className="font-semibold text-xs sm:text-sm text-stone-900 line-clamp-2 group-hover:text-[#965215] transition-colors leading-snug">
            {product.name}
          </h3>

          {/* Short Description */}
          {product.shortDescription && (
            <p className="text-[11px] text-stone-500 line-clamp-1 mt-0.5">
              {product.shortDescription}
            </p>
          )}

          {/* Stock status indicator */}
          {isLowStock && (
            <p className="text-[10px] font-semibold text-amber-700 mt-1">
              {isWholesale
                ? `Only ${Math.floor(product.stock / setSize)} set(s) available (${product.stock} pcs)`
                : `Only ${product.stock} left in stock - order soon`}
            </p>
          )}
        </div>

        {/* 3. Pricing & Actions */}
        <div className="mt-3 pt-2.5 border-t border-stone-100">
          {isWholesale ? (
            /* WHOLESALE PRICING DISPLAY */
            <div className="mb-2.5">
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="bg-blue-900 text-white font-black text-[9px] uppercase px-1.5 py-0.5 rounded tracking-wider shadow-2xs">
                  WHOLESALE PRICE
                </span>
                <span className="text-[11px] font-extrabold text-blue-900 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                  1 SET = {setSize} PIECES
                </span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-base sm:text-lg font-black text-blue-900">
                  ₹{wholesalePrice.toLocaleString('en-IN')}
                </span>
                <span className="text-xs font-bold text-stone-600">/ SET</span>
                <span className="text-[10px] text-stone-500 ml-auto font-medium">
                  (₹{Math.round(wholesalePrice / setSize)}/pc)
                </span>
              </div>
              <div className="text-[10px] text-stone-500 mt-0.5 font-medium flex items-center justify-between">
                <span>Min Order: 1 SET</span>
                <span>Stock: {product.stock} pcs ({Math.floor(product.stock / setSize)} sets)</span>
              </div>
            </div>
          ) : (
            /* RETAIL PRICING DISPLAY */
            <div className="mb-2.5">
              {discountPercentage !== null && <span className="block text-[10px] text-stone-500">MRP <span className="line-through">₹{mrp.toLocaleString('en-IN')}</span></span>}
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span className="text-lg sm:text-xl font-extrabold text-[#7A3F0E]">₹{retailPrice.toLocaleString('en-IN')}</span>
              {discountPercentage !== null && (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                  {discountPercentage}% OFF
                </span>
              )}
              </div>
            </div>
          )}
          <p className="text-[10px] font-bold text-emerald-700 mb-2">{isWholesale ? '₹250 / SET DELIVERY' : 'FREE DELIVERY'}</p>

          {/* Buttons: Add to Cart & Buy Now */}
          <div className="grid grid-cols-2 gap-1 sm:gap-2">
            <button
              type="button"
              disabled={isOutOfStock}
              onClick={handleAddToCart}
              className={`py-1.5 sm:py-2 px-1 sm:px-2 rounded-xl text-[10px] sm:text-xs font-bold flex items-center justify-center gap-0.5 sm:gap-1 border transition-all cursor-pointer ${
                isOutOfStock
                  ? 'bg-stone-100 text-stone-400 border-stone-200 cursor-not-allowed'
                  : isWholesale
                  ? 'bg-blue-50 hover:bg-blue-100 text-blue-900 border-blue-300'
                  : 'bg-[#FAF7F2] hover:bg-[#F0E7DA] text-[#7A3F0E] border-[#D8C7B5] hover:border-[#965215]'
              }`}
            >
              <ShoppingBag size={12} className="shrink-0" />
              <span className="truncate">{isWholesale ? 'Add Set' : 'Add to Cart'}</span>
            </button>

            <button
              type="button"
              disabled={isOutOfStock}
              onClick={handleBuyNow}
              className={`py-1.5 sm:py-2 px-1 sm:px-2 rounded-xl text-[10px] sm:text-xs font-bold flex items-center justify-center gap-0.5 sm:gap-1 shadow-xs transition-all cursor-pointer ${
                isOutOfStock
                  ? 'bg-stone-300 text-stone-500 cursor-not-allowed'
                  : isWholesale
                  ? 'bg-blue-900 hover:bg-blue-950 text-white hover:shadow-md'
                  : 'bg-[#965215] hover:bg-[#7A3F0E] text-white hover:shadow-md'
              }`}
            >
              <Zap size={12} className="fill-white shrink-0" />
              <span className="truncate">{isWholesale ? 'Buy Set' : 'Buy Now'}</span>
            </button>
          </div>
        </div>
      </div>
      {isLightboxOpen && <ProductImageLightbox images={productImages} initialIndex={0} productName={product.name} onClose={() => setIsLightboxOpen(false)} />}
    </div>
  );
};
