import React, { useState } from 'react';
import { Sparkles, ArrowRight, Flame } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { ProductCard } from './ProductCard';
import { ShopId } from '../types';

export const TrendingProducts: React.FC = () => {
  const { products, setCurrentView, setActiveShopId } = useStore();
  const [selectedShopFilter, setSelectedShopFilter] = useState<ShopId | 'all'>('all');

  // Filter trending products dynamically (either marked bestSeller or high rating/reviews)
  const trendingList = products
    .filter((p) => p.status === 'active')
    .filter((p) => selectedShopFilter === 'all' || p.shopId === selectedShopFilter)
    .sort((a, b) => b.reviewsCount * b.rating - a.reviewsCount * a.rating)
    .slice(0, 8);

  const handleViewAllTrending = () => {
    setActiveShopId(selectedShopFilter);
    setCurrentView('shop');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <section id="trending-products" className="py-10 sm:py-14 bg-[#FAF7F2] border-b border-[#E8DEC8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header with Filter Tabs */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 text-[11px] font-bold uppercase tracking-wider mb-2">
              <Flame size={13} className="text-red-600 fill-red-500" />
              <span>Customer Favorites</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-['Marcellus'] font-bold text-[#2A1810]">
              Trending Products
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 mt-1">
              Handpicked top-sellers across fashion, bike spares, and mobile accessories.
            </p>
          </div>

          {/* Shop Quick Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full scrollbar-none">
            <button
              type="button"
              onClick={() => setSelectedShopFilter('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors shrink-0 cursor-pointer ${
                selectedShopFilter === 'all'
                  ? 'bg-[#965215] text-white shadow-xs'
                  : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
              }`}
            >
              All Shops
            </button>
            <button
              type="button"
              onClick={() => setSelectedShopFilter('vinayak-collection')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors shrink-0 cursor-pointer ${
                selectedShopFilter === 'vinayak-collection'
                  ? 'bg-amber-800 text-white shadow-xs'
                  : 'bg-white text-amber-900 hover:bg-amber-50 border border-amber-200'
              }`}
            >
              Vinayak (Fashion)
            </button>
            <button
              type="button"
              onClick={() => setSelectedShopFilter('kinshuk-spare-parts')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors shrink-0 cursor-pointer ${
                selectedShopFilter === 'kinshuk-spare-parts'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-800 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              Kinshuk (Bike)
            </button>
            <button
              type="button"
              onClick={() => setSelectedShopFilter('khushi-communication')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors shrink-0 cursor-pointer ${
                selectedShopFilter === 'khushi-communication'
                  ? 'bg-sky-800 text-white shadow-xs'
                  : 'bg-white text-sky-900 hover:bg-sky-50 border border-sky-200'
              }`}
            >
              Khushi (Mobile)
            </button>
          </div>
        </div>

        {/* Responsive Grid: 4 per row desktop, 3 per row tablet, 2 per row mobile */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-6">
          {trendingList.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {/* View All Button */}
        <div className="mt-8 sm:mt-10 text-center">
          <button
            type="button"
            onClick={handleViewAllTrending}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white hover:bg-[#FAF7F2] text-[#7A3F0E] font-bold text-xs sm:text-sm border-2 border-[#D8C7B5] hover:border-[#965215] shadow-xs transition-all cursor-pointer"
          >
            <span>VIEW ALL TRENDING PRODUCTS</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </section>
  );
};
