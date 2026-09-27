import React from 'react';
import { Filter, X, RotateCcw, Check, Star } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { ShopId } from '../types';

interface FilterSidebarProps {
  onCloseMobile?: () => void;
}

export const FilterSidebar: React.FC<FilterSidebarProps> = ({ onCloseMobile }) => {
  const { filters, setFilters, resetFilters, shops, products } = useStore();

  // Extract unique brands for currently chosen shop or all
  const availableBrands = Array.from(
    new Set(
      products
        .filter((p) => filters.shopId === 'all' || p.shopId === filters.shopId)
        .map((p) => p.brand)
    )
  ).filter(Boolean);

  // Extract subcategories for current shop or all
  const availableSubcategories = Array.from(
    new Set(
      products
        .filter((p) => filters.shopId === 'all' || p.shopId === filters.shopId)
        .map((p) => p.categoryName)
    )
  );

  const handleShopChange = (shopId: ShopId | 'all') => {
    setFilters((prev) => ({
      ...prev,
      shopId,
      subcategoryId: undefined,
      categoryId: undefined,
      brand: undefined,
    }));
  };

  return (
    <aside className="w-full space-y-6 text-[#2A1810]">
      {/* Header & Reset */}
      <div className="flex items-center justify-between pb-3 border-b border-[#E8DEC8]">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-[#965215]" />
          <h3 className="font-bold text-sm uppercase tracking-wider text-stone-900">Filters</h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={resetFilters}
            className="text-[11px] font-bold text-[#965215] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw size={11} />
            <span>Reset</span>
          </button>
          {onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="md:hidden p-1 text-stone-500 hover:text-stone-900"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* 1. Shop Filter */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 mb-2.5">
          Select Shop / Division
        </h4>
        <div className="space-y-1.5">
          <button
            type="button"
            onClick={() => handleShopChange('all')}
            className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
              filters.shopId === 'all'
                ? 'bg-[#965215] text-white shadow-xs'
                : 'bg-white text-stone-700 hover:bg-[#FAF7F2] border border-[#E8DEC8]'
            }`}
          >
            <span>All Shops (Combined)</span>
            {filters.shopId === 'all' && <Check size={14} />}
          </button>

          {shops.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => handleShopChange(s.id)}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                filters.shopId === s.id
                  ? 'bg-[#965215] text-white shadow-xs'
                  : 'bg-white text-stone-700 hover:bg-[#FAF7F2] border border-[#E8DEC8]'
              }`}
            >
              <div className="truncate pr-1">
                <span className="block font-bold">{s.name}</span>
                <span className="text-[10px] opacity-80 block">{s.categoryName}</span>
              </div>
              {filters.shopId === s.id && <Check size={14} className="shrink-0" />}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Price Range */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700">Price Range</h4>
          <span className="text-xs font-bold text-[#7A3F0E]">Up to ₹{filters.maxPrice}</span>
        </div>
        <input
          type="range"
          min={100}
          max={5000}
          step={50}
          value={filters.maxPrice}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, maxPrice: Number(e.target.value) }))
          }
          className="w-full accent-[#965215] cursor-pointer"
        />
        <div className="flex items-center justify-between text-[10px] text-stone-500 mt-1">
          <span>₹100</span>
          <span>₹2,500</span>
          <span>₹5,000+</span>
        </div>
      </div>

      {/* 3. Availability */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 mb-2">
          Availability
        </h4>
        <label className="flex items-center gap-2 text-xs font-medium text-stone-700 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={filters.inStockOnly}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, inStockOnly: e.target.checked }))
            }
            className="rounded border-stone-300 text-[#965215] focus:ring-[#965215] accent-[#965215] w-4 h-4 cursor-pointer"
          />
          <span>In Stock Products Only</span>
        </label>
      </div>

      {/* 4. Minimum Discount */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 mb-2">
          Discount
        </h4>
        <div className="space-y-1">
          {[
            { label: 'All Discounts', min: 0 },
            { label: '20% OFF or more', min: 20 },
            { label: '40% OFF or more', min: 40 },
            { label: '50% OFF or more (Mega Deals)', min: 50 },
          ].map((d) => (
            <label
              key={d.min}
              className="flex items-center gap-2 text-xs text-stone-700 cursor-pointer select-none"
            >
              <input
                type="radio"
                name="discount-filter"
                checked={filters.discountMin === d.min || (!filters.discountMin && d.min === 0)}
                onChange={() => setFilters((prev) => ({ ...prev, discountMin: d.min }))}
                className="accent-[#965215]"
              />
              <span>{d.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* 5. Customer Rating */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 mb-2">
          Customer Rating
        </h4>
        <div className="space-y-1">
          {[
            { label: '4★ & Above', min: 4.0 },
            { label: '4.5★ & Above', min: 4.5 },
            { label: 'All Ratings', min: 0 },
          ].map((r) => (
            <label
              key={r.min}
              className="flex items-center gap-2 text-xs text-stone-700 cursor-pointer select-none"
            >
              <input
                type="radio"
                name="rating-filter"
                checked={filters.rating === r.min || (!filters.rating && r.min === 0)}
                onChange={() => setFilters((prev) => ({ ...prev, rating: r.min || undefined }))}
                className="accent-[#965215]"
              />
              <span className="flex items-center gap-1">
                {r.min > 0 && <Star size={11} className="fill-amber-500 text-amber-500" />}
                {r.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* 6. Brand Filter (if available) */}
      {availableBrands.length > 1 && (
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 mb-2">
            Brand
          </h4>
          <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
            <label className="flex items-center gap-2 text-xs text-stone-700 cursor-pointer">
              <input
                type="radio"
                name="brand-filter"
                checked={!filters.brand}
                onChange={() => setFilters((prev) => ({ ...prev, brand: undefined }))}
                className="accent-[#965215]"
              />
              <span>All Brands</span>
            </label>
            {availableBrands.map((brand) => (
              <label
                key={brand}
                className="flex items-center gap-2 text-xs text-stone-700 cursor-pointer"
              >
                <input
                  type="radio"
                  name="brand-filter"
                  checked={filters.brand === brand}
                  onChange={() => setFilters((prev) => ({ ...prev, brand }))}
                  className="accent-[#965215]"
                />
                <span className="truncate">{brand}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
};
