const { test } = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');

const records = new Map([['products/sample-product', {
  status: 'active', shopId: 'vinayak-collection', name: 'Sample product',
  stock: 4, salePrice: 150, images: [],
}]]);
const ref = (path) => ({
  path,
  id: path.split('/').at(-1),
  get: async () => snapshot(path),
});
const snapshot = (path) => ({
  ref: ref(path), exists: records.has(path), id: path.split('/').at(-1),
  data: () => records.get(path),
});
const db = {
  doc: ref,
  getAll: async (...refs) => refs.map((item) => snapshot(item.path)),
  runTransaction: async (callback) => callback({
    get: async (item) => snapshot(item.path),
    update: (item, patch) => records.set(item.path, { ...records.get(item.path), ...patch }),
    set: (item, data) => records.set(item.path, data),
  }),
};
class HttpsError extends Error {
  constructor(code, message) { super(message); this.code = code; }
}
const originalLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (request === 'firebase-admin/app') return { initializeApp: () => undefined };
  if (request === 'firebase-admin/firestore') return { getFirestore: () => db };
  if (request === 'firebase-functions/v2/https') return { HttpsError, onCall: (_options, handler) => handler, onRequest: (_options, handler) => handler };
  if (request === 'firebase-functions/params') return { defineSecret: () => ({ value: () => '' }) };
  return originalLoad(request, parent, isMain);
};
const { createCodCheckout } = require('../lib/index.js');
Module._load = originalLoad;

const request = {
  auth: { uid: 'test-customer' },
  data: {
    customer: { fullName: 'Test Customer', mobile: '9876543210', email: 'test@example.com', address: 'Test address', city: 'Test City', state: 'Uttar Pradesh', pincode: '123456' },
    paymentMethod: 'cod', shoppingMode: 'retail', couponId: '', couponCode: '',
    items: [{ productId: 'sample-product', quantity: 1, shoppingMode: 'retail' }],
    checkoutAttemptId: '11111111-1111-4111-8111-111111111111',
  },
};

test('valid COD checkout creates one pending order and a retry is idempotent', async () => {
  const first = await createCodCheckout(request);
  const saved = records.get(`orders/${first.orderId}`);
  assert.equal(first.paymentMethod, 'cod');
  assert.equal(first.paymentStatus, 'pending');
  assert.equal(saved.paymentStatus, 'pending');
  assert.equal(saved.orderStatus, 'pending');
  assert.equal(saved.total, 150);
  assert.equal(records.get('products/sample-product').stock, 3);

  const retry = await createCodCheckout(request);
  assert.deepEqual(retry, first);
  assert.equal(records.get('products/sample-product').stock, 3);
  assert.equal([...records.keys()].filter((key) => key.startsWith('orders/')).length, 1);
});

test('COD checkout requires Firebase Authentication', async () => {
  await assert.rejects(createCodCheckout({ ...request, auth: undefined }), { code: 'unauthenticated' });
});
