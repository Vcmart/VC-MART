import React from 'react';
import { ArrowRight, ShieldCheck, Truck, Headphones, Sparkles, CheckCircle2 } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { siteConfig } from '../config/siteConfig';
import { Logo } from './Logo';

export const HeroBanner: React.FC = () => {
  const { setCurrentView, setActiveShopId, setShoppingMode, shops } = useStore();

  const handleShopNow = () => {
    setActiveShopId('all');
    setCurrentView('shop');
  };

  const handleExploreCategories = () => {
    const el = document.getElementById('shop-by-category');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      setCurrentView('shop');
    }
  };

  const startShopping = (mode: 'retail' | 'wholesale') => {
    setShoppingMode(mode);
    setActiveShopId('all');
    setCurrentView('shop');
  };

  return (
    <section id="hero-banner" className="relative overflow-hidden bg-gradient-to-b from-[#FAF7F2] via-[#F4ECE4] to-[#FAF7F2] py-6 sm:py-10 md:py-14 border-b border-[#E8DEC8]">
      {/* Decorative Traditional Indian Mandala / Aureole watermarks in background */}
      <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[#B47226]/5 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-[#965215]/5 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Heading & CTAs */}
          <div className="lg:col-span-7 text-center lg:text-left">
            {/* Trust badge featuring official Admin Logo */}
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[#965215]/10 border border-[#965215]/20 text-[#7A3F0E] text-xs font-bold mb-4 shadow-2xs">
              <Logo size="sm" variant="image-only" />
              <span>3 Flagship Shops &bull; 1 Trusted Indian Platform</span>
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-['Marcellus'] font-extrabold text-[#2A1810] tracking-tight leading-[1.15]">
              Everything You Need. <br className="hidden sm:inline" />
              <span className="text-[#965215] drop-shadow-xs">All in One Place.</span>
            </h1>

            {/* Subheadline */}
            <p className="mt-3 sm:mt-4 text-base sm:text-lg text-[#5A3825] font-medium tracking-wide">
              Fashion &bull; Bike Accessories &bull; Mobile Accessories
            </p>

            <p className="mt-2 text-xs sm:text-sm text-stone-600 max-w-xl mx-auto lg:mx-0">
              One common shopping cart for Vinayak Collection, Kinshuk Spare Parts, and Khushi Communication. Order designer clothing, heavy-duty bike spares, and mobile electronics together with instant delivery across India.
            </p>

            {/* Action Buttons */}
            <div className="mt-6 sm:mt-8 flex flex-wrap items-center justify-center lg:justify-start gap-3 sm:gap-4">
              <button
                id="hero-shop-now-btn"
                type="button"
                onClick={handleShopNow}
                className="px-6 sm:px-8 py-3.5 bg-[#965215] hover:bg-[#7A3F0E] text-white rounded-full font-bold text-xs sm:text-sm tracking-wider uppercase transition-all shadow-md hover:shadow-lg flex items-center gap-2 cursor-pointer transform hover:-translate-y-0.5"
              >
                <span>SHOP NOW</span>
                <ArrowRight size={16} />
              </button>

              <button
                id="hero-explore-categories-btn"
                type="button"
                onClick={handleExploreCategories}
                className="px-6 sm:px-8 py-3.5 bg-white hover:bg-[#FBF8F4] text-[#7A3F0E] border-2 border-[#D8C7B5] hover:border-[#965215] rounded-full font-bold text-xs sm:text-sm tracking-wider uppercase transition-all shadow-2xs cursor-pointer"
              >
                <span>EXPLORE CATEGORIES</span>
              </button>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 max-w-lg mx-auto lg:mx-0">
              <button type="button" onClick={() => startShopping('retail')} className="rounded-xl border border-[#965215] bg-white px-4 py-3 text-left shadow-sm hover:bg-amber-50 transition-colors">
                <span className="block text-xs font-extrabold tracking-wider text-[#7A3F0E]">RETAIL</span>
                <span className="mt-1 block text-[11px] text-stone-600">Shop individual items</span>
              </button>
              <button type="button" onClick={() => startShopping('wholesale')} className="rounded-xl border border-blue-800 bg-blue-900 px-4 py-3 text-left shadow-sm hover:bg-blue-950 transition-colors">
                <span className="block text-xs font-extrabold tracking-wider text-white">WHOLESALE</span>
                <span className="mt-1 block text-[11px] text-blue-100">Buy complete sets</span>
              </button>
            </div>

            {/* Quick Value Metrics */}
            <div className="mt-8 pt-6 border-t border-[#E8DEC8]/80 grid grid-cols-3 gap-2 sm:gap-4 text-left">
              <div>
                <span className="block text-lg sm:text-xl font-['Marcellus'] font-bold text-[#7A3F0E]">10,000+</span>
                <span className="text-[11px] text-stone-500">Happy Customers</span>
              </div>
              <div>
                <span className="block text-lg sm:text-xl font-['Marcellus'] font-bold text-[#7A3F0E]">100%</span>
                <span className="text-[11px] text-stone-500">Genuine Spares & Wear</span>
              </div>
              <div>
                <span className="block text-lg sm:text-xl font-['Marcellus'] font-bold text-[#7A3F0E]">48 Hrs</span>
                <span className="text-[11px] text-stone-500">Fast Dispatch in India</span>
              </div>
            </div>
          </div>

          {/* Right Column: Visual Card Trio representing the 3 shops */}
          <div className="lg:col-span-5 relative">
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {/* Card 1: Vinayak Collection Fashion */}
              <div
                onClick={() => {
                  setActiveShopId('vinayak-collection');
                  setCurrentView('shop');
                }}
                className="group relative rounded-2xl overflow-hidden shadow-md hover:shadow-xl border border-amber-200 transition-all cursor-pointer bg-white"
              >
                <div className="aspect-[4/5] overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=600&auto=format&fit=crop"
                    alt="Vinayak Collection Fashion"
                    className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-3 text-white">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300">Vinayak Collection</span>
                  <p className="text-xs sm:text-sm font-bold font-['Marcellus']">Fashion & Ethnic Wear</p>
                  <span className="text-[10px] text-stone-200 mt-0.5">Upto 50% OFF &rarr;</span>
                </div>
              </div>

              {/* Staggered Column with Card 2 & 3 */}
              <div className="space-y-3 sm:space-y-4">
                {/* Card 2: Kinshuk Spare Parts */}
                <div
                  onClick={() => {
                    setActiveShopId('kinshuk-spare-parts');
                    setCurrentView('shop');
                  }}
                  className="group relative rounded-2xl overflow-hidden shadow-md hover:shadow-xl border border-slate-300 transition-all cursor-pointer bg-white"
                >
                  <div className="aspect-[4/3] overflow-hidden">
                    <img
                      src="https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=600&auto=format&fit=crop"
                      alt="Kinshuk Spare Parts"
                      className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex flex-col justify-end p-2.5 text-white">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-300">Kinshuk Spare Parts</span>
                    <p className="text-xs font-bold font-['Marcellus']">Bike Accessories & Lights</p>
                  </div>
                </div>

                {/* Card 3: Khushi Communication */}
                <div
                  onClick={() => {
                    setActiveShopId('khushi-communication');
                    setCurrentView('shop');
                  }}
                  className="group relative rounded-2xl overflow-hidden shadow-md hover:shadow-xl border border-sky-300 transition-all cursor-pointer bg-white"
                >
                  <div className="aspect-[4/3] overflow-hidden">
                    <img
                      src="https://images.unsplash.com/photo-1583863788434-e58a36330cf0?q=80&w=600&auto=format&fit=crop"
                      alt="Khushi Communication"
                      className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex flex-col justify-end p-2.5 text-white">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-sky-300">Khushi Communication</span>
                    <p className="text-xs font-bold font-['Marcellus']">Fast Chargers & Audio</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
