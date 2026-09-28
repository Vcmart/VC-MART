import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import type { DocumentReference } from 'firebase-admin/firestore';
import { defineSecret } from 'firebase-functions/params';
import { HttpsError, onCall, type CallableRequest } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import Razorpay from 'razorpay';
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

initializeApp();
const db = getFirestore();
const razorpayKeyId = defineSecret('RAZORPAY_KEY_ID');
const razorpaySecret = defineSecret('RAZORPAY_KEY_SECRET');
const admin = async (uid?: string) => Boolean(uid && (await db.doc(`adminUsers/${uid}`).get()).data()?.active === true);
const money = (n: unknown) => Math.max(0, Math.round(Number(n) || 0));

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
      amount = money(p.salePrice ?? p.retailPrice ?? p.retail_price ?? p.price);
      if (!amount) fail(`${p.name} has invalid retail pricing.`);
      const variants: any[] = p.sizeVariants || p.size_variants || [];
      if (line.selectedSize && variants.length) {
        const variant = variants.find((v) => String(v.size).toLowerCase() === line.selectedSize!.toLowerCase() && v.active !== false);
        if (!variant || money(variant.stock_quantity ?? variant.stock) < qty) fail(`Insufficient stock for ${p.name} in size ${line.selectedSize}.`);
      } else if (variants.length) fail(`Choose a size for ${p.name}.`);
      else if (money(p.stock) < qty) fail(`Insufficient stock for ${p.name}.`);
    }
    subtotal += amount * qty;
    return { productId: snap.id, shopId: p.shopId, shopName: p.shopName || '', name: p.name, image: p.images?.[0] || p.image || '', quantity: qty, pieces, unitPrice: amount, price: amount, total: amount * qty, shoppingMode: mode, selectedSize: line.selectedSize || '', selectedColor: line.selectedColor || '', setSize: mode === 'wholesale' ? pieces / qty : undefined, selectedVariants: line.selectedVariants || {}, stockAtPurchase: money(p.stock) };
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

async function createCheckoutOrder(request: CallableRequest, codOnly = false) {
  if (!request.auth) throw new HttpsError('unauthenticated','Sign in before checkout.');
  const uid = request.auth.uid;
  const customer = request.data?.customer || {};
  if (!/^\d{10}$/.test(String(customer.mobile || '')) || !/^\d{6}$/.test(String(customer.pincode || '')) || !/^\S+@\S+\.\S+$/.test(String(customer.email || '')) || !customer.address || !customer.city || !customer.state || !customer.fullName) fail('Complete and verify your address, email, mobile, city, state and PIN code.');
  const method = request.data?.paymentMethod === 'cod' ? 'cod' : 'razorpay';
  if (codOnly && method !== 'cod') fail('Choose Cash on Delivery for this checkout.');
  const attemptId = String(request.data?.checkoutAttemptId || '');
  if (attemptId && !/^[a-f0-9-]{36}$/i.test(attemptId)) fail('Invalid checkout attempt. Please retry.');
  const fingerprint = createHash('sha256').update(JSON.stringify({ customer, items: request.data?.items, paymentMethod: method, shoppingMode: request.data?.shoppingMode, couponId: request.data?.couponId, couponCode: request.data?.couponCode })).digest('hex');
  const orderId = attemptId
    ? `VCM-${createHash('sha256').update(`${uid}:${attemptId}`).digest('hex').slice(0, 24).toUpperCase()}`
    : `VCM-${db.collection('orders').doc().id}`;
  const orderRef = db.doc(`orders/${orderId}`);
  const existingOrder = attemptId ? await orderRef.get() : null;
  if (existingOrder?.exists) {
    const previous = existingOrder.data()!;
    if (previous.customerId !== uid || previous.requestFingerprint !== fingerprint) fail('This checkout attempt does not match your order.');
    return { orderId, paymentMethod: previous.paymentMethod, total: previous.total, paymentStatus: previous.paymentStatus, razorpayOrderId: previous.razorpayOrderId, keyId: previous.paymentMethod === 'razorpay' ? razorpayKeyId.value() : undefined };
  }
  const cart = await priceCart(request.data?.items, uid);
  const settings = (await db.doc('settings/store').get()).data() || {};
  const freeThreshold = money(settings.freeDeliveryThreshold ?? 499);
  const deliveryFee = cart.subtotal >= freeThreshold ? 0 : money(settings.standardDeliveryFee ?? 49);
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
  const base = { orderId, id: orderId, orderNumber: orderId, customerId: uid, requestFingerprint: fingerprint, customerName: String(customer.fullName), customerEmail: String(customer.email).toLowerCase(), customerMobile: String(customer.mobile), shippingAddress: customer, items: cart.items, shopGroups: groups, shopIds: [...new Set(cart.items.map((item: any) => item.shopId))], shoppingMode: request.data?.shoppingMode || 'retail', orderType: request.data?.shoppingMode || 'retail', subtotal: cart.subtotal, discount, couponCode: request.data?.couponCode || '', couponId: couponId || null, deliveryFee, deliveryCharge: deliveryFee, total, totalAmount: total, paymentMethod: method, paymentStatus: method === 'cod' ? 'cod_pending' : 'pending', orderStatus: 'pending', trackingNumber: '', estimatedDelivery: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  let gatewayOrder: { id: string } | null = null;
  if (method === 'razorpay') {
    const client = new Razorpay({ key_id: razorpayKeyId.value(), key_secret: razorpaySecret.value() });
    gatewayOrder = await client.orders.create({ amount: total * 100, currency: 'INR', receipt: orderId, notes: { orderId, customerId: uid } });
  }
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
      if (!variants.length) return { ref: snap.ref, patch: { stock: money(product.stock) - pieces }, reservation: { productId: snap.id, pieces, variants: [] as Array<{size: string; quantity: number}> } };
      const demand = new Map<string, number>();
      for (const line of lines) if (line.selectedSize) demand.set(line.selectedSize.toLowerCase(), (demand.get(line.selectedSize.toLowerCase()) || 0) + money(line.pieces));
      const deductions: Array<{size: string; quantity: number}> = [];
      const unspecified = pieces - [...demand.values()].reduce((a, b) => a + b, 0);
      const updated = variants.map((variant) => {
        let stock = money(variant.stock_quantity ?? variant.stock);
        const selected = demand.get(String(variant.size).toLowerCase()) || 0;
        if (selected > stock || (selected && variant.active === false)) fail(`Insufficient stock for ${product.name} in size ${variant.size}.`);
        stock -= selected; demand.delete(String(variant.size).toLowerCase());
        if (selected) deductions.push({ size: String(variant.size), quantity: selected });
        return { ...variant, stock_quantity: stock, stock };
      });
      if (demand.size) fail(`Selected size is unavailable for ${product.name}.`);
      let remaining = unspecified;
      for (const variant of updated) { if (!remaining) break; if (variant.active === false) continue; const used = Math.min(remaining, money(variant.stock_quantity)); variant.stock_quantity -= used; variant.stock = variant.stock_quantity; remaining -= used; if (used) deductions.push({ size: String(variant.size), quantity: used }); }
      if (remaining > 0) fail(`Insufficient size stock for ${product.name}.`);
      return { ref: snap.ref, patch: { sizeVariants: updated, size_variants: updated, stock: updated.reduce((sum, v) => sum + (v.active === false ? 0 : money(v.stock_quantity)), 0) }, reservation: { productId: snap.id, pieces, variants: deductions } };
    });
    if (method === 'cod' && couponRef && currentCoupon && usageRef && currentUsage) {
      const c = currentCoupon.data()!;
      const maxUses = money(c.usageLimit ?? c.usage_limit);
      const perCustomer = money(c.perCustomerLimit ?? c.per_customer_limit);
      if (maxUses && money(c.usedCount ?? c.usage_count) >= maxUses) fail('Coupon usage limit has been reached.');
      if (perCustomer && money(currentUsage.data()?.count) >= perCustomer) fail('You have already used this coupon the maximum number of times.');
    }
    for (const item of updates) tx.update(item.ref, { ...item.patch, updatedAt: new Date().toISOString() });
    tx.set(orderRef, { ...base, stockReserved: method === 'razorpay', stockReservation: method === 'razorpay' ? updates.map((item) => item.reservation) : [], razorpayOrderId: gatewayOrder?.id || null, gatewayOrderId: gatewayOrder?.id || null });
    if (method === 'cod' && couponRef && currentCoupon && usageRef && currentUsage) {
      const count = money(currentUsage.data()?.count) + 1; const usedCount = money(currentCoupon.data()?.usedCount ?? currentCoupon.data()?.usage_count) + 1;
      tx.update(couponRef, { usedCount, usage_count: usedCount });
      tx.set(usageRef, { count, uid, couponId, lastOrderId: orderId, updatedAt: new Date().toISOString() }, { merge: true });
    }
  });
  if (concurrentOrder) {
    const previous = concurrentOrder as FirebaseFirestore.DocumentData;
    return { orderId, paymentMethod: previous.paymentMethod, total: previous.total, paymentStatus: previous.paymentStatus, razorpayOrderId: previous.razorpayOrderId, keyId: previous.paymentMethod === 'razorpay' ? razorpayKeyId.value() : undefined };
  }
  return method === 'cod'
    ? { orderId, paymentMethod: 'cod', total, paymentStatus: 'cod_pending' }
    : { orderId, paymentMethod: 'razorpay', total, paymentStatus: 'pending', razorpayOrderId: gatewayOrder!.id, keyId: razorpayKeyId.value() };
}

// COD has no Razorpay Secret Manager binding, so it remains available even when
// online payment credentials are unavailable.
export const createCodCheckout = onCall({ region: 'asia-south1', invoker: 'public' }, (request) => createCheckoutOrder(request, true));
export const createCheckout = onCall({ region: 'asia-south1', invoker: 'public', secrets: [razorpayKeyId, razorpaySecret] }, (request) => createCheckoutOrder(request));

export const verifyRazorpayPayment = onCall({ region: 'asia-south1', invoker: 'public', secrets: [razorpayKeyId, razorpaySecret] }, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated','Sign in required.');
  const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = request.data || {};
  const orderRef = db.doc(`orders/${String(orderId || '')}`);
  const orderSnap = await orderRef.get();
  if (!orderSnap.exists || orderSnap.data()?.customerId !== request.auth.uid) throw new HttpsError('permission-denied','Order not found.');
  const order = orderSnap.data()!;
  if (order.paymentMethod !== 'razorpay' || order.razorpayOrderId !== razorpayOrderId || typeof razorpayPaymentId !== 'string' || !razorpayPaymentId || typeof razorpaySignature !== 'string' || !/^[a-f0-9]{64}$/i.test(razorpaySignature)) fail('Payment details do not match this order.');
  const expected = createHmac('sha256', razorpaySecret.value()).update(`${razorpayOrderId}|${razorpayPaymentId}`).digest();
  const received = Buffer.from(razorpaySignature, 'hex');
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) fail('Payment verification failed.');
  if (order.paymentStatus === 'paid') return { verified: true, orderId };
  const gateway = new Razorpay({ key_id: razorpayKeyId.value(), key_secret: razorpaySecret.value() });
  let payment: { order_id: string; status: string; amount: number | string; currency: string };
  try {
    payment = await gateway.payments.fetch(razorpayPaymentId);
  } catch {
    fail('Could not confirm payment with Razorpay. Please retry shortly.');
  }
  if (payment.order_id !== razorpayOrderId || payment.status !== 'captured' || Number(payment.amount) !== money(order.total) * 100 || payment.currency !== 'INR') fail('Payment is not captured for this order and amount yet. Please retry shortly.');
  await db.runTransaction(async (tx) => {
    const currentOrder = await tx.get(orderRef);
    const currentData = currentOrder.data();
    if (currentData?.paymentStatus === 'paid') return;
    if (currentData?.paymentStatus !== 'pending' || currentData.razorpayOrderId !== razorpayOrderId || money(currentData.total) !== money(order.total)) fail('Order is no longer available for payment confirmation.');
    const couponRef = order.couponId ? db.doc(`coupons/${order.couponId}`) : null;
    const usageRef = order.couponId ? db.doc(`couponUsages/${order.couponId}_${request.auth!.uid}`) : null;
    const couponSnap = couponRef ? await tx.get(couponRef) : null;
    const usageSnap = usageRef ? await tx.get(usageRef) : null;
    if (currentData.stockReserved !== true) fail('Stock reservation expired. Contact support before retrying payment.');
    if (couponSnap?.exists && usageSnap) {
      const c = couponSnap.data()!;
      const usedCount = money(c.usedCount ?? c.usage_count) + 1; const count = money(usageSnap.data()?.count) + 1;
      tx.update(couponRef!, { usedCount, usage_count: usedCount });
      tx.set(usageRef!, { count, uid: request.auth!.uid, couponId: order.couponId, lastOrderId: orderId, updatedAt: new Date().toISOString() }, { merge: true });
    }
    tx.update(orderRef, { paymentStatus: 'paid', orderStatus: 'confirmed', stockReserved: false, razorpayPaymentId, updatedAt: new Date().toISOString(), paidAt: FieldValue.serverTimestamp() });
  });
  return { verified: true, orderId };
});

// Release abandoned online-checkout stock holds, and reconcile a captured payment
// if the customer closed the browser before the client could send its signature.
export const reconcileExpiredCheckouts = onSchedule({ schedule: 'every 15 minutes', region: 'asia-south1', secrets: [razorpayKeyId, razorpaySecret] }, async () => {
  const cutoff = new Date(Date.now() - 30 * 60 * 1000).toISOString();
  const stale = await db.collection('orders').where('stockReserved', '==', true).where('createdAt', '<=', cutoff).limit(100).get();
  const gateway = new Razorpay({ key_id: razorpayKeyId.value(), key_secret: razorpaySecret.value() });
  for (const orderSnap of stale.docs) {
    const order = orderSnap.data();
    if (!order.razorpayOrderId) continue;
    try {
      const paymentResult = await (gateway.orders as any).fetchPayments(order.razorpayOrderId);
      const payments: any[] = paymentResult?.items || [];
      const captured = payments.filter((payment) => payment.status === 'captured');
      const capturedPaise = captured.reduce((sum, payment) => sum + money(payment.amount), 0);
      const fullCapturedPayment = captured.find((payment) => money(payment.amount) === money(order.total) * 100);
      if (fullCapturedPayment && capturedPaise >= money(order.total) * 100) {
        await db.runTransaction(async (tx) => {
          const current = await tx.get(orderSnap.ref);
          if (!current.exists || current.data()?.stockReserved !== true) return;
          const couponId = current.data()?.couponId;
          const couponRef = couponId ? db.doc(`coupons/${couponId}`) : null;
          const usageRef = couponId ? db.doc(`couponUsages/${couponId}_${current.data()?.customerId}`) : null;
          const coupon = couponRef ? await tx.get(couponRef) : null;
          const usage = usageRef ? await tx.get(usageRef) : null;
          tx.update(orderSnap.ref, { stockReserved: false, paymentStatus: 'paid', orderStatus: 'confirmed', razorpayPaymentId: fullCapturedPayment.id, updatedAt: new Date().toISOString(), paidAt: FieldValue.serverTimestamp() });
          if (coupon?.exists && usageRef && usage) {
            const usedCount = money(coupon.data()?.usedCount ?? coupon.data()?.usage_count) + 1;
            tx.update(couponRef!, { usedCount, usage_count: usedCount });
            tx.set(usageRef, { uid: current.data()?.customerId, couponId, count: money(usage.data()?.count) + 1, lastOrderId: order.orderId, updatedAt: new Date().toISOString() }, { merge: true });
          }
        });
        continue;
      }
      if (payments.some((payment) => payment.status === 'captured' || payment.status === 'authorized')) continue;

      await db.runTransaction(async (tx) => {
        const current = await tx.get(orderSnap.ref);
        const currentData = current.data();
        if (!currentData || currentData.stockReserved !== true || currentData.paymentStatus === 'paid') return;
        const reservations: any[] = currentData.stockReservation || [];
        const productRefs = reservations.map((entry) => db.doc(`products/${entry.productId}`));
        const products = await Promise.all(productRefs.map((ref) => tx.get(ref)));
        const restores = products.map((snap, index) => {
          const reservation = reservations[index];
          const data = snap.data();
          if (!data) return null;
          const variants: any[] = data.sizeVariants || data.size_variants || [];
          if (!variants.length || !reservation.variants?.length) return { ref: snap.ref, patch: { stock: money(data.stock) + money(reservation.pieces) } };
          const restored = variants.map((variant) => {
            const addition = reservation.variants.filter((part: any) => String(part.size).toLowerCase() === String(variant.size).toLowerCase()).reduce((sum: number, part: any) => sum + money(part.quantity), 0);
            const stock = money(variant.stock_quantity ?? variant.stock) + addition;
            return { ...variant, stock_quantity: stock, stock };
          });
          return { ref: snap.ref, patch: { sizeVariants: restored, size_variants: restored, stock: restored.reduce((sum, variant) => sum + (variant.active === false ? 0 : money(variant.stock_quantity)), 0) } };
        }).filter((item): item is NonNullable<typeof item> => Boolean(item));
        for (const item of restores) tx.update(item.ref, { ...item.patch, updatedAt: new Date().toISOString() });
        tx.update(orderSnap.ref, { stockReserved: false, paymentStatus: 'failed', orderStatus: 'cancelled', updatedAt: new Date().toISOString() });
      });
    } catch (error) {
      console.error(`Checkout reconciliation failed for ${order.orderId || orderSnap.id}`, error);
    }
  }
});

export const updateOrderStatus = onCall({ region: 'asia-south1', invoker: 'public' }, async (request) => {
  if (!(await admin(request.auth?.uid))) throw new HttpsError('permission-denied','Admin access required.');
  const { orderId, orderStatus, trackingNumber } = request.data || {};
  const allowed = ['pending','confirmed','processing','packed','shipped','out_for_delivery','delivered','cancelled','returned'];
  if (!allowed.includes(orderStatus)) fail('Invalid order status.');
  if (typeof orderId !== 'string' || !orderId) fail('An order ID is required.');
  const patch: Record<string, unknown> = { orderStatus, updatedAt: new Date().toISOString() };
  if (trackingNumber !== undefined) {
    if (typeof trackingNumber !== 'string' || trackingNumber.length > 100) fail('Invalid tracking number.');
    patch.trackingNumber = trackingNumber;
  }
  await db.doc(`orders/${orderId}`).update(patch);
  return { success: true };
});
