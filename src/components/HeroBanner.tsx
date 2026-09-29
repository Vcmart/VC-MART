import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { isFirebaseConfigured } from '../lib/firebase';
import { watchOfferSlides } from '../lib/firebaseRepository';
import type { OfferSlide, ShopId } from '../types';
import { getVisibleOfferSlides } from '../utils/offerSlides';

const makeDefault = (id: string, title: string, subtitle: string, imageUrl: string, order: number): OfferSlide => ({
  id, title, subtitle, imageUrl, badge: 'EXPLORE VC MART', description: 'Discover quality products from our trusted Indian shops.',
  ctaText: 'SHOP NOW', discountText: '', active: true, displayOrder: order, startDate: '', endDate: '',
  destinationType: 'shop', destinationValue: id, shopId: id,
});
const defaults = [
  makeDefault('vinayak-collection', 'Style for every occasion', 'Vinayak Collection', 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=1200&auto=format&fit=crop', 1),
  makeDefault('kinshuk-spare-parts', 'Ready for every ride', 'Kinshuk Spare Parts', 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=1200&auto=format&fit=crop', 2),
  makeDefault('khushi-communication', 'Everyday tech essentials', 'Khushi Communication', 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?q=80&w=1200&auto=format&fit=crop', 3),
];

export const HeroBanner: React.FC = () => {
  const { setCurrentView, setFilters, setSearchQuery, openProductDetails, products } = useStore();
  const [saved, setSaved] = useState<OfferSlide[] | null>(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const resume = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!isFirebaseConfigured) return;
    return watchOfferSlides(setSaved, (error) => console.error('Offer slides could not be loaded:', error));
  }, []);
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 60000); return () => clearInterval(timer); }, []);
  const slides = useMemo(() => getVisibleOfferSlides(saved ?? defaults, now), [saved, now]);
  useEffect(() => setIndex((old) => slides.length ? Math.min(old, slides.length - 1) : 0), [slides.length]);
  useEffect(() => {
    if (paused || slides.length < 2) return;
    const timer = setInterval(() => setIndex((old) => (old + 1) % slides.length), 4500);
    return () => clearInterval(timer);
  }, [paused, slides.length]);
  useEffect(() => () => { if (resume.current) clearTimeout(resume.current); }, []);
  const move = (next: number) => {
    setIndex((next + slides.length) % slides.length);
    setPaused(true);
    if (resume.current) clearTimeout(resume.current);
    resume.current = setTimeout(() => setPaused(false), 8000);
  };
  const openOffer = (slide: OfferSlide) => {
    const params = new URLSearchParams();
    const shops = ['vinayak-collection', 'kinshuk-spare-parts', 'khushi-communication'];
    if (shops.includes(slide.shopId)) params.set('shop', slide.shopId);
    const value = slide.destinationValue.trim();
    if (slide.destinationType === 'product') {
      const product = products.find((item) => item.id === value);
      if (!product) return;
      params.set('product', product.id);
      openProductDetails(product);
    } else if (slide.destinationType === 'shop' && shops.includes(value)) params.set('shop', value);
    else if (slide.destinationType === 'category' && value) params.set('category', value);
    else if (slide.destinationType === 'collection' && ['new-arrivals', 'featured', 'best-sellers'].includes(value)) params.set('collection', value);
    else if (slide.destinationType === 'offer' && Number(value) > 0) params.set('discount', value);
    else if (slide.destinationType === 'search' && value) params.set('search', value);
    setCurrentView('shop');
    window.history.replaceState({ view: 'shop' }, '', '/shop' + (params.size ? '?' + params : ''));
    setFilters({
      shopId: (params.get('shop') || 'all') as ShopId | 'all',
      categoryId: params.get('category') || undefined,
      collection: (params.get('collection') || undefined) as 'new-arrivals' | 'featured' | 'best-sellers' | undefined,
      discountMin: Number(params.get('discount') || 0) || undefined,
      minPrice: 0, maxPrice: Number.MAX_SAFE_INTEGER, inStockOnly: false, sortBy: 'popular',
    });
    setSearchQuery(params.get('search') || '');
  };
  if (!slides.length) return null;
  return <section id="hero-banner" className="border-b border-[#E8DEC8] bg-[#FAF7F2] px-4 py-5 sm:px-6 sm:py-8">
    <div className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl bg-[#2A1810] shadow-xl" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocusCapture={() => setPaused(true)} onBlurCapture={() => setPaused(false)} aria-label="Featured offers">
      <div className="relative h-[330px] sm:h-[360px] lg:h-[390px]">
        {slides.map((slide, position) => <div key={slide.id} className={`absolute inset-0 transition-opacity duration-700 ${position === index ? 'z-10 opacity-100' : 'pointer-events-none opacity-0'}`} aria-hidden={position !== index}>
          <img src={slide.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#21130e]/95 via-[#21130e]/75 to-[#21130e]/20" />
          <button type="button" tabIndex={position === index ? 0 : -1} onClick={() => openOffer(slide)} className="absolute inset-0 z-10 flex w-full cursor-pointer items-center p-7 text-left sm:p-12 lg:p-16">
            <span className="block max-w-xl text-white">
              <span className="mb-3 inline-block rounded-full border border-amber-300/50 bg-[#965215]/70 px-3 py-1 text-[10px] font-bold tracking-widest text-amber-100">{slide.badge}</span>
              <span className="block text-xs font-semibold uppercase tracking-widest text-[#DFB062]">{slide.subtitle}</span>
              <span className="mt-2 block font-['Marcellus'] text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">{slide.title}</span>
              {slide.discountText && <span className="mt-2 block text-lg font-bold text-[#DFB062]">{slide.discountText}</span>}
              <span className="mt-3 block max-w-md text-sm leading-relaxed text-stone-200 sm:text-base">{slide.description}</span>
              <span className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#B47226] px-5 py-3 text-xs font-bold tracking-wider text-white shadow-md">{slide.ctaText || 'SHOP NOW'} <ArrowRight size={16} /></span>
            </span>
          </button>
        </div>)}
      </div>
      {slides.length > 1 && <>
        <button type="button" onClick={() => move(index - 1)} aria-label="Previous offer" className="absolute bottom-5 right-16 z-20 rounded-full border border-white/40 bg-black/30 p-2 text-white hover:bg-black/60"><ChevronLeft size={18} /></button>
        <button type="button" onClick={() => move(index + 1)} aria-label="Next offer" className="absolute bottom-5 right-5 z-20 rounded-full border border-white/40 bg-black/30 p-2 text-white hover:bg-black/60"><ChevronRight size={18} /></button>
        <div className="absolute bottom-6 left-7 z-20 flex gap-2 sm:left-12">{slides.map((slide, position) => <button key={slide.id} type="button" aria-label={`Show offer ${position + 1}`} aria-current={position === index} onClick={() => move(position)} className={`h-2 rounded-full transition-all ${position === index ? 'w-7 bg-[#DFB062]' : 'w-2 bg-white/60 hover:bg-white'}`} />)}</div>
      </>}
    </div>
  </section>;
};
