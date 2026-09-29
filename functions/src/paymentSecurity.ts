import { createHmac, timingSafeEqual } from 'node:crypto';

function matchesHmac(payload: string | Buffer, signature: string, secret: string): boolean {
  if (!/^[a-f0-9]{64}$/i.test(signature) || !secret) return false;
  const expected = createHmac('sha256', secret).update(payload).digest();
  return timingSafeEqual(expected, Buffer.from(signature, 'hex'));
}

export function verifyCheckoutSignature(providerOrderId: string, paymentId: string, signature: string, keySecret: string): boolean {
  return matchesHmac(`${providerOrderId}|${paymentId}`, signature, keySecret);
}

export function verifyWebhookSignature(rawBody: Buffer, signature: string, webhookSecret: string): boolean {
  return matchesHmac(rawBody, signature, webhookSecret);
}

export function paymentIsCapturedForOrder(
  payment: { id: string; order_id: string; amount: number; currency: string; status: string },
  paymentId: string, providerOrderId: string, totalRupees: number,
): boolean {
  return payment.id === paymentId && payment.order_id === providerOrderId &&
    payment.amount === totalRupees * 100 && payment.currency === 'INR' && payment.status === 'captured';
}
