import React, { useState, useEffect } from 'react';
import { Timer, ArrowRight, Zap, Sparkles } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { ProductCard } from './ProductCard';

export const SpecialOffers: React.FC = () => {
  const { products, setCurrentView, setFilters } = useStore();

  // Dynamic Live Countdown Timer for "Today's Best Deals"
  const [timeLeft, setTimeLeft] = useState({
    hours: 8,
    minutes: 42,
    seconds: 19,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else {
          return { hours: 12, minutes: 0, seconds: 0 };
        }
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Filter products with high discounts (>= 50% OFF)
  const dealProducts = products
    .filter((p) => p.status === 'active' && p.discount >= 45)
    .slice(0, 4);

  const handleViewAllOffers = () => {
    setFilters((prev) => ({ ...prev, shopId: 'all', discountMin: 40, sortBy: 'discount' }));
    setCurrentView('shop');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <section id="special-offers" className="py-10 sm:py-14 bg-gradient-to-r from-[#2A1810] via-[#3E1D0C] to-[#2A1810] text-white relative overflow-hidden">
      {/* Subtle Gold / Amber festive ambient lights */}
      <div className="absolute top-0 right-1/4 w-72 h-72 rounded-full bg-[#B47226]/15 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-72 h-72 rounded-full bg-[#965215]/15 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Banner Header with Timer */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6 mb-8 sm:mb-10 pb-6 border-b border-[#B47226]/30">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#B47226]/20 border border-[#B47226]/40 text-[#DFB062] text-xs font-bold uppercase tracking-wider mb-2">
              <Zap size={14} className="fill-[#DFB062]" />
              <span>Limited Time Flash Deals</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-['Marcellus'] font-bold text-amber-50">
              Today&apos;s Best Deals
            </h2>
            <p className="text-xs sm:text-sm text-stone-300 mt-1">
              Massive discounts up to 60% OFF across all three shops. Grab yours before stock runs out!
            </p>
          </div>

          {/* Countdown Clock */}
          <div className="flex items-center gap-2 sm:gap-3 bg-black/40 backdrop-blur-md p-3 sm:p-4 rounded-2xl border border-[#B47226]/40 shadow-lg">
            <Timer size={22} className="text-[#DFB062] shrink-0" />
            <span className="text-xs text-stone-300 font-medium hidden sm:inline">Ends In:</span>
            <div className="flex items-center gap-1.5 font-mono text-center">
              <div className="bg-[#1A0F0A] border border-[#B47226]/50 px-2.5 py-1.5 rounded-lg">
                <span className="block text-base sm:text-lg font-extrabold text-[#DFB062]">
                  {String(timeLeft.hours).padStart(2, '0')}
                </span>
                <span className="text-[9px] uppercase tracking-wider text-stone-400">Hrs</span>
              </div>
              <span className="text-[#DFB062] font-bold text-lg">:</span>
              <div className="bg-[#1A0F0A] border border-[#B47226]/50 px-2.5 py-1.5 rounded-lg">
                <span className="block text-base sm:text-lg font-extrabold text-[#DFB062]">
                  {String(timeLeft.minutes).padStart(2, '0')}
                </span>
                <span className="text-[9px] uppercase tracking-wider text-stone-400">Min</span>
              </div>
              <span className="text-[#DFB062] font-bold text-lg">:</span>
              <div className="bg-[#1A0F0A] border border-[#B47226]/50 px-2.5 py-1.5 rounded-lg">
                <span className="block text-base sm:text-lg font-extrabold text-[#DFB062]">
                  {String(timeLeft.seconds).padStart(2, '0')}
                </span>
                <span className="text-[9px] uppercase tracking-wider text-stone-400">Sec</span>
              </div>
            </div>
          </div>
        </div>

        {/* Deals Product Grid (4 items) */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-6 text-stone-900">
          {dealProducts.map((product) => (
            <ProductCard key={product.id} product={product} badgeText="MEGA DEAL" />
          ))}
        </div>

        {/* View All Offers CTA */}
        <div className="mt-8 sm:mt-10 text-center">
          <button
            type="button"
            onClick={handleViewAllOffers}
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-[#DFB062] via-[#B47226] to-[#965215] hover:opacity-95 text-stone-950 font-extrabold text-xs sm:text-sm tracking-wider uppercase rounded-full shadow-lg transition-transform hover:scale-103 cursor-pointer"
          >
            <span>VIEW ALL OFFERS & DISCOUNTS</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </section>
  );
};
