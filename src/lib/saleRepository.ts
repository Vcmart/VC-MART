import { collection, doc, onSnapshot, query, runTransaction, where, type Unsubscribe } from 'firebase/firestore';
import { requireFirebase } from './firebase';
import type { OfferSlide, Product } from '../types';
import { saleProductIds } from '../utils/saleCollections';
import { normalizeProductFields } from '../utils/clothingSizes';
import { ensureProductWholesaleFields } from '../data/initialData';

// Keep the existing settings/homepage.offerSlides schema; update only this offer.
export async function saveHomepageOffer(offer: OfferSlide) {
  const { db } = requireFirebase();
  await runTransaction(db, async transaction => {
    const reference = doc(db, 'settings', 'homepage');
    const snapshot = await transaction.get(reference);
    const slides: OfferSlide[] = Array.isArray(snapshot.data()?.offerSlides) ? snapshot.data()!.offerSlides : [];
    const saved = { ...offer, selectedProductIds: saleProductIds(offer) };
    const next = slides.some(slide => slide.id === offer.id)
      ? slides.map(slide => slide.id === offer.id ? saved : slide)
      : [...slides, saved];
    transaction.set(reference, { offerSlides: next, updatedAt: new Date().toISOString() }, { merge: true });
  });
}

// No limit or local catalog: the admin picker observes the real product collection.
export function watchSalePickerProducts(next: (products: Product[]) => void, error: (reason: Error) => void): Unsubscribe {
  return onSnapshot(collection(requireFirebase().db, 'products'), snapshot => next(snapshot.docs.map(item =>
    ensureProductWholesaleFields(normalizeProductFields({ ...item.data(), id: item.id } as Product)))), error);
}

export function watchSaleProducts(ids: string[], next: (products: Product[]) => void, error: (reason: Error) => void): Unsubscribe {
  const { db } = requireFirebase();
  const unique = saleProductIds({ selectedProductIds: ids });
  if (!unique.length) { next([]); return () => {}; }
  const selected = new Set(unique);
  // Use the canonical public active-product query. Combining document-ID IN
  // with inactive/deleted IDs can be denied by the existing rules. Membership
  // is always applied before publishing results; this never falls back to all
  // catalog products and has no arbitrary 300-product or 30-ID cutoff.
  return onSnapshot(query(collection(db, 'products'), where('status', '==', 'active')), snapshot => next(snapshot.docs
    .filter(item => selected.has(item.id))
    .map(item => ensureProductWholesaleFields(normalizeProductFields({ ...item.data(), id: item.id } as Product)))), error);
}
