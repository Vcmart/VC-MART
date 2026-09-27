import React, { useEffect, useState } from 'react';
import { ArrowRight, Sparkles, Shirt, Wrench, Smartphone } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { initialShops } from '../config/siteConfig';
import { isFirebaseConfigured } from '../lib/firebase';
import { watchHomepageShopImages, type HomepageShopImages } from '../lib/firebaseRepository';

export const ShopCategoryCards: React.FC = () => {
  const { setCurrentView, setActiveShopId, shops } = useStore();
  const [homepageImages, setHomepageImages] = useState<HomepageShopImages>({});

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    return watchHomepageShopImages(setHomepageImages, (error) => console.error('Homepage images listener failed:', error));
  }, []);

  const bannerFor = (shopId: string) => homepageImages[shopId] || initialShops.find((shop) => shop.id === shopId)?.bannerImage || '';
  const restoreDefault = (shopId: string, image: HTMLImageElement) => {
    const fallback = initialShops.find((shop) => shop.id === shopId)?.bannerImage;
    if (fallback && image.src !== fallback) image.src = fallback;
  };

  const handleShopSelect = (shopId: string) => {
    setActiveShopId(shopId);
    setCurrentView('shop');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <section id="shop-by-category" className="py-10 sm:py-14 bg-white border-b border-[#E8DEC8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12">
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#965215] bg-[#FAF7F2] border border-[#E8DEC8] px-3 py-1 rounded-full">
            Our 3 Flagship Divisions
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-['Marcellus'] font-bold text-[#2A1810] mt-2">
            Shop By Category
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 mt-2">
            Explore dedicated shopping experiences tailored for each business division under one seamless checkout.
          </p>
        </div>

        {/* 3 Large Category Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {/* CARD 1: VINAYAK COLLECTION */}
          <div
            id="category-card-vinayak"
            onClick={() => handleShopSelect('vinayak-collection')}
            className="group relative bg-[#FAF7F2] rounded-3xl overflow-hidden border-2 border-amber-200/80 hover:border-[#965215] shadow-sm hover:shadow-2xl transition-all duration-400 flex flex-col cursor-pointer transform hover:-translate-y-1"
          >
            {/* Image Banner */}
            <div className="relative aspect-[16/10] overflow-hidden bg-amber-100">
              <img
                src={bannerFor('vinayak-collection')}
                onError={(event) => restoreDefault('vinayak-collection', event.currentTarget)}
                alt="Vinayak Collection Fashion"
                className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-600"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#2A1810]/70 via-transparent to-transparent" />
              <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-xs px-3 py-1 rounded-full text-xs font-bold text-[#7A3F0E] shadow-xs flex items-center gap-1.5">
                <Shirt size={14} className="text-[#965215]" />
                <span>Clothing & Fashion</span>
              </div>
            </div>

            {/* Card Content */}
            <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-['Marcellus'] font-bold text-[#2A1810] group-hover:text-[#965215] transition-colors">
                  VINAYAK COLLECTION
                </h3>
                <p className="text-xs font-semibold text-[#8B4513] mt-1">
                  Fashion & Clothing
                </p>
                <p className="text-xs text-stone-600 mt-2.5 leading-relaxed">
                  Men&apos;s shirts, premium jeans, oversize T-shirts, joggers, cordsets, kurti sets, suits, tops, and festive ethnic wear.
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-amber-200/60 flex items-center justify-between">
                <span className="text-xs font-bold text-[#7A3F0E]">Explore 200+ Styles</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleShopSelect('vinayak-collection');
                  }}
                  className="px-4 py-2 bg-[#965215] group-hover:bg-[#7A3F0E] text-white rounded-xl text-xs font-bold tracking-wider uppercase transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <span>SHOP FASHION</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* CARD 2: KINSHUK SPARE PARTS */}
          <div
            id="category-card-kinshuk"
            onClick={() => handleShopSelect('kinshuk-spare-parts')}
            className="group relative bg-[#F8FAFC] rounded-3xl overflow-hidden border-2 border-slate-300 hover:border-slate-800 shadow-sm hover:shadow-2xl transition-all duration-400 flex flex-col cursor-pointer transform hover:-translate-y-1"
          >
            {/* Image Banner */}
            <div className="relative aspect-[16/10] overflow-hidden bg-slate-200">
              <img
                src={bannerFor('kinshuk-spare-parts')}
                onError={(event) => restoreDefault('kinshuk-spare-parts', event.currentTarget)}
                alt="Kinshuk Bike Spare Parts"
                className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-600"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A]/75 via-transparent to-transparent" />
              <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-xs px-3 py-1 rounded-full text-xs font-bold text-slate-800 shadow-xs flex items-center gap-1.5">
                <Wrench size={14} className="text-slate-700" />
                <span>Bike Spare Parts & Accessories</span>
              </div>
            </div>

            {/* Card Content */}
            <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-['Marcellus'] font-bold text-slate-900 group-hover:text-slate-700 transition-colors">
                  KINSHUK SPARE PARTS
                </h3>
                <p className="text-xs font-semibold text-slate-700 mt-1">
                  Bike Spare Parts & Accessories
                </p>
                <p className="text-xs text-stone-600 mt-2.5 leading-relaxed">
                  Motorcycle spare parts, auxiliary LED fog lights, indicators, blue-tint mirrors, horns, mobile holders, seat covers, and styling accessories.
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-200 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">100% Genuine Spares</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleShopSelect('kinshuk-spare-parts');
                  }}
                  className="px-4 py-2 bg-slate-900 group-hover:bg-slate-800 text-white rounded-xl text-xs font-bold tracking-wider uppercase transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <span>SHOP BIKE ACCESSORIES</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* CARD 3: KHUSHI COMMUNICATION */}
          <div
            id="category-card-khushi"
            onClick={() => handleShopSelect('khushi-communication')}
            className="group relative bg-[#F0F9FF] rounded-3xl overflow-hidden border-2 border-sky-300 hover:border-sky-700 shadow-sm hover:shadow-2xl transition-all duration-400 flex flex-col cursor-pointer transform hover:-translate-y-1"
          >
            {/* Image Banner */}
            <div className="relative aspect-[16/10] overflow-hidden bg-sky-100">
              <img
                src={bannerFor('khushi-communication')}
                onError={(event) => restoreDefault('khushi-communication', event.currentTarget)}
                alt="Khushi Communication Mobiles"
                className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-600"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0C4A6E]/75 via-transparent to-transparent" />
              <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-xs px-3 py-1 rounded-full text-xs font-bold text-sky-900 shadow-xs flex items-center gap-1.5">
                <Smartphone size={14} className="text-sky-600" />
                <span>Mobiles & Accessories</span>
              </div>
            </div>

            {/* Card Content */}
            <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-['Marcellus'] font-bold text-[#0C4A6E] group-hover:text-sky-700 transition-colors">
                  KHUSHI COMMUNICATION
                </h3>
                <p className="text-xs font-semibold text-sky-700 mt-1">
                  Mobiles & Accessories
                </p>
                <p className="text-xs text-stone-600 mt-2.5 leading-relaxed">
                  Mobile phones, 65W GaN fast chargers, braided cables, ANC earphones, headphones, power banks, armored covers, and 9H tempered glass.
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-sky-200 flex items-center justify-between">
                <span className="text-xs font-bold text-sky-900">Certified Tech Gadgets</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleShopSelect('khushi-communication');
                  }}
                  className="px-4 py-2 bg-[#0284C7] group-hover:bg-[#0369A1] text-white rounded-xl text-xs font-bold tracking-wider uppercase transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <span>SHOP MOBILE ACCESSORIES</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
