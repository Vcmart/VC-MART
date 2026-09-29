const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createHmac } = require('node:crypto');
const { verifyCheckoutSignature, verifyWebhookSignature, paymentIsCapturedForOrder } = require('../lib/paymentSecurity.js');

test('checkout signature requires the stored order ID, payment ID and secret', () => {
  const signature = createHmac('sha256', 'server-only-secret').update('order_A|pay_A').digest('hex');
  assert.equal(verifyCheckoutSignature('order_A', 'pay_A', signature, 'server-only-secret'), true);
  assert.equal(verifyCheckoutSignature('order_B', 'pay_A', signature, 'server-only-secret'), false);
  assert.equal(verifyCheckoutSignature('order_A', 'pay_B', signature, 'server-only-secret'), false);
  assert.equal(verifyCheckoutSignature('order_A', 'pay_A', 'invalid', 'server-only-secret'), false);
});

test('webhook signature verifies the exact raw bytes', () => {
  const raw = Buffer.from('{"event":"payment.captured"}');
  const signature = createHmac('sha256', 'webhook-secret').update(raw).digest('hex');
  assert.equal(verifyWebhookSignature(raw, signature, 'webhook-secret'), true);
  assert.equal(verifyWebhookSignature(Buffer.from('{"event":"payment.failed"}'), signature, 'webhook-secret'), false);
});

test('only an exact captured INR payment matches the order', () => {
  const payment = { id: 'pay_A', order_id: 'order_A', amount: 99900, currency: 'INR', status: 'captured' };
  assert.equal(paymentIsCapturedForOrder(payment, 'pay_A', 'order_A', 999), true);
  assert.equal(paymentIsCapturedForOrder({ ...payment, status: 'authorized' }, 'pay_A', 'order_A', 999), false);
  assert.equal(paymentIsCapturedForOrder({ ...payment, amount: 99800 }, 'pay_A', 'order_A', 999), false);
  assert.equal(paymentIsCapturedForOrder({ ...payment, order_id: 'order_B' }, 'pay_A', 'order_A', 999), false);
});
