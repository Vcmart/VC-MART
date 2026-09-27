import React from 'react';
import { ArrowRight, Shirt, Wrench, Smartphone, Check, Sparkles, Phone, MessageCircle } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { ShopId } from '../types';

export const ShopSpecificSections: React.FC = () => {
  const { setCurrentView, setActiveShopId, setFilters } = useStore();

  const handleCategoryFilter = (shopId: ShopId, categoryName: string) => {
    setActiveShopId(shopId);
    setFilters((prev) => ({
      ...prev,
      shopId,
      searchQuery: categoryName,
    }));
    setCurrentView('shop');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleShopExplore = (shopId: ShopId) => {
    setActiveShopId(shopId);
    setFilters((prev) => ({
      ...prev,
      shopId,
      searchQuery: undefined,
    }));
    setCurrentView('shop');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <section id="shop-specific-sections" className="py-10 sm:py-16 space-y-12 sm:space-y-16 bg-[#FAF7F2]">
      {/* 1. VINAYAK COLLECTION SECTION */}
      <div id="section-vinayak-collection" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-[#FFFDF9] via-[#FAF5EE] to-[#F5ECE0] rounded-3xl p-6 sm:p-10 border-2 border-amber-200 shadow-sm overflow-hidden relative">
          {/* Subtle background graphic */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-amber-200/20 rounded-full blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-[#7A3F0E] text-xs font-bold uppercase tracking-wider mb-3">
                <Shirt size={14} className="text-[#965215]" />
                <span>VINAYAK COLLECTION</span>
              </div>
              <h3 className="text-2xl sm:text-3xl md:text-4xl font-['Marcellus'] font-bold text-[#2A1810]">
                Upgrade Your Style
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 mt-2 max-w-xl">
                From hand-loomed festive kurtas and silk dupattas to comfortable casual shirts, joggers, and street denim.
              </p>

              {/* Vinayak Categories Pills */}
              <div className="mt-6 flex flex-wrap gap-2">
                {[
                  'Shirts',
                  'T-Shirts',
                  'Jeans',
                  "Women's Wear",
                  'Kurtis',
                  'Suits',
                  'Tops',
                  'Lowers',
                  'Cordsets',
                ].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleCategoryFilter('vinayak-collection', cat)}
                    className="px-3.5 py-1.5 bg-white hover:bg-amber-100/70 border border-amber-300/80 rounded-full text-xs font-semibold text-[#5C2D16] transition-all hover:scale-105 cursor-pointer shadow-2xs"
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleShopExplore('vinayak-collection')}
                  className="px-6 py-3 bg-[#965215] hover:bg-[#7A3F0E] text-white rounded-full text-xs sm:text-sm font-bold tracking-wider uppercase transition-all shadow-md inline-flex items-center gap-2 cursor-pointer"
                >
                  <span>EXPLORE FASHION</span>
                  <ArrowRight size={16} />
                </button>
                <a
                  href="tel:+918684933759"
                  className="px-4 py-2.5 rounded-full bg-white hover:bg-amber-50 border border-amber-300 text-[#7A3F0E] text-xs font-semibold inline-flex items-center gap-1.5 transition-all shadow-2xs"
                >
                  <Phone size={13} className="text-[#965215]" />
                  <span>Call: 8684933759</span>
                </a>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="relative rounded-2xl overflow-hidden shadow-lg aspect-[16/10] sm:aspect-[4/3]">
                <img
                  src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=800&auto=format&fit=crop"
                  alt="Vinayak Fashion Upgrade"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-4">
                  <span className="text-xs font-bold text-amber-200">Premium Men & Women Indian Fashion</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. KINSHUK SPARE PARTS SECTION */}
      <div id="section-kinshuk-spare-parts" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-[#F8FAFC] via-[#F1F5F9] to-[#E2E8F0] rounded-3xl p-6 sm:p-10 border-2 border-slate-300 shadow-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 w-80 h-80 bg-slate-300/20 rounded-full blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-200 text-slate-800 text-xs font-bold uppercase tracking-wider mb-3">
                <Wrench size={14} className="text-slate-700" />
                <span>KINSHUK SPARE PARTS</span>
              </div>
              <h3 className="text-2xl sm:text-3xl md:text-4xl font-['Marcellus'] font-bold text-slate-900">
                Upgrade Your Ride
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-xl">
                Heavy-duty motorcycle accessories, anti-vibration mobile mounts, high-power LED fog projectors, and genuine spares.
              </p>

              {/* Kinshuk Categories Pills */}
              <div className="mt-6 flex flex-wrap gap-2">
                {[
                  'Bike Accessories',
                  'Lights',
                  'Indicators',
                  'Mirrors',
                  'Mobile Holders',
                  'Horns',
                  'Styling Accessories',
                  'Safety Accessories',
                ].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleCategoryFilter('kinshuk-spare-parts', cat)}
                    className="px-3.5 py-1.5 bg-white hover:bg-slate-200 border border-slate-300 rounded-full text-xs font-semibold text-slate-800 transition-all hover:scale-105 cursor-pointer shadow-2xs"
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleShopExplore('kinshuk-spare-parts')}
                  className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-full text-xs sm:text-sm font-bold tracking-wider uppercase transition-all shadow-md inline-flex items-center gap-2 cursor-pointer"
                >
                  <span>EXPLORE BIKE ACCESSORIES</span>
                  <ArrowRight size={16} />
                </button>
                <a
                  href="tel:+918295403529"
                  className="px-4 py-2.5 rounded-full bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 text-xs font-semibold inline-flex items-center gap-1.5 transition-all shadow-2xs"
                >
                  <Phone size={13} className="text-slate-700" />
                  <span>Call: 8295403529</span>
                </a>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="relative rounded-2xl overflow-hidden shadow-lg aspect-[16/10] sm:aspect-[4/3]">
                <img
                  src="https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=800&auto=format&fit=crop"
                  alt="Kinshuk Bike Accessories"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-4">
                  <span className="text-xs font-bold text-slate-200">High Reliability Two-Wheeler Gear</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. KHUSHI COMMUNICATION SECTION */}
      <div id="section-khushi-communication" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-[#F0F9FF] via-[#E0F2FE] to-[#BAE6FD]/40 rounded-3xl p-6 sm:p-10 border-2 border-sky-300 shadow-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 w-80 h-80 bg-sky-200/30 rounded-full blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-100 text-sky-900 text-xs font-bold uppercase tracking-wider mb-3">
                <Smartphone size={14} className="text-sky-700" />
                <span>KHUSHI COMMUNICATION</span>
              </div>
              <h3 className="text-2xl sm:text-3xl md:text-4xl font-['Marcellus'] font-bold text-[#0C4A6E]">
                Power Your Digital Life
              </h3>
              <p className="text-xs sm:text-sm text-sky-900/80 mt-2 max-w-xl">
                Certified high-speed GaN adapters, durable braided charging cables, noise-cancelling wireless audio, and unbreakable screen guards.
              </p>

              {/* Khushi Categories Pills */}
              <div className="mt-6 flex flex-wrap gap-2">
                {[
                  'Mobile Phones',
                  'Chargers',
                  'Cables',
                  'Earphones',
                  'Headphones',
                  'Mobile Covers',
                  'Power Banks',
                  'Screen Protectors',
                ].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleCategoryFilter('khushi-communication', cat)}
                    className="px-3.5 py-1.5 bg-white hover:bg-sky-100 border border-sky-300 rounded-full text-xs font-semibold text-sky-900 transition-all hover:scale-105 cursor-pointer shadow-2xs"
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleShopExplore('khushi-communication')}
                  className="px-6 py-3 bg-[#0284C7] hover:bg-[#0369A1] text-white rounded-full text-xs sm:text-sm font-bold tracking-wider uppercase transition-all shadow-md inline-flex items-center gap-2 cursor-pointer"
                >
                  <span>EXPLORE MOBILE ACCESSORIES</span>
                  <ArrowRight size={16} />
                </button>
                <a
                  href="tel:+918396831521"
                  className="px-4 py-2.5 rounded-full bg-white hover:bg-sky-50 border border-sky-300 text-sky-900 text-xs font-semibold inline-flex items-center gap-1.5 transition-all shadow-2xs"
                >
                  <Phone size={13} className="text-[#0284C7]" />
                  <span>Call: 8396831521</span>
                </a>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="relative rounded-2xl overflow-hidden shadow-lg aspect-[16/10] sm:aspect-[4/3]">
                <img
                  src="https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=800&auto=format&fit=crop"
                  alt="Khushi Communication Tech"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-4">
                  <span className="text-xs font-bold text-sky-200">Certified Smart Gadgets & Audio</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
