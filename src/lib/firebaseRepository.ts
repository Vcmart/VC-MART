import { collection, doc, getDoc, getDocs, onSnapshot, query, setDoc, updateDoc, where, orderBy, limit, serverTimestamp, runTransaction, type Unsubscribe } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytesResumable, deleteObject } from 'firebase/storage';
import { createUserWithEmailAndPassword, sendPasswordResetEmail, signInWithEmailAndPassword, signOut, updateProfile, onAuthStateChanged, type User } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { auth, db, storage, firebaseApp, requireFirebase } from './firebase';
import type { Coupon, Order, Product, UserProfile } from '../types';
export { auth };

const docs = (name: string) => collection(requireFirebase().db, name);
const clean = <T extends Record<string, unknown>>(id: string, data: T) => ({ ...data, id });

export const watchProducts = (next: (items: Product[]) => void, error: (reason: Error) => void, includeInactive = false): Unsubscribe => {
  const { db: store } = requireFirebase();
  const base = includeInactive ? query(collection(store, 'products'), limit(300)) : query(collection(store, 'products'), where('status', '==', 'active'), limit(300));
  return onSnapshot(base, (snap) => next(snap.docs.map((d) => clean(d.id, d.data()) as Product)), error);
};
export const listAdminProducts = async () => {
  const snap = await getDocs(query(docs('products'), orderBy('updatedAt', 'desc'), limit(300)));
  return snap.docs.map((d) => clean(d.id, d.data()) as Product);
};
export async function saveProduct(product: Product) {
  const { db: store } = requireFirebase();
  // Optional fields in the product form are undefined; Firestore rejects them.
  const data = JSON.parse(JSON.stringify({ ...product, updatedAt: new Date().toISOString() }));
  await setDoc(doc(store, 'products', product.id), data, { merge: true });
}
export async function findProductBySku(sku: string, excludingId?: string) {
  const snap = await getDocs(query(docs('products'), where('sku', '==', sku)));
  return snap.docs.find((product) => product.id !== excludingId);
}
export async function softDeleteProduct(id: string) {
  const { db: store } = requireFirebase();
  await updateDoc(doc(store, 'products', id), { status: 'inactive', deletedAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
}
export async function uploadProductImage(file: File, productId: string, onProgress?: (progress: number) => void) {
  const { storage: bucket } = requireFirebase();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const extension = safeName.split('.').pop()?.toLowerCase();
  const contentTypeByExtension: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
  };
  const contentType = contentTypeByExtension[extension || ''] || file.type;
  if (!contentType.startsWith('image/')) {
    throw new Error('Only JPG, PNG, and WEBP product images can be uploaded.');
  }
  const task = uploadBytesResumable(
    ref(bucket, `products/${productId}/${crypto.randomUUID()}-${safeName}`),
    file,
    { contentType, customMetadata: { productId } }
  );
  return new Promise<string>((resolve, reject) => task.on('state_changed', (s) => onProgress?.(s.totalBytes ? Math.round((s.bytesTransferred / s.totalBytes) * 100) : 0), reject, async () => resolve(await getDownloadURL(task.snapshot.ref))));
}
export async function uploadMultipleProductImages(slots: Array<{file?: File; url?: string; previewUrl: string}>, productId: string, onProgress?: (current: number, total: number) => void) {
  const total = slots.filter((slot) => slot.file).length;
  let complete = 0;
  const urls: string[] = [];
  for (const slot of slots) {
    const url = slot.file ? await uploadProductImage(slot.file, productId, (progress) => {
      if (progress === 100) onProgress?.(complete + 1, total);
    }) : (slot.url || slot.previewUrl);
    if (!url || url.startsWith('blob:') || url.startsWith('data:')) throw new Error('Product image upload did not produce a persistent Firebase Storage URL.');
    urls.push(url);
    if (slot.file) complete++;
    onProgress?.(complete, total);
  }
  return { urls, productImages: urls.map((url, index) => ({ url, position: index + 1, is_primary: index === 0 })) };
}
export async function uploadBrandAsset(file: File) {
  const { storage: bucket } = requireFirebase();
  const task = uploadBytesResumable(ref(bucket, `branding/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`), file, { contentType: file.type });
  return new Promise<string>((resolve, reject) => task.on('state_changed', undefined, reject, async () => resolve(await getDownloadURL(task.snapshot.ref))));
}
export async function deleteStorageUrl(url: string) { const { storage: bucket } = requireFirebase(); await deleteObject(ref(bucket, url)); }

export async function registerCustomer(email: string, password: string, profile: Omit<UserProfile, 'id'|'role'|'createdAt'>) {
  const { auth: userAuth, db: store } = requireFirebase();
  const result = await createUserWithEmailAndPassword(userAuth, email, password);
  await updateProfile(result.user, { displayName: profile.fullName });
  const data: UserProfile = { ...profile, id: result.user.uid, email: result.user.email || email, role: 'customer', createdAt: new Date().toISOString() };
  await setDoc(doc(store, 'users', result.user.uid), data);
  return { user: result.user, profile: data };
}
export async function loginCustomer(email: string, password: string) { return signInWithEmailAndPassword(requireFirebase().auth, email, password); }
export async function resetCustomerPassword(email: string) { return sendPasswordResetEmail(requireFirebase().auth, email); }
export async function logoutCustomer() { if (auth) await signOut(auth); }
export async function loadUserProfile(uid: string) {
  const snap = await getDoc(doc(requireFirebase().db, 'users', uid));
  return snap.exists() ? clean(snap.id, snap.data()) as UserProfile : null;
}
export async function saveUserProfile(uid: string, patch: Partial<UserProfile>) { await updateDoc(doc(requireFirebase().db, 'users', uid), patch); }
export { onAuthStateChanged, type User };

export const watchCustomerOrders = (uid: string, next: (orders: Order[]) => void, error: (reason: Error) => void): Unsubscribe => {
  const { db: store } = requireFirebase();
  return onSnapshot(query(collection(store, 'orders'), where('customerId', '==', uid), orderBy('createdAt', 'desc'), limit(100)), (snap) => next(snap.docs.map((d) => clean(d.id, d.data()) as Order)), error);
};
export const watchAdminOrders = (next: (orders: Order[]) => void, error: (reason: Error) => void): Unsubscribe => {
  const { db: store } = requireFirebase();
  return onSnapshot(query(collection(store, 'orders'), orderBy('createdAt', 'desc'), limit(300)), (snap) => next(snap.docs.map((d) => clean(d.id, d.data()) as Order)), error);
};
export async function updateOrder(orderId: string, patch: Partial<Order>) { await updateDoc(doc(requireFirebase().db, 'orders', orderId), { ...patch, updatedAt: new Date().toISOString() }); }
export async function getOrderById(orderId: string) { const snap = await getDoc(doc(requireFirebase().db, 'orders', orderId)); return snap.exists() ? clean(snap.id, snap.data()) as Order : null; }

export const watchCoupons = (next: (coupons: Coupon[]) => void, error: (reason: Error) => void, includeInactive = false): Unsubscribe => {
  const base = includeInactive ? query(docs('coupons'), limit(300)) : query(docs('coupons'), where('active', '==', true), limit(300));
  return onSnapshot(base, (snap) => next(snap.docs.map((d) => clean(d.id, d.data()) as Coupon)), error);
};
export async function saveCoupon(coupon: Coupon) { await setDoc(doc(requireFirebase().db, 'coupons', coupon.id), { ...coupon, updated_at: new Date().toISOString() }, { merge: true }); }
export async function deleteCoupon(id: string) { await updateDoc(doc(requireFirebase().db, 'coupons', id), { active: false, deletedAt: new Date().toISOString() }); }

export const FIREBASE_CONFIG = { projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'Set VITE_FIREBASE_PROJECT_ID', url: `https://console.firebase.google.com/project/${import.meta.env.VITE_FIREBASE_PROJECT_ID || ''}`, setupInstructions: 'Configure Firebase Authentication, Firestore and Storage, then deploy Firestore rules, Storage rules and Cloud Functions with the Firebase CLI.' };
export const PRODUCT_STORAGE_PATH = 'products/{productId}/';
export const COUPONS_FIREBASE_SETUP = 'Coupons and couponUsages are Firestore collections. Deploy Firestore rules and Firebase Functions.';
export const STORAGE_FIREBASE_SETUP = 'Product images are stored in Firebase Storage under products/{productId}/. Deploy storage.rules.';
export const VARIANTS_FIREBASE_SETUP = 'Product size/color variants are stored on the canonical Firestore product document.';
export const uploadProductImageToStorage = async (file: File, name: string) => {
  try { const url = await uploadProductImage(file, name); return { success: true, url }; }
  catch (error) { return { success: false, error: error instanceof Error ? error.message : String(error) }; }
};
export async function fetchProductsFromFirebase() { try { return { success: true, products: await listAdminProducts() }; } catch (error) { return { success: false, products: [], error: String(error) }; } }
export async function saveProductToFirebase(product: Product) { await saveProduct(product); return { success: true }; }
export async function syncAllProductsToFirebase(products: Product[]) { let syncedCount = 0; const errors: string[] = []; for (const p of products) try { await saveProduct(p); syncedCount++; } catch (e) { errors.push(e instanceof Error ? e.message : String(e)); } return { success: errors.length === 0, syncedCount, errors, message: `${syncedCount} Firebase products saved.` }; }
export async function saveOrderToFirebase(order: Order) { await setDoc(doc(requireFirebase().db, 'orders', order.id), order); return { success: true, error: undefined as string | undefined }; }
export async function fetchOrdersFromFirebase() { const snap = await getDocs(query(docs('orders'), orderBy('createdAt', 'desc'), limit(300))); return { success: true, orders: snap.docs.map((d) => clean(d.id, d.data()) as Order), error: undefined as string | undefined }; }
export async function updateOrderStatusInFirebase(id: string, status: string, trackingNumber?: string) {
  if (!firebaseApp) throw new Error('Firebase is not configured.');
  const { getFunctions } = await import('firebase/functions');
  return httpsCallable(getFunctions(firebaseApp, 'asia-south1'), 'updateOrderStatus')({ orderId: id, orderStatus: status, trackingNumber });
}
// The anonymous storefront is deliberately allowed to query only published products.
// Keep the health probe aligned with that rule so it does not produce a false
// permission failure while the public catalog itself is healthy.
export async function testFirebaseConnection() {
  const start = Date.now();
  await getDocs(query(docs('products'), where('status', '==', 'active'), limit(1)));
  return { connected: true, tableExists: true, message: 'Firebase Firestore is connected.', latencyMs: Date.now() - start };
}
export async function fetchCouponsFromFirebase(includeInactive = false) { const base = includeInactive ? query(docs('coupons'), limit(300)) : query(docs('coupons'), where('active', '==', true), limit(300)); const snap = await getDocs(base); return { success: true, coupons: snap.docs.map((d) => clean(d.id, d.data()) as Coupon) }; }
export async function saveCouponToFirebase(coupon: Coupon) { await saveCoupon(coupon); return { success: true }; }
export async function deleteCouponFromFirebase(id: string) { await deleteCoupon(id); }
export async function fetchCouponUsagesFromFirebase() { const snap = await getDocs(query(docs('couponUsages'), limit(300))); return { success: true, usages: snap.docs.map((d) => clean(d.id, d.data())) }; }
export async function recordCouponUsageToFirebase(usage: { couponId: string; couponCode: string; orderId: string; customerId: string; discountAmount: number }) {
  const { db: store } = requireFirebase(); const id = `${usage.couponId}_${usage.customerId}`;
  await runTransaction(store, async (tx) => { const ref = doc(store, 'couponUsages', id); const current = await tx.get(ref); tx.set(ref, { ...usage, count: Number(current.data()?.count || 0) + 1, updatedAt: new Date().toISOString() }, { merge: true }); });
}
export const syncAllCouponsToFirebase = async (coupons: Coupon[]) => { let syncedCount = 0; const errors: string[] = []; for (const coupon of coupons) try { await saveCoupon(coupon); syncedCount++; } catch (error) { errors.push(String(error)); } return { success: errors.length === 0, syncedCount, errors }; };
export const saveLogoToFirebase = saveBranding;
export const mapFirebaseRecordToOrder = (record: Record<string, any>) => ({ ...record, id: record.id || record.orderId } as Order);

export async function requestCheckout(payload: unknown) {
  if (!firebaseApp) throw new Error('Firebase is not configured.');
  const { getFunctions } = await import('firebase/functions');
  return httpsCallable(getFunctions(firebaseApp, 'asia-south1'), 'createCheckout')(payload);
}
export async function applyCouponSecure(payload: { code: string; items: unknown[]; shoppingMode: string }) {
  if (!firebaseApp) throw new Error('Firebase is not configured.');
  const { getFunctions } = await import('firebase/functions');
  return httpsCallable(getFunctions(firebaseApp, 'asia-south1'), 'validateCoupon')(payload);
}

export async function saveShop(id: string, shop: object) { await setDoc(doc(requireFirebase().db, 'shops', id), shop as Record<string, unknown>, { merge: true }); }
export type StoreSettings = { freeDeliveryThreshold: number; standardDeliveryFee: number; lowStockThreshold: number };
export const watchStoreSettings = (next: (settings: StoreSettings) => void, error: (reason: Error) => void): Unsubscribe =>
  onSnapshot(doc(requireFirebase().db, 'settings', 'store'), (snap) => {
    const data = snap.data() || {};
    next({
      freeDeliveryThreshold: Math.max(0, Number(data.freeDeliveryThreshold ?? 499)),
      standardDeliveryFee: Math.max(0, Number(data.standardDeliveryFee ?? 49)),
      lowStockThreshold: Math.max(0, Math.floor(Number(data.lowStockThreshold ?? 5))),
    });
  }, error);
export async function saveStoreSettings(settings: StoreSettings) {
  await setDoc(doc(requireFirebase().db, 'settings', 'store'), { ...settings, updatedAt: new Date().toISOString() }, { merge: true });
}
export const watchShops = (next: (shops: Array<Record<string, any>>) => void, error: (reason: Error) => void, includeInactive = false): Unsubscribe => {
  const base = includeInactive ? query(docs('shops'), limit(100)) : query(docs('shops'), where('status', '==', 'active'), limit(100));
  return onSnapshot(base, (snap) => next(snap.docs.map((d) => clean(d.id, d.data()))), error);
};
export async function saveBranding(logoUrl: string) { await setDoc(doc(requireFirebase().db, 'branding', 'site'), { logoUrl, updatedAt: serverTimestamp() }, { merge: true }); }
export async function loadBranding() { const snap = await getDoc(doc(requireFirebase().db, 'branding', 'site')); return snap.exists() ? String(snap.data().logoUrl || '') : null; }
export async function verifyAdmin(uid: string) { const snap = await getDoc(doc(requireFirebase().db, 'adminUsers', uid)); return snap.exists() && snap.data().active === true; }
