import React, { useEffect, useState } from 'react';
import { saveOfferSlides, watchOfferSlides } from '../lib/firebaseRepository';
import type { OfferSlide } from '../types';
import { useStore } from '../context/StoreContext';
import { initialShops } from '../config/siteConfig';

const emptySlide = (): OfferSlide => ({
  id: crypto.randomUUID(), title: '', subtitle: '', badge: '', description: '', imageUrl: '',
  ctaText: 'SHOP NOW', discountText: '', active: true, displayOrder: 1, startDate: '', endDate: '',
  destinationType: 'shop', destinationValue: '', shopId: '',
});

export const AdminOffersManager: React.FC = () => {
  const { products, shops } = useStore();
  const availableShops = shops.length ? shops : initialShops;
  const [slides, setSlides] = useState<OfferSlide[]>([]);
  const [draft, setDraft] = useState<OfferSlide | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  useEffect(() => watchOfferSlides((remote) => setSlides(remote || []), (error) => setMessage(error.message)), []);
  const save = async (next: OfferSlide[]) => {
    setBusy(true); setMessage('');
    try { await saveOfferSlides(next); setDraft(null); setMessage('Offers saved.'); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Could not save offers.'); }
    finally { setBusy(false); }
  };
  const field = (key: keyof OfferSlide, label: string, type = 'text') => <label className="block text-xs font-bold text-stone-700">
    {label}
    <input type={type} value={String(draft?.[key] ?? '')} onChange={(event) => setDraft((old) => old ? { ...old, [key]: type === 'number' ? Number(event.target.value) : event.target.value } : old)} className="mt-1 w-full rounded-xl border border-stone-300 px-3 py-2 text-sm font-normal" />
  </label>;
  return <section className="rounded-3xl border border-[#E8DEC8] bg-white p-5 sm:p-8">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="font-['Marcellus'] text-xl font-bold text-stone-900">Homepage Offers</h2><p className="text-xs text-stone-500">Slides appear in display order when active and within their optional dates.</p></div>
      <button type="button" onClick={() => setDraft(emptySlide())} className="rounded-full bg-[#965215] px-4 py-2 text-xs font-bold text-white">Add Offer</button>
    </div>
    {message && <p role="status" className="mt-3 text-xs text-stone-700">{message}</p>}
    <div className="mt-5 space-y-3">{slides.slice().sort((a, b) => a.displayOrder - b.displayOrder).map((slide) =>
      <div key={slide.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-stone-200 p-3">
        <div><p className="text-sm font-bold">{slide.title}</p><p className="text-xs text-stone-500">{slide.active ? 'Active' : 'Inactive'} · {slide.destinationType}: {slide.destinationValue}</p></div>
        <div className="flex gap-2"><button type="button" onClick={() => setDraft({ ...slide })} className="rounded-lg border px-3 py-1.5 text-xs">Edit</button><button type="button" disabled={busy} onClick={() => save(slides.filter((item) => item.id !== slide.id))} className="rounded-lg border border-red-200 px-3 py-1.5 text-xs text-red-700">Delete</button></div>
      </div>)}</div>
    {draft && <form className="mt-6 space-y-4 rounded-2xl border border-[#E8DEC8] bg-[#FAF7F2] p-4" onSubmit={(event) => {
      event.preventDefault();
      if (!draft.title.trim() || !draft.imageUrl.trim() || !draft.destinationValue.trim()) { setMessage('Title, image URL and destination are required.'); return; }
      if (draft.endDate && draft.startDate && draft.endDate < draft.startDate) { setMessage('End date must follow start date.'); return; }
      void save([...slides.filter((item) => item.id !== draft.id), draft]);
    }}>
      <div className="grid gap-3 sm:grid-cols-2">{field('title', 'Title *')}{field('subtitle', 'Subtitle')}{field('badge', 'Badge text')}{field('description', 'Description')}{field('imageUrl', 'Banner image URL *', 'url')}{field('ctaText', 'CTA text')}{field('discountText', 'Discount text')}{field('displayOrder', 'Display order', 'number')}{field('startDate', 'Start date', 'date')}{field('endDate', 'End date', 'date')}</div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs font-bold">Destination type<select value={draft.destinationType} onChange={(event) => setDraft({ ...draft, destinationType: event.target.value as OfferSlide['destinationType'], destinationValue: '' })} className="mt-1 w-full rounded-xl border px-3 py-2 text-sm font-normal">
          {(['product', 'category', 'shop', 'collection', 'offer', 'search'] as const).map((type) => <option key={type} value={type}>{type}</option>)}
        </select></label>
        <label className="text-xs font-bold">Destination value *<select value={['product', 'category', 'shop', 'collection'].includes(draft.destinationType) ? draft.destinationValue : '__custom'} onChange={(event) => setDraft({ ...draft, destinationValue: event.target.value })} className="mt-1 w-full rounded-xl border px-3 py-2 text-sm font-normal" disabled={!['product', 'category', 'shop', 'collection'].includes(draft.destinationType)}>
          <option value="">Choose a destination</option>
          {draft.destinationType === 'product' && products.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          {draft.destinationType === 'category' && [...new Map(products.map((item) => [item.categoryId, item.categoryName])).entries()].map(([id, name]) => <option key={id} value={id}>{name}</option>)}
          {draft.destinationType === 'shop' && availableShops.map((shop) => <option key={shop.id} value={shop.id}>{shop.name}</option>)}
          {draft.destinationType === 'collection' && ['new-arrivals', 'featured', 'best-sellers'].map((value) => <option key={value} value={value}>{value}</option>)}
        </select></label>
        {['offer', 'search'].includes(draft.destinationType) && field('destinationValue', draft.destinationType === 'offer' ? 'Minimum discount percentage *' : 'Search words *', draft.destinationType === 'offer' ? 'number' : 'text')}
        <label className="text-xs font-bold">Shop/division filter<select value={draft.shopId} onChange={(event) => setDraft({ ...draft, shopId: event.target.value })} className="mt-1 w-full rounded-xl border px-3 py-2 text-sm font-normal"><option value="">All shops</option>{availableShops.map((shop) => <option key={shop.id} value={shop.id}>{shop.name}</option>)}</select></label>
      </div>
      <label className="flex items-center gap-2 text-xs font-bold"><input type="checkbox" checked={draft.active} onChange={(event) => setDraft({ ...draft, active: event.target.checked })} /> Active</label>
      <div className="flex gap-2"><button type="submit" disabled={busy} className="rounded-full bg-[#965215] px-5 py-2 text-xs font-bold text-white">Save Offer</button><button type="button" onClick={() => setDraft(null)} className="rounded-full border px-5 py-2 text-xs">Cancel</button></div>
    </form>}
  </section>;
};
