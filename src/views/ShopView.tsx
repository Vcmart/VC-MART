import React, { useState } from 'react';
import { Filter, SlidersHorizontal, ArrowUpDown, X, Sparkles, ChevronRight, PackageX, Phone, MessageCircle } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { FilterSidebar } from '../components/FilterSidebar';
import { ProductCard } from '../components/ProductCard';
import { Logo } from '../components/Logo';

export const ShopView: React.FC = () => {
  const {
    filteredProducts,
    filters,
    setFilters,
    resetFilters,
    searchQuery,
    setSearchQuery,
    shops,
    activeShop,
    shoppingMode,
    setCurrentView,
  } = useStore();

  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(12);

  // Active filter label
  const getPageHeading = () => {
    if (searchQuery.trim()) {
      return `Search results for: "${searchQuery}"`;
    }
    if (activeShop) {
      return activeShop.name;
    }
    return 'All Marketplace Products';
  };

  const getPageSubtitle = () => {
    if (searchQuery.trim()) {
      return `Found ${filteredProducts.length} items matching your search query.`;
    }
    if (activeShop) {
      return activeShop.description;
    }
    return 'Browse handpicked quality products from Vinayak Collection, Kinshuk Spare Parts, and Khushi Communication in one unified catalog.';
  };

  const visibleProducts = filteredProducts.slice(0, visibleCount);
  const hasMore = visibleCount < filteredProducts.length;

  return (
    <div className="bg-[#FAF7F2] min-h-screen py-6 sm:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-4 rounded-xl border border-[#E8DEC8] bg-white px-4 py-3 text-xs text-stone-700">
          {shoppingMode === 'wholesale' ? <><strong className="text-blue-900">Wholesale Mode</strong> · Prices shown are Wholesale per Set · Minimum purchase: 1 Complete Set · Wholesale Delivery: ₹250 per Complete Set</> : <><strong className="text-[#7A3F0E]">Retail Mode</strong> · FREE DELIVERY on retail orders</>}
        </div>
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-1.5 text-xs text-stone-500 mb-4">
          <button
            onClick={() => setCurrentView('home')}
            className="hover:text-[#965215] cursor-pointer"
          >
            Home
          </button>
          <ChevronRight size={12} />
          <span className="font-semibold text-stone-800">
            {activeShop ? activeShop.name : 'Catalog'}
          </span>
        </nav>

        {/* Dynamic Shop Banner (if specific shop selected) */}
        {activeShop && (
          <div className="mb-6 rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-[#2A1810] to-[#4A2612] text-white shadow-md relative overflow-hidden">
            <div className="relative z-10 max-w-2xl">
              <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-full bg-[#B47226]/30 text-[#DFB062] border border-[#B47226]/50">
                Official Business Division
              </span>
              <h1 className="text-2xl sm:text-3xl font-['Marcellus'] font-bold text-amber-50 mt-2">
                {activeShop.name}
              </h1>
              <p className="text-xs sm:text-sm text-stone-300 mt-2 leading-relaxed">
                {activeShop.description}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-[#DFB062]">
                <a
                  href={`tel:${activeShop.phone.replace(/[^0-9+]/g, '')}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white font-medium border border-white/20 transition-colors"
                >
                  <Phone size={12} className="text-[#DFB062]" />
                  <span>Call: {activeShop.phone}</span>
                </a>
                <a
                  href={`https://wa.me/${(activeShop.whatsapp || activeShop.phone).replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-medium border border-emerald-500/30 transition-colors"
                >
                  <MessageCircle size={12} className="text-emerald-400" />
                  <span>Shop WhatsApp</span>
                </a>
                <span className="hidden sm:inline text-white/40">&bull;</span>
                <span className="text-stone-300">{activeShop.categoryName}</span>
              </div>
            </div>
            <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-20 hidden md:block overflow-hidden">
              <img
                src={activeShop.bannerImage}
                alt={activeShop.name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}

        {/* Page Top Bar */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E8DEC8] shadow-xs mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Logo size="sm" variant="image-only" />
              <div>
                <h1 className="text-xl sm:text-2xl font-['Marcellus'] font-bold text-stone-900">
                  {getPageHeading()}
                </h1>
                <p className="text-xs text-stone-500 mt-0.5">{getPageSubtitle()}</p>
              </div>
            </div>

            {/* Controls: Mobile Filter Button & Sorting Selector */}
            <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
              {/* Mobile Filter Trigger */}
              <button
                type="button"
                onClick={() => setIsMobileFilterOpen(true)}
                className="md:hidden px-3.5 py-2 rounded-xl bg-[#FAF7F2] border border-[#D8C7B5] text-xs font-bold text-stone-800 flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <SlidersHorizontal size={14} className="text-[#965215]" />
                <span>Filters</span>
              </button>

              {/* Sort By Dropdown */}
              <div className="flex items-center gap-1.5 bg-[#FAF7F2] border border-[#D8C7B5] rounded-xl px-3 py-1.5 shadow-2xs">
                <ArrowUpDown size={14} className="text-[#965215] shrink-0" />
                <span className="text-xs font-bold text-stone-700 hidden sm:inline">Sort:</span>
                <select
                  value={filters.sortBy}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      sortBy: e.target.value as any,
                    }))
                  }
                  className="text-xs font-semibold bg-transparent text-stone-800 focus:outline-none cursor-pointer"
                >
                  <option value="popular">Most Popular</option>
                  <option value="newest">Newest First</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="discount">Highest Discount</option>
                  <option value="rating">Customer Rating</option>
                </select>
              </div>
            </div>
          </div>

          {/* Active Filter Chips */}
          {(filters.shopId !== 'all' ||
            filters.brand ||
            filters.inStockOnly ||
            filters.discountMin ||
            searchQuery.trim()) && (
            <div className="mt-3 pt-3 border-t border-stone-100 flex flex-wrap items-center gap-2">
              <span className="text-[11px] text-stone-400 font-semibold">Active:</span>

              {filters.shopId !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-[#7A3F0E] text-[11px] font-semibold border border-amber-200">
                  Shop: {activeShop?.name}
                  <button
                    onClick={() => setFilters((p) => ({ ...p, shopId: 'all' }))}
                    className="hover:text-red-700 cursor-pointer"
                  >
                    <X size={12} />
                  </button>
                </span>
              )}

              {searchQuery.trim() && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-800 text-[11px] font-semibold border border-stone-300">
                  &ldquo;{searchQuery}&rdquo;
                  <button
                    onClick={() => setSearchQuery('')}
                    className="hover:text-red-700 cursor-pointer"
                  >
                    <X size={12} />
                  </button>
                </span>
              )}

              {filters.inStockOnly && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-semibold">
                  In Stock
                  <button
                    onClick={() => setFilters((p) => ({ ...p, inStockOnly: false }))}
                    className="hover:text-red-700 cursor-pointer"
                  >
                    <X size={12} />
                  </button>
                </span>
              )}

              {filters.discountMin && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 text-[11px] font-semibold">
                  Min {filters.discountMin}% OFF
                  <button
                    onClick={() => setFilters((p) => ({ ...p, discountMin: undefined }))}
                    className="hover:text-red-700 cursor-pointer"
                  >
                    <X size={12} />
                  </button>
                </span>
              )}

              <button
                onClick={resetFilters}
                className="text-[11px] font-bold text-[#965215] hover:underline ml-auto cursor-pointer"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>

        {/* Layout: Sidebar + Product Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8">
          {/* Desktop Left Sidebar */}
          <div className="hidden md:block md:col-span-4 lg:col-span-3">
            <div className="sticky top-28 bg-white p-5 rounded-2xl border border-[#E8DEC8] shadow-xs">
              <FilterSidebar />
            </div>
          </div>

          {/* Product Grid Area */}
          <div className="md:col-span-8 lg:col-span-9">
            {filteredProducts.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-[#E8DEC8] shadow-xs">
                <div className="w-16 h-16 rounded-full bg-amber-50 text-[#965215] flex items-center justify-center mx-auto mb-4">
                  <PackageX size={32} />
                </div>
                <h3 className="text-lg font-bold text-stone-900 font-['Marcellus']">
                  No matching products found
                </h3>
                <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                  We couldn&apos;t find any products matching your current combination of filters or search keywords.
                </p>
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="px-6 py-2.5 bg-[#965215] text-white rounded-full text-xs font-bold tracking-wider uppercase hover:bg-[#7A3F0E] transition-colors cursor-pointer"
                  >
                    RESET ALL FILTERS
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
                  {visibleProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {/* Pagination / Load More */}
                {hasMore && (
                  <div className="mt-10 text-center">
                    <button
                      type="button"
                      onClick={() => setVisibleCount((prev) => prev + 12)}
                      className="px-8 py-3 bg-white hover:bg-[#FAF7F2] text-[#7A3F0E] border-2 border-[#D8C7B5] hover:border-[#965215] rounded-full text-xs font-bold tracking-wider uppercase shadow-xs transition-all cursor-pointer"
                    >
                      LOAD MORE PRODUCTS ({filteredProducts.length - visibleCount} REMAINING)
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filters Drawer */}
      {isMobileFilterOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end">
          <div className="w-4/5 max-w-sm bg-white h-full overflow-y-auto p-5 shadow-2xl flex flex-col justify-between">
            <FilterSidebar onCloseMobile={() => setIsMobileFilterOpen(false)} />
            <div className="pt-6 border-t border-stone-200 mt-6">
              <button
                type="button"
                onClick={() => setIsMobileFilterOpen(false)}
                className="w-full py-3 bg-[#965215] text-white text-xs font-bold rounded-xl uppercase tracking-wider cursor-pointer"
              >
                APPLY FILTERS ({filteredProducts.length} PRODUCTS)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
