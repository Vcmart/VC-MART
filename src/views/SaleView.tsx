import React, { useEffect, useMemo, useState } from 'react';
import type { OfferSlide, Product } from '../types';
import { useStore } from '../context/StoreContext';
import { watchOfferSlides } from '../lib/firebaseRepository';
import { watchSaleProducts } from '../lib/saleRepository';
import { getVisibleOfferSlides } from '../utils/offerSlides';
import { saleProductIds, selectSaleProducts } from '../utils/saleCollections';
import { ProductCard } from '../components/ProductCard';
import { OfferBannerImage } from '../components/OfferBannerImage';
import { initialShops } from '../config/siteConfig';

const offerIdFromPath = () => {
  try { return decodeURIComponent(window.location.pathname.split('/')[2] || ''); } catch { return ''; }
};
export const SaleView: React.FC = () => {
  const { setCurrentView, shops, shoppingMode } = useStore();
  const [offerId, setOfferId] = useState(offerIdFromPath);
  const [offers, setOffers] = useState<OfferSlide[] | null>(null);
  const [error, setError] = useState('');
  const [loadedProducts, setLoadedProducts] = useState<{ key: string; products: Product[] } | null>(null);
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const update = () => setOfferId(offerIdFromPath());
    window.addEventListener('popstate', update); window.addEventListener('vcmart:navigate', update);
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => { window.removeEventListener('popstate', update); window.removeEventListener('vcmart:navigate', update); clearInterval(timer); };
  }, []);
  useEffect(() => watchOfferSlides(value => { setOffers(value || []); setError(''); }, reason => {
    console.error('Sale offer could not be loaded', { code: (reason as Error & { code?: string }).code }); setError('This sale could not be loaded. Please try again later.');
  }), []);
  const offer = getVisibleOfferSlides(offers || [], now).find(item => item.id === offerId && item.destinationType === 'sale');
  const productKey = JSON.stringify(offer ? saleProductIds(offer) : []);
  useEffect(() => {
    setLoadedProducts(null);
    if (!offer) return;
    return watchSaleProducts(JSON.parse(productKey), products => { setLoadedProducts({ key: productKey, products }); setError(''); }, reason => {
      console.error('Sale products could not be loaded', offerId, (reason as Error & { code?: string }).code || reason.message); setError('Sale products could not be loaded. Please try again later.');
    });
  }, [offerId, productKey, Boolean(offer)]);
  const products = useMemo(() => offer && loadedProducts?.key === productKey ? selectSaleProducts(offer, loadedProducts.products).filter(product => {
    const shop = shops.find(item => item.id === product.shopId) || initialShops.find(item => item.id === product.shopId);
    return shop?.status === 'active' && shop.isActive !== false;
  }) : [], [offer, loadedProducts, productKey, shops]);
  return <div id="sale-view" className="mx-auto min-h-[60vh] max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-10">
    <button type="button" onClick={() => setCurrentView('home')} className="text-sm text-[#965215]">← Home</button>
    {error ? <p role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-4">{error}</p> : offers === null ? <p role="status">Loading sale…</p> : !offer ? <h1 className="text-xl font-bold">This sale is unavailable or has ended.</h1> : <>
      <div className="relative overflow-hidden rounded-3xl bg-[#2A1810] p-7 text-white sm:p-12">
        <OfferBannerImage key={offer.imageUrl} imageUrl={offer.imageUrl || ''} offerId={offer.id} />
        <div className="absolute inset-0 bg-gradient-to-r from-[#21130e]/90 to-[#21130e]/40" />
        <div className="relative"><p className="text-xs uppercase tracking-widest text-amber-200">{offer.subtitle}</p><h1 className="mt-2 font-['Marcellus'] text-3xl font-bold sm:text-4xl">{offer.title}</h1><p className="mt-3 font-bold text-amber-200">{offer.discountText}</p><p className="mt-2 text-sm">{offer.description}</p></div>
      </div>
      <p className="text-xs text-stone-600">{shoppingMode === 'wholesale' ? 'Wholesale prices per set' : 'Retail prices'} · Prices and availability are shown on each product.</p>
      {loadedProducts?.key !== productKey ? <p role="status">Loading sale products…</p> : !products.length ? <p role="status" className="rounded-2xl border border-[#E8DEC8] bg-white p-8 text-center">Sale products will be available soon</p> : <><p className="text-sm text-stone-600">{products.length} sale products</p><div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">{products.map(product => <ProductCard key={product.id} product={product} />)}</div></>}
    </>}
  </div>;
};
