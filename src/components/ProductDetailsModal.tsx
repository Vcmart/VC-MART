import React, { useState, useEffect } from 'react';
import {
  X,
  Star,
  Heart,
  Share2,
  MessageCircle,
  ShoppingBag,
  Zap,
  Truck,
  ShieldCheck,
  RotateCcw,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Ruler,
  Check,
  Palette,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { ProductCard } from './ProductCard';
import { Logo } from './Logo';
import { SizeChartModal } from './SizeChartModal';
import {
  isClothingCategory,
  getProductColors,
  getProductWholesaleColors,
  getColorHex,
  getRecommendedSizesForCategory,
} from '../utils/clothingSizes';

export const ProductDetailsModal: React.FC = () => {
  const {
    selectedProduct,
    closeProductDetails,
    addToCart,
    toggleWishlist,
    isInWishlist,
    setCurrentView,
    setActiveShopId,
    products,
    shops,
    getWhatsAppProductUrl,
    currentUser,
    openAuthModal,
    shoppingMode,
  } = useStore();

  const isWholesale = shoppingMode === 'wholesale';
  const wholesaleMixColors = selectedProduct ? getProductWholesaleColors(selectedProduct) : [];
  const setSize = selectedProduct
    ? Number(selectedProduct.setSize || selectedProduct.set_size || wholesaleMixColors.length || 6)
    : 6;
  const wholesalePrice = Number(
    selectedProduct ? (selectedProduct.wholesale_price ?? selectedProduct.wholesalePrice ?? selectedProduct.salePrice ?? 0) : 0
  ) || 0;
  const minSets = selectedProduct ? (selectedProduct.wholesale_minimum_sets || selectedProduct.wholesaleMinimumSets || 1) : 1;
  const maxSetsAvailable = selectedProduct ? Math.floor(Number(selectedProduct.stock ?? 0) / (setSize || 1)) : 0;

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [sizeValidationError, setSizeValidationError] = useState<string | null>(null);
  const [colorValidationError, setColorValidationError] = useState<string | null>(null);
  const [isSizeChartOpen, setIsSizeChartOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setActiveImageIndex(0);
    setSelectedSize('');
    setSelectedColor('');
    setSizeValidationError(null);
    setColorValidationError(null);
    setIsSizeChartOpen(false);
    setQuantity(1);
  }, [selectedProduct?.id]);

  if (!selectedProduct) return null;

  const isClothing = isClothingCategory(selectedProduct.categoryName, selectedProduct.shopId);
  const sizeVariants = selectedProduct.size_variants || selectedProduct.sizeVariants || [];
  const wholesaleSizes = selectedProduct.wholesale_available_sizes || selectedProduct.wholesaleAvailableSizes;
  const rawSizesList = (isWholesale && wholesaleSizes && wholesaleSizes.length > 0)
    ? wholesaleSizes
    : (selectedProduct.sizes && selectedProduct.sizes.length > 0)
    ? selectedProduct.sizes
    : sizeVariants.map((v) => v.size);
  const fallbackSizes = isClothing ? getRecommendedSizesForCategory(selectedProduct.categoryName) : [];
  const availableSizesList = rawSizesList && rawSizesList.length > 0 ? rawSizesList : fallbackSizes;
  const hasSizes = isClothing && availableSizesList.length > 0;

  // Extract available colors saved in database
  const availableColors = getProductColors(selectedProduct);
  const hasColors = availableColors.length > 0;

  // Build productImages combining base product images and color preview images
  const baseImages =
    selectedProduct.images && selectedProduct.images.length > 0
      ? selectedProduct.images
      : (selectedProduct.image || selectedProduct.image_url)
      ? [selectedProduct.image || selectedProduct.image_url!]
      : ['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=800&auto=format&fit=crop'];

  const colorImages = availableColors.map((c) => c.imageUrl).filter(Boolean) as string[];
  const productImages = Array.from(new Set([...baseImages, ...colorImages]));

  const isOutOfStock = isWholesale ? selectedProduct.stock < setSize : selectedProduct.stock <= 0;
  const isFavorite = isInWishlist(selectedProduct.id);
  const shop = shops.find((s) => s.id === selectedProduct.shopId);

  // Retail vs Wholesale Selection enforcement
  const isRetailColorRequired = !isWholesale && hasColors;
  const isRetailSizeRequired = !isWholesale && hasSizes;
  const isColorSelected = Boolean(selectedColor);
  const isSizeSelected = Boolean(selectedSize);

  // In Retail mode: Both Color and Size MUST be selected before Add to Cart becomes active
  const isRetailSelectionIncomplete =
    (isRetailColorRequired && !isColorSelected) ||
    (isRetailSizeRequired && !isSizeSelected);

  // In Wholesale mode: Size must be selected for the whole set if product has sizes
  const isWholesaleSelectionIncomplete = isWholesale && hasSizes && !isSizeSelected;

  const isSelectionIncomplete = isWholesale
    ? isWholesaleSelectionIncomplete
    : isRetailSelectionIncomplete;

  const isAddToCartActive = !isOutOfStock && !isSelectionIncomplete;

  // Related products from same shop or category (excluding current)
  const relatedProducts = products
    .filter((p) => p.id !== selectedProduct.id && (p.shopId === selectedProduct.shopId || p.categoryName === selectedProduct.categoryName))
    .slice(0, 4);

  // Color preview handler: Selects color and updates main preview image
  const handleSelectColor = (colorName: string) => {
    setSelectedColor(colorName);
    setColorValidationError(null);
    const colorObj = availableColors.find(
      (c) => c.name.toLowerCase() === colorName.toLowerCase()
    );
    if (colorObj?.imageUrl) {
      const idx = productImages.findIndex((img) => img === colorObj.imageUrl);
      if (idx !== -1) {
        setActiveImageIndex(idx);
      }
    } else {
      const colorIdx = availableColors.findIndex(
        (c) => c.name.toLowerCase() === colorName.toLowerCase()
      );
      if (colorIdx >= 0 && colorIdx < productImages.length) {
        setActiveImageIndex(colorIdx);
      }
    }
  };

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    if (!isWholesale && hasColors && !selectedColor) {
      setColorValidationError('Please select a color');
      return;
    }
    if (hasSizes && !selectedSize) {
      setSizeValidationError('Please select a size');
      return;
    }

    const chosenColorObj = availableColors.find(
      (c) => c.name.toLowerCase() === (selectedColor || '').toLowerCase()
    );
    const colorImageUrl = chosenColorObj?.imageUrl || productImages[activeImageIndex];

    addToCart(
      selectedProduct,
      quantity,
      selectedSize ? { Size: selectedSize, ...(selectedColor ? { Color: selectedColor } : {}) } : (selectedColor ? { Color: selectedColor } : {}),
      undefined,
      selectedColor ? { color: selectedColor, colorImageUrl } : undefined
    );
  };

  const handleBuyNow = () => {
    if (isOutOfStock) return;
    if (!isWholesale && hasColors && !selectedColor) {
      setColorValidationError('Please select a color');
      return;
    }
    if (hasSizes && !selectedSize) {
      setSizeValidationError('Please select a size');
      return;
    }

    const chosenColorObj = availableColors.find(
      (c) => c.name.toLowerCase() === (selectedColor || '').toLowerCase()
    );
    const colorImageUrl = chosenColorObj?.imageUrl || productImages[activeImageIndex];

    addToCart(
      selectedProduct,
      quantity,
      selectedSize ? { Size: selectedSize, ...(selectedColor ? { Color: selectedColor } : {}) } : (selectedColor ? { Color: selectedColor } : {}),
      undefined,
      selectedColor ? { color: selectedColor, colorImageUrl } : undefined
    );
    closeProductDetails();
    if (!currentUser) {
      openAuthModal(
        'Please sign in or create an account to complete your instant checkout.',
        'customer',
        () => {
          setCurrentView('checkout');
        }
      );
    } else {
      setCurrentView('checkout');
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: selectedProduct.name,
          text: `Check out ${selectedProduct.name} on VC MART for ₹${selectedProduct.salePrice}!`,
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleViewShop = () => {
    closeProductDetails();
    setActiveShopId(selectedProduct.shopId);
    setCurrentView('shop');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto">
      <div className="relative bg-white rounded-3xl max-w-5xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-[#E8DEC8] my-auto">
        {/* Sticky Close Button */}
        <button
          onClick={closeProductDetails}
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-white/90 hover:bg-stone-100 text-stone-700 hover:text-stone-950 flex items-center justify-center shadow-md cursor-pointer"
          aria-label="Close modal"
        >
          <X size={20} />
        </button>

        <div className="p-4 sm:p-8">
          {/* Top Breadcrumb Inside Modal */}
          <div className="flex items-center gap-1.5 text-xs text-stone-500 mb-4 pr-10">
            <button
              onClick={handleViewShop}
              className="text-[#965215] font-semibold hover:underline"
            >
              {shop?.name}
            </button>
            <ChevronRight size={12} />
            <span className="truncate">{selectedProduct.categoryName}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10">
            {/* Left: Gallery (Thumbnails + Main Image) */}
            <div className="lg:col-span-6 flex flex-col-reverse sm:flex-row gap-3">
              {/* Thumbnails list (scrollable on mobile and desktop) */}
              {productImages.length > 1 && (
                <div className="flex sm:flex-col gap-2 overflow-x-auto sm:overflow-y-auto max-h-96 shrink-0 py-1 sm:py-0 scrollbar-thin">
                  {productImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                        activeImageIndex === idx
                          ? 'border-[#965215] ring-2 ring-[#B47226]/30 scale-102 shadow-sm'
                          : 'border-stone-200 opacity-70 hover:opacity-100 hover:border-stone-300'
                      }`}
                    >
                      <img
                        src={img}
                        alt={`${selectedProduct.name} - view ${idx + 1}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      {idx === 0 && (
                        <span className="absolute bottom-0 inset-x-0 bg-[#965215]/85 text-white text-[8px] font-bold text-center py-0.5 leading-none">
                          Primary
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Main Preview Image */}
              <div className="group relative flex-1 aspect-square rounded-2xl overflow-hidden bg-[#FAF7F2] border border-stone-200 shadow-xs">
                <img
                  src={productImages[activeImageIndex] || productImages[0]}
                  alt={`${selectedProduct.name} - ${activeImageIndex + 1}`}
                  className="w-full h-full object-cover transition-opacity duration-300"
                  loading="eager"
                />

                {/* Left/Right Navigation Arrows for Multiple Images */}
                {productImages.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : productImages.length - 1))
                      }
                      title="Previous photo"
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-stone-800 shadow-md flex items-center justify-center transition-all opacity-80 sm:opacity-0 sm:group-hover:opacity-100 cursor-pointer"
                    >
                      <ChevronLeft size={18} />
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setActiveImageIndex((prev) => (prev < productImages.length - 1 ? prev + 1 : 0))
                      }
                      title="Next photo"
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-stone-800 shadow-md flex items-center justify-center transition-all opacity-80 sm:opacity-0 sm:group-hover:opacity-100 cursor-pointer"
                    >
                      <ChevronRight size={18} />
                    </button>

                    {/* Image Counter Badge */}
                    <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-md">
                      {activeImageIndex + 1} / {productImages.length}
                    </div>
                  </>
                )}

                {/* Wishlist & Share Quick Icons */}
                <div className="absolute top-3 left-3 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => toggleWishlist(selectedProduct.id)}
                    className="w-9 h-9 rounded-full bg-white/90 hover:bg-white text-stone-700 shadow-md flex items-center justify-center transition-transform hover:scale-105 cursor-pointer"
                  >
                    <Heart
                      size={18}
                      className={isFavorite ? 'fill-red-500 text-red-500' : ''}
                    />
                  </button>
                  <button
                    type="button"
                    onClick={handleShare}
                    className="w-9 h-9 rounded-full bg-white/90 hover:bg-white text-stone-700 shadow-md flex items-center justify-center transition-transform hover:scale-105 cursor-pointer"
                    title="Share product link"
                  >
                    <Share2 size={16} />
                  </button>
                </div>

                {copied && (
                  <div className="absolute top-14 left-3 bg-stone-900 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg">
                    Link Copied!
                  </div>
                )}
              </div>
            </div>

            {/* Right: Product Info & Buy Controls */}
            <div className="lg:col-span-6 flex flex-col justify-between">
              <div>
                {/* Shop Badge */}
                <div className="flex items-center gap-2 mb-2">
                  <button
                    onClick={handleViewShop}
                    className="text-xs font-bold uppercase tracking-wider text-[#7A3F0E] bg-amber-50 hover:bg-amber-100 px-3 py-1 rounded-full border border-amber-200 cursor-pointer"
                  >
                    {shop?.name} &rarr;
                  </button>

                  <span className="text-xs text-stone-400">|</span>
                  <span className="text-xs font-medium text-stone-500">
                    Brand: {selectedProduct.brand}
                  </span>
                </div>

                {/* Product Name */}
                <h1 className="text-xl sm:text-2xl font-bold font-['Marcellus'] text-stone-900 leading-snug">
                  {selectedProduct.name}
                </h1>

                {/* Rating & Reviews Count */}
                <div className="flex items-center gap-3 mt-2 pb-3 border-b border-stone-100">
                  <div className="flex items-center gap-1 bg-amber-50 text-amber-800 font-bold text-xs px-2 py-0.5 rounded">
                    <Star size={13} className="fill-amber-500 text-amber-500" />
                    <span>{selectedProduct.rating}</span>
                  </div>
                  <span className="text-xs text-stone-500">
                    Based on {selectedProduct.reviewsCount} customer reviews
                  </span>
                  <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                    <ShieldCheck size={14} /> Verified Buyer Reviews
                  </span>
                </div>

                {/* Pricing Box */}
                {isWholesale ? (
                  <div className="mt-4 bg-gradient-to-br from-blue-50 to-indigo-50/50 p-4 rounded-2xl border-2 border-blue-200">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="bg-blue-900 text-white font-black text-[10px] uppercase px-2 py-0.5 rounded tracking-wider shadow-2xs">
                        WHOLESALE PRICE
                      </span>
                      <span className="text-xs font-black text-blue-900 bg-white px-2.5 py-1 rounded-full border border-blue-300 shadow-2xs">
                        1 SET = {setSize} PIECES
                      </span>
                    </div>

                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl sm:text-3xl font-black text-blue-900">
                        ₹{wholesalePrice.toLocaleString('en-IN')}
                      </span>
                      <span className="text-sm font-bold text-stone-600">/ SET</span>
                      <span className="text-xs text-stone-500 ml-auto font-medium">
                        (₹{Math.round(wholesalePrice / setSize)} / piece)
                      </span>
                    </div>

                    <div className="mt-2 pt-2 border-t border-blue-200/60 flex items-center justify-between text-xs text-blue-950">
                      <span className="font-bold">Minimum Order: {minSets} SET ({setSize} pieces)</span>
                      <span className="text-[11px] text-stone-600">
                        Available Stock: <strong>{selectedProduct.stock} pcs</strong> ({maxSetsAvailable} sets)
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 bg-[#FAF7F2] p-4 rounded-2xl border border-[#E8DEC8]">
                    <div className="flex items-baseline gap-3">
                      <span className="text-2xl sm:text-3xl font-extrabold text-[#7A3F0E]">
                        ₹{selectedProduct.salePrice.toLocaleString('en-IN')}
                      </span>
                      {selectedProduct.price > selectedProduct.salePrice && (
                        <span className="text-sm text-stone-400 line-through">
                          ₹{selectedProduct.price.toLocaleString('en-IN')}
                        </span>
                      )}
                      {selectedProduct.discount > 0 && (
                        <span className="text-xs font-bold px-2 py-0.5 bg-[#B91C1C] text-white rounded-full">
                          {selectedProduct.discount}% OFF
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-stone-500 mt-1">
                      Inclusive of all taxes &bull; Free Shipping across India on orders over ₹499
                    </p>
                  </div>
                )}

                {/* Stock Status Indicator */}
                <div className="mt-4">
                  {isOutOfStock ? (
                    <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-700">
                      {isWholesale
                        ? `Insufficient Stock for 1 Set. Requires minimum ${setSize} pieces (${selectedProduct.stock} currently available).`
                        : 'Currently Out of Stock'}
                    </div>
                  ) : isWholesale ? (
                    <div className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 size={14} className="text-emerald-600" />
                        In Stock for Wholesale: {maxSetsAvailable} Complete Set{maxSetsAvailable > 1 ? 's' : ''}
                      </span>
                      <span className="text-[11px] text-stone-600">
                        ({selectedProduct.stock} total pieces)
                      </span>
                    </div>
                  ) : selectedProduct.stock <= 5 ? (
                    <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md">
                      Hurry! Only {selectedProduct.stock} units left in warehouse
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md flex items-center gap-1 w-fit">
                      <CheckCircle2 size={13} /> In Stock &bull; Ready for Instant Dispatch
                    </span>
                  )}
                </div>

                {/* WHOLESALE MIX SET BANNER (Wholesale Mode Only) */}
                {isWholesale && (
                  <div className="mt-5 p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50/70 border-2 border-blue-200 space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="bg-blue-900 text-white font-black text-xs uppercase px-3 py-1 rounded-full tracking-wider shadow-xs flex items-center gap-1.5">
                        <span>📦</span>
                        <span>WHOLESALE MIX SET</span>
                      </span>
                      <span className="text-xs font-black text-blue-900 bg-white px-3 py-1 rounded-full border border-blue-200 shadow-2xs">
                        {setSize} Pieces = 1 Set
                      </span>
                    </div>

                    {/* Color List summary */}
                    <div>
                      <p className="text-[11px] font-semibold text-blue-950 mb-1.5 flex items-center justify-between">
                        <span>Wholesale color mix:</span>
                        <span className="text-[10px] text-blue-700 font-bold">Auto-Packed</span>
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {wholesaleMixColors.map((colName) => {
                          const hex = getColorHex(colName);
                          return (
                            <div
                              key={colName}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-blue-200 text-xs font-bold text-stone-800 shadow-2xs"
                            >
                              <span
                                className="w-3 h-3 rounded-full border border-stone-300 shrink-0"
                                style={{ backgroundColor: hex }}
                              />
                              <span>{colName}</span>
                              <span className="text-[10px] text-blue-700 font-extrabold">&times; {quantity}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Breakdown when Size is chosen */}
                    {selectedSize && (
                      <div className="bg-white/95 rounded-xl p-3 border border-blue-200 shadow-2xs">
                        <div className="flex items-center justify-between text-xs font-extrabold text-blue-900 border-b border-blue-100 pb-1.5 mb-2">
                          <span className="flex items-center gap-1.5">
                            <span className="bg-blue-900 text-white px-1.5 py-0.2 rounded font-mono text-[10px] uppercase">
                              {selectedSize} SET
                            </span>
                            <span>{quantity > 1 ? `\u00D7 ${quantity} Sets` : '1 Set'}</span>
                          </span>
                          <span className="text-[11px] text-blue-800 font-black">
                            = {quantity * setSize} pieces total
                          </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-xs text-stone-700">
                          {wholesaleMixColors.map((col) => (
                            <div
                              key={col}
                              className="flex items-center justify-between px-2 py-1 bg-stone-50 rounded-lg border border-stone-200"
                            >
                              <div className="flex items-center gap-1.5 truncate">
                                <span
                                  className="w-2.5 h-2.5 rounded-full border border-stone-300 shrink-0"
                                  style={{ backgroundColor: getColorHex(col) }}
                                />
                                <span className="truncate font-semibold">{col}</span>
                              </div>
                              <span className="font-mono font-bold text-blue-900 ml-1">
                                &times; {quantity}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Wholesale Set Specs & Rules */}
                    <div className="pt-2 border-t border-blue-200/70 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-blue-900">
                      <div className="bg-white/70 p-2 rounded-lg border border-blue-100">
                        <span className="text-[10px] text-stone-500 block uppercase font-bold">Wholesale Price</span>
                        <strong className="text-sm font-extrabold text-blue-950">₹{wholesalePrice.toLocaleString('en-IN')}</strong> / Set
                      </div>
                      <div className="bg-white/70 p-2 rounded-lg border border-blue-100">
                        <span className="text-[10px] text-stone-500 block uppercase font-bold">Set Size</span>
                        <strong className="text-sm font-extrabold text-blue-950">{setSize} Pieces</strong> / Set
                      </div>
                      <div className="bg-white/70 p-2 rounded-lg border border-blue-100 col-span-2 sm:col-span-1">
                        <span className="text-[10px] text-stone-500 block uppercase font-bold">Minimum Order</span>
                        <strong className="text-sm font-extrabold text-blue-950">{minSets} Set</strong> ({minSets * setSize} pcs)
                      </div>
                    </div>

                    <p className="text-[10px] text-stone-500 italic">
                      * Wholesale customer individual color select nahi kar sakta. Har set me automatically sabhi colors ka 1-1 piece included hai.
                    </p>
                  </div>
                )}

                {/* RETAIL AVAILABLE COLORS (Selectable buttons from saved database colors) */}
                {!isWholesale && hasColors && (
                  <div className="mt-5 p-4 rounded-2xl bg-stone-50/80 border border-stone-200">
                    <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-amber-100 text-[#965215] flex items-center justify-center shrink-0">
                          <Palette size={14} />
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black uppercase tracking-wider text-stone-900">
                            AVAILABLE COLORS
                          </span>
                          <span className="text-[10px] font-bold text-stone-600 bg-white px-2 py-0.5 rounded-full border border-stone-200">
                            {availableColors.length} {availableColors.length === 1 ? 'Color' : 'Colors'}
                          </span>
                        </div>
                      </div>

                      {/* Selection Status Badge */}
                      {selectedColor ? (
                        <span className="text-xs font-bold text-stone-900 bg-white px-2.5 py-1 rounded-lg border border-amber-300 shadow-2xs flex items-center gap-1.5">
                          <span
                            className="w-2.5 h-2.5 rounded-full border border-stone-300 shrink-0"
                            style={{ backgroundColor: getColorHex(selectedColor) }}
                          />
                          <span>Color: <strong className="text-[#965215]">{selectedColor}</strong></span>
                        </span>
                      ) : (
                        <span className="text-[11px] font-extrabold text-amber-800 bg-amber-100/90 px-2.5 py-1 rounded-lg border border-amber-300 flex items-center gap-1 animate-pulse">
                          <span>□</span>
                          <span>Pick Color (Required)</span>
                        </span>
                      )}
                    </div>

                    {/* Color Validation Error Notice */}
                    {colorValidationError && (
                      <div className="mb-2.5 p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-700 flex items-center gap-2 animate-fadeIn">
                        <span>⚠️</span>
                        <span>{colorValidationError}</span>
                      </div>
                    )}

                    {/* Selectable Color Buttons */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {availableColors.map((col) => {
                        const isSelected = selectedColor?.toLowerCase() === col.name.toLowerCase();

                        // Check combination stock if size is also selected
                        let isCombinationOutOfStock = false;
                        if (selectedSize && sizeVariants.length > 0) {
                          const specificVariant = sizeVariants.find(
                            (v) =>
                              v.size.toLowerCase() === selectedSize.toLowerCase() &&
                              (v.color_name || v.colorName || '').toLowerCase() === col.name.toLowerCase()
                          );
                          if (specificVariant) {
                            const vStock = Number(specificVariant.stock_quantity ?? specificVariant.stock ?? 0);
                            if (vStock <= 0) isCombinationOutOfStock = true;
                          }
                        }

                        return (
                          <button
                            key={col.name}
                            type="button"
                            disabled={isCombinationOutOfStock}
                            onClick={() => handleSelectColor(col.name)}
                            className={`group relative flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                              isCombinationOutOfStock
                                ? 'bg-stone-100 text-stone-400 border-stone-200 cursor-not-allowed opacity-50 line-through'
                                : isSelected
                                ? 'border-[#965215] bg-[#FAF7F2] ring-2 ring-[#B47226]/50 shadow-xs scale-[1.02] text-[#7A3F0E] font-extrabold'
                                : 'border-stone-300 bg-white hover:border-[#965215]/60 hover:bg-stone-50 text-stone-800 shadow-2xs'
                            }`}
                            title={
                              isCombinationOutOfStock
                                ? `${col.name} is out of stock in size ${selectedSize}`
                                : `Select ${col.name} (View color preview)`
                            }
                          >
                            {/* Color Circle Swatch */}
                            <span
                              className="w-5 h-5 rounded-full border border-black/25 shadow-2xs flex items-center justify-center shrink-0 transition-transform group-hover:scale-110"
                              style={{ backgroundColor: col.hex }}
                            >
                              {isSelected && (
                                <Check
                                  size={12}
                                  className={['#ffffff', '#f8fafc', '#f5f5f0'].includes(col.hex.toLowerCase()) ? 'text-stone-900' : 'text-white'}
                                  strokeWidth={3}
                                />
                              )}
                            </span>
                            <span className="truncate">{col.name}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Helpful indicator */}
                    <div className="mt-2.5 pt-2 border-t border-stone-200/70 flex items-center justify-between text-[11px] text-stone-500">
                      {selectedColor ? (
                        <span className="text-emerald-700 font-semibold flex items-center gap-1">
                          <CheckCircle2 size={13} /> Photo preview updated for <strong>{selectedColor}</strong>
                        </span>
                      ) : (
                        <span className="text-amber-700 font-medium flex items-center gap-1">
                          <span>👉</span> Click any color above to preview and select
                        </span>
                      )}
                      <span className="text-stone-400 text-[10px]">Saved in database</span>
                    </div>
                  </div>
                )}

                {/* AVAILABLE SIZES (If apparel product with sizes) */}
                {hasSizes && (
                  <div className="mt-5 p-4 rounded-2xl bg-stone-50/80 border border-stone-200">
                    <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-amber-100 text-[#965215] flex items-center justify-center shrink-0">
                          <Ruler size={14} />
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black uppercase tracking-wider text-stone-900">
                            {isWholesale ? 'SELECT SIZE FOR WHOLESALE SETS:' : 'AVAILABLE SIZES'}
                          </span>
                          <span className="text-[10px] font-bold text-stone-600 bg-white px-2 py-0.5 rounded-full border border-stone-200">
                            {availableSizesList.length} Sizes
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Selected Size Badge */}
                        {selectedSize ? (
                          <span className="text-xs font-bold text-stone-900 bg-white px-2.5 py-1 rounded-lg border border-amber-300 shadow-2xs flex items-center gap-1">
                            <Check size={12} strokeWidth={3} className="text-emerald-600" />
                            <span>Size: <strong className="text-[#965215]">{selectedSize}</strong></span>
                          </span>
                        ) : (
                          <span className="text-[11px] font-extrabold text-amber-800 bg-amber-100/90 px-2.5 py-1 rounded-lg border border-amber-300 flex items-center gap-1 animate-pulse">
                            <span>□</span>
                            <span>Pick Size (Required)</span>
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => setIsSizeChartOpen(true)}
                          className="text-[11px] text-[#965215] hover:text-[#7A3F0E] font-bold flex items-center gap-1 cursor-pointer bg-white hover:bg-stone-50 px-2 py-1 rounded-lg border border-stone-300 transition-colors shadow-2xs"
                        >
                          <Ruler size={12} />
                          <span>Size Chart</span>
                        </button>
                      </div>
                    </div>

                    {/* Size Validation Notice if user attempted to add without selecting size */}
                    {sizeValidationError && (
                      <div className="mb-2.5 p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-700 flex items-center gap-2 animate-fadeIn">
                        <span>⚠️</span>
                        <span>{sizeValidationError}</span>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                      {availableSizesList.map((sz) => {
                        // Check variant stock, accounting for color if selected in retail
                        let variantStock = selectedProduct.stock;
                        const matchingVariants = sizeVariants.filter(
                          (v) => v.size.toLowerCase() === sz.toLowerCase()
                        );

                        if (matchingVariants.length > 0) {
                          if (selectedColor && !isWholesale) {
                            const exactColorMatch = matchingVariants.find(
                              (v) => (v.color_name || v.colorName || '').toLowerCase() === selectedColor.toLowerCase()
                            );
                            if (exactColorMatch) {
                              variantStock = Number(exactColorMatch.stock_quantity ?? exactColorMatch.stock ?? 0);
                            } else {
                              variantStock = Number(matchingVariants[0].stock_quantity ?? matchingVariants[0].stock ?? 0);
                            }
                          } else {
                            variantStock = Number(matchingVariants[0].stock_quantity ?? matchingVariants[0].stock ?? 0);
                          }
                        }

                        const isVariantOutOfStock = isWholesale
                          ? variantStock < setSize
                          : variantStock <= 0;
                        const isSelected = selectedSize === sz;

                        return (
                          <button
                            key={sz}
                            type="button"
                            disabled={isVariantOutOfStock}
                            onClick={() => {
                              if (isVariantOutOfStock) return;
                              setSelectedSize(sz);
                              setSizeValidationError(null);
                            }}
                            className={`min-w-14 h-11 px-3.5 rounded-xl text-xs font-bold border transition-all cursor-pointer relative flex flex-col items-center justify-center ${
                              isVariantOutOfStock
                                ? 'bg-stone-100 text-stone-400 border-stone-200 cursor-not-allowed line-through opacity-60'
                                : isSelected
                                ? 'bg-[#965215] text-white border-[#965215] shadow-xs scale-[1.02] ring-2 ring-[#B47226]/40 font-extrabold'
                                : 'bg-white text-stone-800 border-stone-300 hover:border-[#965215]/60 hover:bg-stone-50 shadow-2xs'
                            }`}
                            title={
                              isVariantOutOfStock
                                ? `${sz} is Out of Stock`
                                : `${sz} - ${variantStock} units available`
                            }
                          >
                            <span>{sz}</span>
                            {isVariantOutOfStock ? (
                              <span className="text-[8px] font-bold text-red-500 block leading-none mt-0.5">
                                Out of Stock
                              </span>
                            ) : variantStock <= 5 && !isWholesale ? (
                              <span className={`text-[8px] font-bold block leading-none mt-0.5 ${isSelected ? 'text-amber-200' : 'text-amber-700'}`}>
                                {variantStock} left
                              </span>
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Quantity Selector */}
                <div className="mt-5 flex flex-col gap-1.5">
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-stone-700">
                      {isWholesale ? 'Quantity (Sets):' : 'Quantity:'}
                    </span>
                    <div className="flex items-center border border-stone-300 rounded-xl bg-white overflow-hidden shadow-2xs">
                      <button
                        type="button"
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        disabled={quantity <= 1}
                        className="px-3 py-1.5 text-stone-600 hover:bg-stone-100 font-bold cursor-pointer disabled:opacity-30"
                      >
                        -
                      </button>
                      <span className="px-3.5 py-1.5 text-xs font-extrabold text-stone-900 min-w-10 text-center">
                        {quantity} {isWholesale ? (quantity === 1 ? 'Set' : 'Sets') : ''}
                      </span>
                      <button
                        type="button"
                        disabled={
                          isWholesale
                            ? (quantity + 1) * setSize > selectedProduct.stock
                            : quantity >= selectedProduct.stock
                        }
                        onClick={() => setQuantity((q) => q + 1)}
                        className="px-3 py-1.5 text-stone-600 hover:bg-stone-100 font-bold cursor-pointer disabled:opacity-30"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {isWholesale && (
                    <div className="flex items-center justify-between text-xs text-blue-900 bg-blue-50/70 p-2 rounded-lg border border-blue-200/60 mt-1">
                      <span>
                        Total Pieces: <strong>{quantity * setSize} pieces</strong> ({quantity} Set{quantity > 1 ? 's' : ''} &times; {setSize})
                      </span>
                      <span>
                        Total Price: <strong>₹{(wholesalePrice * quantity).toLocaleString('en-IN')}</strong>
                      </span>
                    </div>
                  )}
                </div>

                {/* Retail Selection Requirements Callout (Forced Color + Size) */}
                {!isWholesale && !isOutOfStock && (hasColors || hasSizes) && (
                  <div className="mt-5">
                    {isRetailSelectionIncomplete ? (
                      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 shadow-2xs">
                        <div className="flex items-center justify-between flex-wrap gap-2 mb-1.5">
                          <span className="text-xs font-black text-amber-950 flex items-center gap-1.5 uppercase tracking-wider">
                            <span>⚠️</span>
                            <span>Selection Required to Add to Cart</span>
                          </span>
                          <span className="text-[10px] font-black uppercase text-amber-900 bg-amber-100/90 px-2.5 py-0.5 rounded-full border border-amber-300">
                            Add to Cart Inactive
                          </span>
                        </div>
                        <p className="text-[11px] text-amber-900 font-medium mb-2.5">
                          Please pick both a Color and a Size before the Add to Cart button becomes active:
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                          {hasColors && (
                            <span
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border transition-all ${
                                selectedColor
                                  ? 'bg-emerald-100 text-emerald-900 border-emerald-300 shadow-2xs'
                                  : 'bg-amber-100 text-amber-950 border-amber-300 animate-pulse font-extrabold'
                              }`}
                            >
                              {selectedColor ? (
                                <>
                                  <Check size={12} strokeWidth={3} className="text-emerald-700" />
                                  <span>Color: <strong>{selectedColor}</strong></span>
                                </>
                              ) : (
                                <>
                                  <span>□</span>
                                  <span>Pick Color (Pending)</span>
                                </>
                              )}
                            </span>
                          )}

                          {hasSizes && (
                            <span
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border transition-all ${
                                selectedSize
                                  ? 'bg-emerald-100 text-emerald-900 border-emerald-300 shadow-2xs'
                                  : 'bg-amber-100 text-amber-950 border-amber-300 animate-pulse font-extrabold'
                              }`}
                            >
                              {selectedSize ? (
                                <>
                                  <Check size={12} strokeWidth={3} className="text-emerald-700" />
                                  <span>Size: <strong>{selectedSize}</strong></span>
                                </>
                              ) : (
                                <>
                                  <span>□</span>
                                  <span>Pick Size (Pending)</span>
                                </>
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs shadow-2xs animate-fadeIn">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                          <span className="text-emerald-950 font-bold">
                            Selection Complete: <strong className="text-[#965215]">{selectedColor}</strong> &bull; Size <strong className="text-[#965215]">{selectedSize}</strong>
                          </span>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-white px-2.5 py-1 rounded-full border border-emerald-200">
                          Add to Cart Active
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Main Action Buttons */}
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    disabled={!isAddToCartActive}
                    onClick={handleAddToCart}
                    className={`py-3.5 px-4 rounded-xl text-xs sm:text-sm font-black tracking-wider uppercase flex items-center justify-center gap-2 border-2 transition-all shadow-xs ${
                      !isAddToCartActive
                        ? 'bg-stone-100 text-stone-400 border-stone-300 cursor-not-allowed opacity-75 shadow-none'
                        : isWholesale
                        ? 'bg-blue-900 hover:bg-blue-950 text-white border-blue-900 hover:border-blue-950 cursor-pointer hover:shadow-lg active:scale-[0.98]'
                        : 'bg-[#965215] hover:bg-[#7A3F0E] text-white border-[#965215] hover:border-[#7A3F0E] cursor-pointer hover:shadow-lg active:scale-[0.98]'
                    }`}
                  >
                    <ShoppingBag size={18} className={!isAddToCartActive ? 'opacity-40' : 'opacity-100'} />
                    <span className="truncate">
                      {isOutOfStock
                        ? 'OUT OF STOCK'
                        : isWholesale
                        ? isWholesaleSelectionIncomplete
                          ? 'PICK SIZE TO ADD'
                          : `ADD ${quantity} SET${quantity > 1 ? 'S' : ''} TO CART`
                        : isRetailSelectionIncomplete
                        ? !selectedColor && !selectedSize
                          ? 'PICK COLOR & SIZE'
                          : !selectedColor
                          ? 'PICK A COLOR'
                          : 'PICK A SIZE'
                        : 'ADD TO CART'}
                    </span>
                  </button>

                  <button
                    type="button"
                    disabled={!isAddToCartActive}
                    onClick={handleBuyNow}
                    className={`py-3.5 px-4 rounded-xl text-xs sm:text-sm font-black tracking-wider uppercase flex items-center justify-center gap-2 text-white transition-all shadow-xs ${
                      !isAddToCartActive
                        ? 'bg-stone-200 text-stone-400 cursor-not-allowed opacity-60 shadow-none'
                        : isWholesale
                        ? 'bg-blue-950 hover:bg-black cursor-pointer hover:shadow-lg active:scale-[0.98]'
                        : 'bg-gradient-to-r from-[#B47226] to-[#965215] hover:from-[#965215] hover:to-[#7A3F0E] cursor-pointer hover:shadow-lg active:scale-[0.98]'
                    }`}
                  >
                    <Zap size={18} className={!isAddToCartActive ? 'opacity-40 fill-stone-400' : 'fill-white'} />
                    <span className="truncate">
                      {isOutOfStock
                        ? 'OUT OF STOCK'
                        : isWholesale
                        ? `BUY ${quantity} SET${quantity > 1 ? 'S' : ''} NOW`
                        : isRetailSelectionIncomplete
                        ? 'BUY NOW'
                        : 'BUY NOW'}
                    </span>
                  </button>
                </div>

                {/* WhatsApp Direct Product Enquiry */}
                <div className="mt-3">
                  <a
                    href={getWhatsAppProductUrl(selectedProduct)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 bg-[#25D366]/10 text-[#128C7E] hover:bg-[#25D366]/20 border border-[#25D366]/30 transition-all cursor-pointer"
                  >
                    <MessageCircle size={16} className="text-[#25D366] fill-[#25D366]/40" />
                    <span>Ask about this product on WhatsApp</span>
                  </a>
                </div>

                {/* Assurances */}
                <div className="mt-6 pt-4 border-t border-stone-100 grid grid-cols-3 gap-2 text-center text-[10px] text-stone-600">
                  <div className="flex flex-col items-center">
                    <Truck size={16} className="text-[#965215] mb-1" />
                    <span>Free Delivery &gt;₹499</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <RotateCcw size={16} className="text-[#965215] mb-1" />
                    <span>7 Days Replacement</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <ShieldCheck size={16} className="text-[#965215] mb-1" />
                    <span>100% Genuine</span>
                  </div>
                </div>

                {/* VC MART Official Verified Badge */}
                <div className="mt-4 p-3 rounded-xl bg-[#FAF7F2] border border-[#E8DEC8] flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <Logo size="sm" variant="image-only" />
                    <div>
                      <p className="text-xs font-bold text-stone-900">VC MART Official Guarantee</p>
                      <p className="text-[10px] text-stone-500">100% Quality Checked &bull; Genuine Indian Seller</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-[#965215] bg-white border border-[#E8DEC8] px-2 py-0.5 rounded-full shadow-2xs">
                    Verified
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Description & Key Features Tabs */}
          <div className="mt-10 pt-8 border-t border-stone-200">
            <h3 className="text-lg font-bold font-['Marcellus'] text-stone-900 mb-3">
              Product Overview & Specifications
            </h3>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed max-w-3xl">
              {selectedProduct.description}
            </p>

            {/* Key Features Bullets */}
            {selectedProduct.features && selectedProduct.features.length > 0 && (
              <div className="mt-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-800 mb-2">
                  Key Highlights:
                </h4>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-stone-700">
                  {selectedProduct.features.map((feat: string, idx: number) => (
                    <li key={idx} className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Related Products from Same Division */}
          {relatedProducts.length > 0 && (
            <div className="mt-10 pt-8 border-t border-stone-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base sm:text-lg font-bold font-['Marcellus'] text-stone-900">
                  You Might Also Like from {shop?.name}
                </h3>
                <button
                  onClick={handleViewShop}
                  className="text-xs font-bold text-[#965215] hover:underline"
                >
                  View More &rarr;
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                {relatedProducts.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Optional Size Chart Modal */}
      <SizeChartModal
        isOpen={isSizeChartOpen}
        onClose={() => setIsSizeChartOpen(false)}
        productName={selectedProduct.name}
        categoryName={selectedProduct.categoryName}
        sizeChart={selectedProduct.size_chart || selectedProduct.sizeChart}
        availableSizes={availableSizesList}
      />
    </div>
  );
};
