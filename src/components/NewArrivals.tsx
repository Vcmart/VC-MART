import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { ProductCard } from './ProductCard';

export const NewArrivals: React.FC = () => {
  const { products, setCurrentView, setFilters } = useStore();

  // Products marked isNew or created recently
  const newProducts = products
    .filter((p) => p.status === 'active' && p.isNew)
    .slice(0, 4);

  const handleViewAllNew = () => {
    setFilters((prev) => ({ ...prev, shopId: 'all', sortBy: 'newest' }));
    setCurrentView('shop');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <section id="new-arrivals" className="py-10 sm:py-14 bg-white border-b border-[#E8DEC8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold uppercase tracking-wider mb-2">
              <Sparkles size={13} className="text-emerald-600" />
              <span>Fresh Inventory</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-['Marcellus'] font-bold text-[#2A1810]">
              New Arrivals
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 mt-1">
              Latest festive fashion, updated bike performance gears, and newest tech accessories.
            </p>
          </div>

          <button
            type="button"
            onClick={handleViewAllNew}
            className="text-xs font-bold text-[#965215] hover:text-[#7A3F0E] inline-flex items-center gap-1 cursor-pointer group shrink-0"
          >
            <span>View All New Additions</span>
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-6">
          {newProducts.map((product) => (
            <ProductCard key={product.id} product={product} badgeText="NEW" />
          ))}
        </div>
      </div>
    </section>
  );
};
