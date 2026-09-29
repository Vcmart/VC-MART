import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import type { DocumentReference } from 'firebase-admin/firestore';
import { HttpsError, onCall, onRequest, type CallableRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { createHash } from 'node:crypto';
import { paymentIsCapturedForOrder, verifyCheckoutSignature, verifyWebhookSignature } from './paymentSecurity';

initializeApp();
const db = getFirestore();
const admin = async (uid?: string) => Boolean(uid && (await db.doc(`adminUsers/${uid}`).get()).data()?.active === true);
const money = (n: unknown) => Math.max(0, Math.round(Number(n) || 0));
const razorpayKeyId = defineSecret('RAZORPAY_KEY_ID');
const razorpayKeySecret = defineSecret('RAZORPAY_KEY_SECRET');
const razorpayWebhookSecret = defineSecret('RAZORPAY_WEBHOOK_SECRET');
const checkoutCors = process.env.FUNCTIONS_EMULATOR
  ? ['https://vcmart.shop', 'https://www.vcmart.shop', 'http://localhost:5173', 'http://127.0.0.1:5173']
  : ['https://vcmart.shop', 'https://www.vcmart.shop'];

type CheckoutLine = { productId: string; quantity: number; shoppingMode: 'retail'|'wholesale'; selectedSize?: string; selectedColor?: string; selectedVariants?: Record<string,string> };
function fail(message: string): never { throw new HttpsError('failed-precondition', message); }
function dateMillis(value: any): number | null {
  if (!value) return null;
  if (typeof value?.toDate === 'function') return value.toDate().getTime();
  const raw = String(value);
  const parsed = new Date(/^\d{4}-\d{2}-\d{2}$/.test(raw) ? `${raw}T23:59:59.999Z` : raw).getTime();
  return Number.isFinite(parsed) ? parsed : null;
}
function couponDiscount(coupon: any, cart: Awaited<ReturnType<typeof priceCart>>, _mode: string, code: string) {
  const now = Date.now();
  if (!coupon.active || (String(coupon.code || '').toUpperCase() !== code.toUpperCase())) fail('Coupon is not active.');
  const start = dateMillis(coupon.startDate ?? coupon.start_at);
  const expiry = dateMillis(coupon.expiryDate ?? coupon.expires_at);
  if ((start && start > now) || (expiry && expiry < now)) fail('Coupon is not active.');
  if (cart.subtotal < money(coupon.minOrder ?? coupon.minimum_order_value)) fail('Order total does not meet the coupon minimum.');
  const applicable = coupon.applicable_shopping_type || coupon.applicableShoppingType || 'both';
  let products = coupon.applicable_products ?? coupon.applicableProducts ?? 'all';
  if (typeof products === 'string' && products !== 'all') { try { products = JSON.parse(products); } catch { fail('Coupon product rules are invalid.'); } }
  const shopId = coupon.applicable_shop || coupon.shopId || 'all';
  const eligible = cart.items.filter((item: any) => (applicable === 'both' || applicable === item.shoppingMode) && (shopId === 'all' || shopId === item.shopId) && (products === 'all' || !Array.isArray(products) || products.includes(item.productId)));
  if (!eligible.length) fail('Coupon does not apply to products in your cart.');
  const eligibleTotal = eligible.reduce((sum: number, item: any) => sum + item.total, 0);
  const amount = money(coupon.discount_value ?? coupon.value);
  let discount = (coupon.discount_type || coupon.type) === 'flat' ? amount : Math.floor(eligibleTotal * amount / 100);
  const cap = money(coupon.maximum_discount ?? coupon.maxDiscount);
  if (cap) discount = Math.min(discount, cap);
  return { discount: Math.min(discount, eligibleTotal), eligible };
}

async function priceCart(lines: CheckoutLine[], uid: string) {
  if (!Array.isArray(lines) || lines.length < 1 || lines.length > 50) fail('Cart is empty or contains too many products.');
  const refs = lines.map((line) => db.doc(`products/${String(line.productId || '')}`));
  const snapshots = await db.getAll(...refs);
  let subtotal = 0;
  const items = lines.map((line, i) => {
    const snap = snapshots[i];
    if (!snap.exists) fail('A product in your cart is no longer available.');
    const p = snap.data()!;
    if (p.status !== 'active') fail(`${p.name || 'A product'} is not available.`);
    if (!['vinayak-collection','kinshuk-spare-parts','khushi-communication'].includes(p.shopId)) fail('A product has an invalid shop.');
    const mode = line.shoppingMode;
    if (mode !== 'retail' && mode !== 'wholesale') fail('Invalid shopping mode.');
    const qty = Math.floor(Number(line.quantity));
    if (!Number.isFinite(qty) || qty < 1 || qty > 1000) fail('Invalid product quantity.');
    let amount: number; let pieces: number;
    if (mode === 'wholesale') {
      if (!p.wholesaleEnabled && !p.wholesale_enabled) fail(`${p.name} is not available wholesale.`);
      const setSize = Math.max(1, Math.floor(Number(p.setSize || p.set_size || 0)));
      const minSets = Math.max(1, Math.floor(Number(p.wholesaleMinimumSets || p.wholesale_minimum_sets || 1)));
      if (qty < minSets) fail(`${p.name} requires at least ${minSets} set(s).`);
      pieces = qty * setSize;
      amount = money(p.wholesalePrice ?? p.wholesale_price);
      if (!setSize || !amount) fail(`${p.name} has incomplete wholesale pricing.`);
      if (money(p.stock) < pieces) fail(`Insufficient stock for ${p.name}.`);
      const variants: any[] = p.sizeVariants || p.size_variants || [];
      const wholesaleSizes: string[] = p.wholesaleAvailableSizes || p.wholesale_available_sizes || [];
      if (line.selectedSize && wholesaleSizes.length && !wholesaleSizes.some((size) => String(size).toLowerCase() === line.selectedSize!.toLowerCase())) fail(`Size ${line.selectedSize} is not available wholesale for ${p.name}.`);
      if (line.selectedSize && variants.length) {
        const variant = variants.find((v) => String(v.size).toLowerCase() === line.selectedSize!.toLowerCase() && v.active !== false);
        if (!variant || money(variant.stock_quantity ?? variant.stock) < pieces) fail(`Insufficient wholesale stock for ${p.name} in size ${line.selectedSize}.`);
      }
    } else {
      pieces = qty;
      amount = money(p.salePrice ?? p.retail_price ?? p.retailPrice ?? p.price);
      if (!amount) fail(`${p.name} has invalid retail pricing.`);
      const variants: any[] = p.sizeVariants || p.size_variants || [];
      if (line.selectedSize && variants.length) {
        const variant = variants.find((v) => String(v.size).toLowerCase() === line.selectedSize!.toLowerCase() && v.active !== false);
        if (!variant || money(variant.stock_quantity ?? variant.stock) < qty) fail(`Insufficient stock for ${p.name} in size ${line.selectedSize}.`);
      } else if (variants.length) fail(`Choose a size for ${p.name}.`);
      else if (money(p.stock) < qty) fail(`Insufficient stock for ${p.name}.`);
    }
    subtotal += amount * qty;
    return { productId: snap.id, shopId: p.shopId, shopName: p.shopName || '', name: p.name, image: p.images?.[0] || p.image || '', quantity: qty, pieces, unitPrice: amount, price: amount, total: amount * qty, shoppingMode: mode, selectedSize: line.selectedSize || '', selectedColor: line.selectedColor || '', ...(mode === 'wholesale' ? { setSize: pieces / qty } : {}), selectedVariants: line.selectedVariants || {}, stockAtPurchase: money(p.stock) };
  });
  return { items, subtotal, uid };
}

export const validateCoupon = onCall({ region: 'asia-south1', invoker: 'public' }, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated','Sign in to validate a coupon.');
  const code = String(request.data?.code || '').trim().toUpperCase();
  const lines = request.data?.items as CheckoutLine[];
  const { subtotal, items } = await priceCart(lines, request.auth.uid);
  const snap = await db.collection('coupons').where('code','==',code).limit(1).get();
  if (snap.empty) fail('Coupon is invalid.');
  const coupon = snap.docs[0].data();
  const mode = String(request.data?.shoppingMode || 'retail');
  const { discount, eligible } = couponDiscount(coupon, { subtotal, items, uid: request.auth.uid }, mode, code);
  const perCustomerLimit = money(coupon.perCustomerLimit ?? coupon.per_customer_limit);
  const usageRef = db.doc(`couponUsages/${snap.docs[0].id}_${request.auth.uid}`);
  const usage = await usageRef.get();
  if ((money(coupon.usageLimit ?? coupon.usage_limit) && money(coupon.usedCount ?? coupon.usage_count) >= money(coupon.usageLimit ?? coupon.usage_limit)) || (perCustomerLimit && money(usage.data()?.count) >= perCustomerLimit)) fail('Coupon usage limit has been reached.');
  return { couponId: snap.docs[0].id, code, discount, eligibleProductIds: eligible.map((item: any) => item.productId) };
});

async function createCodCheckoutOrder(request: CallableRequest) {
  if (!request.auth) throw new HttpsError('unauthenticated','Sign in before checkout.');
  const uid = request.auth.uid;
  const customer = request.data?.customer || {};
  if (!/^\d{10}$/.test(String(customer.mobile || '')) || !/^\d{6}$/.test(String(customer.pincode || '')) || !/^\S+@\S+\.\S+$/.test(String(customer.email || '')) || !customer.address || !customer.city || !customer.state || !customer.fullName) fail('Complete and verify your address, email, mobile, city, state and PIN code.');
  if (request.data?.paymentMethod !== 'cod') fail('Choose Cash on Delivery for this checkout.');
  const attemptId = String(request.data?.checkoutAttemptId || '');
  if (attemptId && !/^[a-f0-9-]{36}$/i.test(attemptId)) fail('Invalid checkout attempt. Please retry.');
  const fingerprint = createHash('sha256').update(JSON.stringify({ customer, items: request.data?.items, paymentMethod: 'cod', shoppingMode: request.data?.shoppingMode, couponId: request.data?.couponId, couponCode: request.data?.couponCode })).digest('hex');
  const orderId = attemptId
    ? `VCM-${createHash('sha256').update(`${uid}:${attemptId}`).digest('hex').slice(0, 24).toUpperCase()}`
    : `VCM-${db.collection('orders').doc().id}`;
  const orderRef = db.doc(`orders/${orderId}`);
  const existingOrder = attemptId ? await orderRef.get() : null;
  if (existingOrder?.exists) {
    const previous = existingOrder.data()!;
    if (previous.customerId !== uid || previous.requestFingerprint !== fingerprint) fail('This checkout attempt does not match your order.');
    return { orderId, paymentMethod: 'cod', total: previous.total, paymentStatus: previous.paymentStatus };
  }
  const cart = await priceCart(request.data?.items, uid);
  // Cart quantity denotes complete sets for wholesale lines, pieces for retail.
  const numberOfSets = cart.items.reduce((sum, item) => sum + (item.shoppingMode === 'wholesale' ? item.quantity : 0), 0);
  const deliveryFee = numberOfSets * 250;
  const couponId = String(request.data?.couponId || '');
  const couponCode = String(request.data?.couponCode || '').trim().toUpperCase();
  let discount = 0;
  let couponRef: DocumentReference | null = null;
  let usageRef: DocumentReference | null = null;
  if (couponId) {
    couponRef = db.doc(`coupons/${couponId}`);
    const couponSnap = await couponRef.get();
    if (!couponSnap.exists) fail('Coupon no longer exists.');
    const coupon = couponSnap.data()!;
    const mode = String(request.data?.shoppingMode || 'retail');
    discount = couponDiscount(coupon, cart, mode, couponCode).discount;
    const maxUses = money(coupon.usageLimit ?? coupon.usage_limit);
    if (maxUses && money(coupon.usedCount ?? coupon.usage_count) >= maxUses) fail('Coupon usage limit has been reached.');
    const perCustomer = money(coupon.perCustomerLimit ?? coupon.per_customer_limit);
    usageRef = db.doc(`couponUsages/${couponId}_${uid}`);
    const usage = (await usageRef.get()).data();
    if (perCustomer && money(usage?.count) >= perCustomer) fail('You have already used this coupon the maximum number of times.');
  }
  const total = cart.subtotal - discount + deliveryFee;
  if (total < 1) fail('Invalid order total.');
  const groups = Object.values(cart.items.reduce((acc: Record<string, any>, item: any) => { const group = acc[item.shopId] || { shopId: item.shopId, shopName: item.shopName, items: [], subtotal: 0 }; group.items.push(item); group.subtotal += item.total; acc[item.shopId] = group; return acc; }, {}));
  const base = { orderId, id: orderId, orderNumber: orderId, customerId: uid, requestFingerprint: fingerprint, customerName: String(customer.fullName), customerEmail: String(customer.email).toLowerCase(), customerMobile: String(customer.mobile), shippingAddress: customer, items: cart.items, shopGroups: groups, shopIds: [...new Set(cart.items.map((item: any) => item.shopId))], shoppingMode: request.data?.shoppingMode || 'retail', orderType: request.data?.shoppingMode || 'retail', subtotal: cart.subtotal, discount, couponCode: request.data?.couponCode || '', couponId: couponId || null, deliveryFee, deliveryCharge: deliveryFee, shippingCharge: deliveryFee, numberOfSets, currency: 'INR', total, totalAmount: total, paymentMethod: 'cod', paymentStatus: 'cod_pending', orderStatus: 'pending', trackingNumber: '', estimatedDelivery: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  let concurrentOrder: FirebaseFirestore.DocumentData | null = null;
  await db.runTransaction(async (tx) => {
    const orderSnap = await tx.get(orderRef);
    if (orderSnap.exists) {
      const previous = orderSnap.data()!;
      if (previous.customerId !== uid || previous.requestFingerprint !== fingerprint) fail('This checkout attempt does not match your order.');
      concurrentOrder = previous;
      return;
    }
    const byProduct = new Map<string, any[]>();
    for (const line of cart.items as any[]) byProduct.set(line.productId, [...(byProduct.get(line.productId) || []), line]);
    const refs = [...byProduct.keys()].map((id) => db.doc(`products/${id}`));
    const productSnaps = await Promise.all(refs.map((ref) => tx.get(ref)));
    const currentCoupon = couponRef ? await tx.get(couponRef) : null;
    const currentUsage = usageRef ? await tx.get(usageRef) : null;
    const updates = productSnaps.map((snap, index) => {
      const product = snap.data(); const lines = byProduct.get(refs[index].id)!;
      const pieces = lines.reduce((sum, line) => sum + money(line.pieces), 0);
      if (!product || product.status !== 'active' || money(product.stock) < pieces) fail('Stock changed during checkout. Please update your cart.');
      const variants: any[] = product.sizeVariants || product.size_variants || [];
      if (!variants.length) return { ref: snap.ref, patch: { stock: money(product.stock) - pieces } };
      const demand = new Map<string, number>();
      for (const line of lines) if (line.selectedSize) demand.set(line.selectedSize.toLowerCase(), (demand.get(line.selectedSize.toLowerCase()) || 0) + money(line.pieces));
      const unspecified = pieces - [...demand.values()].reduce((a, b) => a + b, 0);
      const updated = variants.map((variant) => {
        let stock = money(variant.stock_quantity ?? variant.stock);
        const selected = demand.get(String(variant.size).toLowerCase()) || 0;
        if (selected > stock || (selected && variant.active === false)) fail(`Insufficient stock for ${product.name} in size ${variant.size}.`);
        stock -= selected; demand.delete(String(variant.size).toLowerCase());
        return { ...variant, stock_quantity: stock, stock };
      });
      if (demand.size) fail(`Selected size is unavailable for ${product.name}.`);
      let remaining = unspecified;
      for (const variant of updated) { if (!remaining) break; if (variant.active === false) continue; const used = Math.min(remaining, money(variant.stock_quantity)); variant.stock_quantity -= used; variant.stock = variant.stock_quantity; remaining -= used; }
      if (remaining > 0) fail(`Insufficient size stock for ${product.name}.`);
      return { ref: snap.ref, patch: { sizeVariants: updated, size_variants: updated, stock: updated.reduce((sum, v) => sum + (v.active === false ? 0 : money(v.stock_quantity)), 0) } };
    });
    if (couponRef && currentCoupon && usageRef && currentUsage) {
      const c = currentCoupon.data()!;
      const maxUses = money(c.usageLimit ?? c.usage_limit);
      const perCustomer = money(c.perCustomerLimit ?? c.per_customer_limit);
      if (maxUses && money(c.usedCount ?? c.usage_count) >= maxUses) fail('Coupon usage limit has been reached.');
      if (perCustomer && money(currentUsage.data()?.count) >= perCustomer) fail('You have already used this coupon the maximum number of times.');
    }
    for (const item of updates) tx.update(item.ref, { ...item.patch, updatedAt: new Date().toISOString() });
    tx.set(orderRef, base);
    if (couponRef && currentCoupon && usageRef && currentUsage) {
      const count = money(currentUsage.data()?.count) + 1; const usedCount = money(currentCoupon.data()?.usedCount ?? currentCoupon.data()?.usage_count) + 1;
      tx.update(couponRef, { usedCount, usage_count: usedCount });
      tx.set(usageRef, { count, uid, couponId, lastOrderId: orderId, updatedAt: new Date().toISOString() }, { merge: true });
    }
  });
  if (concurrentOrder) {
    const previous = concurrentOrder as FirebaseFirestore.DocumentData;
    return { orderId, paymentMethod: 'cod', total: previous.total, paymentStatus: previous.paymentStatus };
  }
  return { orderId, paymentMethod: 'cod', total, paymentStatus: 'cod_pending' };
}

export const createCodCheckout = onCall({ region: 'asia-south1', invoker: 'public' }, createCodCheckoutOrder);

type RazorpayOrder = { id: string; amount: number; currency: string };
type RazorpayPayment = { id: string; order_id: string; amount: number; currency: string; status: string };
async function razorpayApi<T>(path: string, method: 'GET' | 'POST', body?: object): Promise<T> {
  const key = razorpayKeyId.value();
  const secret = razorpayKeySecret.value();
  if (!key || !secret) throw new HttpsError('unavailable', 'Online payment is temporarily unavailable.');
  // Live keys are mandatory outside the local Functions emulator.
  if (!process.env.FUNCTIONS_EMULATOR && !key.startsWith('rzp_live_')) throw new HttpsError('unavailable', 'Online payment is temporarily unavailable.');
  let response: Response;
  try {
    response = await fetch(`https://api.razorpay.com/v1/${path}`, {
      method,
      headers: { Authorization: `Basic ${Buffer.from(`${key}:${secret}`).toString('base64')}`, 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    throw new HttpsError('unavailable', 'Payment service is unavailable. Please try again.');
  }
  if (!response.ok) throw new HttpsError('unavailable', 'Payment service could not complete the request. Please try again.');
  return await response.json() as T;
}

export const createRazorpayCheckout = onCall({
  region: 'asia-south1', invoker: 'public', cors: checkoutCors,
  secrets: [razorpayKeyId, razorpayKeySecret],
}, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in before checkout.');
  const uid = request.auth.uid;
  const customer = request.data?.customer || {};
  if (!/^\d{10}$/.test(String(customer.mobile || '')) || !/^\d{6}$/.test(String(customer.pincode || '')) ||
    !/^\S+@\S+\.\S+$/.test(String(customer.email || '')) || !customer.address || !customer.city || !customer.state || !customer.fullName) fail('Complete your delivery address and contact details.');
  const attemptId = String(request.data?.checkoutAttemptId || '');
  if (!/^[a-f0-9-]{36}$/i.test(attemptId)) fail('Invalid checkout attempt. Please retry.');
  const orderId = `VCM-RZP-${createHash('sha256').update(`${uid}:${attemptId}`).digest('hex').slice(0, 24).toUpperCase()}`;
  const orderRef = db.doc(`orders/${orderId}`);
  const fingerprint = createHash('sha256').update(JSON.stringify({
    customer, items: request.data?.items, shoppingMode: request.data?.shoppingMode,
    couponId: request.data?.couponId, couponCode: request.data?.couponCode,
  })).digest('hex');
  const current = await orderRef.get();
  if (current.exists) {
    const data = current.data()!;
    if (data.customerId !== uid || data.requestFingerprint !== fingerprint || data.paymentMethod !== 'razorpay') fail('This checkout attempt does not match your order.');
    if (data.paymentStatus === 'paid') fail('This order is already paid.');
    if (data.razorpayOrderId) return { orderId, razorpayOrderId: data.razorpayOrderId, amount: data.total * 100, currency: 'INR', keyId: razorpayKeyId.value() };
    throw new HttpsError('aborted', 'Payment is being prepared. Please start a new checkout attempt shortly.');
  }

  const cart = await priceCart(request.data?.items as CheckoutLine[], uid);
  const numberOfSets = cart.items.reduce((sum, item) => sum + (item.shoppingMode === 'wholesale' ? item.quantity : 0), 0);
  const deliveryFee = numberOfSets * 250;
  const couponId = String(request.data?.couponId || '');
  const couponCode = String(request.data?.couponCode || '').trim().toUpperCase();
  let discount = 0;
  if (couponId) {
    const couponSnap = await db.doc(`coupons/${couponId}`).get();
    if (!couponSnap.exists) fail('Coupon no longer exists.');
    discount = couponDiscount(couponSnap.data()!, cart, String(request.data?.shoppingMode || 'retail'), couponCode).discount;
    const coupon = couponSnap.data()!;
    const usage = (await db.doc(`couponUsages/${couponId}_${uid}`).get()).data();
    const limit = money(coupon.usageLimit ?? coupon.usage_limit);
    const perCustomer = money(coupon.perCustomerLimit ?? coupon.per_customer_limit);
    if ((limit && money(coupon.usedCount ?? coupon.usage_count) >= limit) || (perCustomer && money(usage?.count) >= perCustomer)) fail('Coupon usage limit has been reached.');
  }
  const total = cart.subtotal - discount + deliveryFee;
  if (!Number.isSafeInteger(total) || total < 1) fail('Invalid order total.');
  const groups = Object.values(cart.items.reduce((acc: Record<string, any>, item: any) => {
    const group = acc[item.shopId] || { shopId: item.shopId, shopName: item.shopName, items: [], subtotal: 0 };
    group.items.push(item); group.subtotal += item.total; acc[item.shopId] = group; return acc;
  }, {}));
  const base = {
    id: orderId, orderId, orderNumber: orderId, customerId: uid, requestFingerprint: fingerprint,
    customerName: String(customer.fullName), customerEmail: String(customer.email).toLowerCase(), customerMobile: String(customer.mobile),
    shippingAddress: customer, items: cart.items, shopGroups: groups, shopIds: [...new Set(cart.items.map((item) => item.shopId))],
    shoppingMode: request.data?.shoppingMode || 'retail', orderType: request.data?.shoppingMode || 'retail',
    subtotal: cart.subtotal, discount, couponCode, couponId: couponId || null,
    deliveryFee, deliveryCharge: deliveryFee, shippingCharge: deliveryFee, numberOfSets,
    currency: 'INR', total, totalAmount: total, paymentMethod: 'razorpay', paymentStatus: 'pending', orderStatus: 'pending',
    trackingNumber: '', estimatedDelivery: '', providerState: 'creating', providerStartedAt: Date.now(),
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  };
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(orderRef);
    if (snap.exists) {
      throw new HttpsError('aborted', 'Payment is being prepared. Please retry shortly.');
    } else tx.set(orderRef, base);
  });
  let providerOrder: RazorpayOrder;
  try {
    providerOrder = await razorpayApi<RazorpayOrder>('orders', 'POST', { amount: total * 100, currency: 'INR', receipt: orderId, notes: { vcmart_order_id: orderId } });
    if (!/^order_[A-Za-z0-9]+$/.test(providerOrder.id) || providerOrder.amount !== total * 100 || providerOrder.currency !== 'INR') throw new Error('Unexpected provider order response');
  } catch {
    await orderRef.update({ providerState: 'error', updatedAt: new Date().toISOString() });
    throw new HttpsError('unavailable', 'Online payment could not be started. Please try again.');
  }
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(orderRef);
    if (snap.data()?.razorpayOrderId) return;
    if (snap.data()?.requestFingerprint !== fingerprint) fail('Checkout changed. Please try again.');
    tx.update(orderRef, { razorpayOrderId: providerOrder.id, providerState: 'ready', updatedAt: new Date().toISOString() });
    tx.set(db.doc(`razorpayOrders/${providerOrder.id}`), { orderId, customerId: uid, createdAt: new Date().toISOString() });
  });
  const saved = (await orderRef.get()).data()!;
  return { orderId, razorpayOrderId: saved.razorpayOrderId, amount: saved.total * 100, currency: 'INR', keyId: razorpayKeyId.value() };
});

async function finalizeCapturedPayment(orderId: string, paymentId: string) {
  const orderRef = db.doc(`orders/${orderId}`);
  const snapshot = await orderRef.get();
  const order = snapshot.data();
  if (!order || order.paymentMethod !== 'razorpay' || !order.razorpayOrderId) fail('Online order was not found.');
  if (order.paymentStatus === 'paid') {
    if (order.razorpayPaymentId !== paymentId) fail('This order was paid with another payment.');
    return { orderId, paymentStatus: 'paid', fulfillmentReview: Boolean(order.fulfillmentReview) };
  }
  const payment = await razorpayApi<RazorpayPayment>(`payments/${encodeURIComponent(paymentId)}`, 'GET');
  if (payment.id !== paymentId || payment.order_id !== order.razorpayOrderId ||
      payment.amount !== order.total * 100 || payment.currency !== 'INR') fail('Payment does not match this order.');
  if (!paymentIsCapturedForOrder(payment, paymentId, order.razorpayOrderId, order.total)) return { orderId, paymentStatus: 'pending', fulfillmentReview: false };

  let result: { orderId: string; paymentStatus: string; fulfillmentReview: boolean } = { orderId, paymentStatus: 'pending', fulfillmentReview: false };
  await db.runTransaction(async (tx) => {
    const fresh = await tx.get(orderRef);
    const data = fresh.data();
    if (!data || data.razorpayOrderId !== payment.order_id || data.total * 100 !== payment.amount) fail('Payment does not match this order.');
    if (data.paymentStatus === 'paid') {
      if (data.razorpayPaymentId !== paymentId) fail('This order was paid with another payment.');
      result = { orderId, paymentStatus: 'paid', fulfillmentReview: Boolean(data.fulfillmentReview) };
      return;
    }
    const lines = data.items as Array<{ productId: string; pieces: number; selectedSize?: string }>;
    const byProduct = new Map<string, typeof lines>();
    for (const line of lines) byProduct.set(line.productId, [...(byProduct.get(line.productId) || []), line]);
    const refs = [...byProduct.keys()].map((id) => db.doc(`products/${id}`));
    const productSnaps = await Promise.all(refs.map((ref) => tx.get(ref)));
    const couponRef = data.couponId ? db.doc(`coupons/${data.couponId}`) : null;
    const usageRef = data.couponId ? db.doc(`couponUsages/${data.couponId}_${data.customerId}`) : null;
    const couponSnap = couponRef ? await tx.get(couponRef) : null;
    const usageSnap = usageRef ? await tx.get(usageRef) : null;
    let fulfillmentReview = false;
    const updates: Array<{ ref: DocumentReference; patch: Record<string, unknown> }> = [];
    for (let i = 0; i < refs.length; i++) {
      const product = productSnaps[i].data();
      const productLines = byProduct.get(refs[i].id)!;
      const pieces = productLines.reduce((sum, line) => sum + money(line.pieces), 0);
      if (!product || product.status !== 'active' || money(product.stock) < pieces) { fulfillmentReview = true; continue; }
      const variants: any[] = product.sizeVariants || product.size_variants || [];
      if (!variants.length) {
        updates.push({ ref: refs[i], patch: { stock: money(product.stock) - pieces } });
        continue;
      }
      const demand = new Map<string, number>();
      for (const line of productLines) if (line.selectedSize) demand.set(line.selectedSize.toLowerCase(), (demand.get(line.selectedSize.toLowerCase()) || 0) + money(line.pieces));
      let remaining = pieces - [...demand.values()].reduce((a, b) => a + b, 0);
      const updated = variants.map((variant) => {
        const key = String(variant.size).toLowerCase();
        const requested = demand.get(key) || 0;
        const available = money(variant.stock_quantity ?? variant.stock);
        if (requested > available || (requested && variant.active === false)) fulfillmentReview = true;
        demand.delete(key);
        const stock = Math.max(0, available - requested);
        return { ...variant, stock_quantity: stock, stock };
      });
      if (demand.size) fulfillmentReview = true;
      if (!fulfillmentReview) for (const variant of updated) {
        if (!remaining) break;
        if (variant.active === false) continue;
        const used = Math.min(remaining, money(variant.stock_quantity));
        variant.stock_quantity -= used; variant.stock = variant.stock_quantity; remaining -= used;
      }
      if (remaining > 0) fulfillmentReview = true;
      if (!fulfillmentReview) updates.push({ ref: refs[i], patch: { sizeVariants: updated, size_variants: updated, stock: updated.reduce((sum, variant) => sum + (variant.active === false ? 0 : money(variant.stock_quantity)), 0) } });
    }
    // Captured funds must be recorded even if stock changed after payment initiation.
    // Such orders are flagged for an admin to fulfil or refund; stock is never made negative.
    if (!fulfillmentReview) for (const update of updates) tx.update(update.ref, { ...update.patch, updatedAt: new Date().toISOString() });
    tx.update(orderRef, {
      paymentStatus: 'paid', razorpayPaymentId: paymentId, paidAt: new Date().toISOString(),
      orderStatus: 'confirmed',
      fulfillmentReview, updatedAt: new Date().toISOString(),
    });
    if (couponRef && usageRef && couponSnap?.exists) {
      const usedCount = money(couponSnap.data()?.usedCount ?? couponSnap.data()?.usage_count) + 1;
      tx.update(couponRef, { usedCount, usage_count: usedCount });
      tx.set(usageRef, { count: money(usageSnap?.data()?.count) + 1, uid: data.customerId, couponId: data.couponId, lastOrderId: orderId, updatedAt: new Date().toISOString() }, { merge: true });
    }
    result = { orderId, paymentStatus: 'paid', fulfillmentReview };
  });
  return result;
}

export const verifyRazorpayPayment = onCall({
  region: 'asia-south1', invoker: 'public', cors: checkoutCors,
  secrets: [razorpayKeyId, razorpayKeySecret],
}, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in to verify payment.');
  const { orderId, razorpay_order_id: providerOrderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = request.data || {};
  if (typeof orderId !== 'string' || !/^VCM-RZP-[A-F0-9]{24}$/.test(orderId) ||
      typeof providerOrderId !== 'string' || !/^order_[A-Za-z0-9]+$/.test(providerOrderId) ||
      typeof paymentId !== 'string' || !/^pay_[A-Za-z0-9]+$/.test(paymentId) || typeof signature !== 'string') fail('Invalid payment response.');
  const order = (await db.doc(`orders/${orderId}`).get()).data();
  if (!order || order.customerId !== request.auth.uid || order.paymentMethod !== 'razorpay' || order.razorpayOrderId !== providerOrderId) fail('Payment does not match this order.');
  if (!verifyCheckoutSignature(order.razorpayOrderId, paymentId, signature, razorpayKeySecret.value())) throw new HttpsError('permission-denied', 'Payment verification failed.');
  return await finalizeCapturedPayment(orderId, paymentId);
});

export const markRazorpayCheckoutFailed = onCall({ region: 'asia-south1', invoker: 'public', cors: checkoutCors }, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in to update payment.');
  const orderId = String(request.data?.orderId || '');
  if (!/^VCM-RZP-[A-F0-9]{24}$/.test(orderId)) fail('Invalid order.');
  const ref = db.doc(`orders/${orderId}`);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists || snap.data()?.customerId !== request.auth?.uid || snap.data()?.paymentMethod !== 'razorpay') fail('Order was not found.');
    if (snap.data()?.paymentStatus !== 'paid') tx.update(ref, { paymentStatus: 'failed', updatedAt: new Date().toISOString() });
  });
  return { success: true };
});

export const razorpayPaymentWebhook = onRequest({
  region: 'asia-south1', invoker: 'public', cors: false,
  secrets: [razorpayKeyId, razorpayKeySecret, razorpayWebhookSecret],
}, async (request, response) => {
  if (request.method !== 'POST') { response.status(405).send('Method not allowed'); return; }
  const signature = String(request.header('x-razorpay-signature') || '');
  if (!verifyWebhookSignature(request.rawBody, signature, razorpayWebhookSecret.value())) { response.status(401).send('Invalid signature'); return; }
  if (request.body?.event !== 'payment.captured') { response.status(200).send('Ignored'); return; }
  const paymentId = String(request.body?.payload?.payment?.entity?.id || '');
  const providerOrderId = String(request.body?.payload?.payment?.entity?.order_id || '');
  if (!/^pay_[A-Za-z0-9]+$/.test(paymentId) || !/^order_[A-Za-z0-9]+$/.test(providerOrderId)) { response.status(400).send('Invalid payment'); return; }
  const mapping = (await db.doc(`razorpayOrders/${providerOrderId}`).get()).data();
  if (!mapping?.orderId) { response.status(404).send('Order not ready'); return; }
  try {
    const result = await finalizeCapturedPayment(String(mapping.orderId), paymentId);
    if (result.paymentStatus !== 'paid') { response.status(503).send('Retry later'); return; }
    response.status(200).send('OK');
  } catch {
    response.status(503).send('Retry later');
  }
});

export const updateOrderStatus = onCall({ region: 'asia-south1', invoker: 'public' }, async (request) => {
  if (!(await admin(request.auth?.uid))) throw new HttpsError('permission-denied','Admin access required.');
  const { orderId, orderStatus, trackingNumber } = request.data || {};
  const allowed = ['pending','confirmed','processing','packed','shipped','out_for_delivery','delivered','cancelled','returned'];
  if (!allowed.includes(orderStatus)) fail('Invalid order status.');
  if (typeof orderId !== 'string' || !orderId) fail('An order ID is required.');
  const existing = (await db.doc(`orders/${orderId}`).get()).data();
  if (!existing) fail('Order was not found.');
  if (existing.paymentMethod === 'razorpay' && existing.paymentStatus !== 'paid' && orderStatus !== 'cancelled') fail('Online payment must be captured before this order status can change.');
  const patch: Record<string, unknown> = { orderStatus, updatedAt: new Date().toISOString() };
  if (trackingNumber !== undefined) {
    if (typeof trackingNumber !== 'string' || trackingNumber.length > 100) fail('Invalid tracking number.');
    patch.trackingNumber = trackingNumber;
  }
  await db.doc(`orders/${orderId}`).update(patch);
  return { success: true };
});
