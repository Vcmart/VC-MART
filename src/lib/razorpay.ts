/**
 * Razorpay Payment Gateway Integration
 * Supports UPI (Google Pay, PhonePe, Paytm, BHIM), Credit & Debit Cards, NetBanking, and Wallets.
 * Razorpay orders and payment signature verification are processed securely on the backend.
 * The Razorpay Secret Key is NEVER exposed in the frontend.
 */

import { getInitialLogoSync } from '../utils/branding';
import { httpsCallable, getFunctions } from 'firebase/functions';
import { firebaseApp } from './firebase';

// Global type augmentation for window.Razorpay
declare global {
  interface Window {
    Razorpay?: any;
  }
}

export const RAZORPAY_CONFIG = {
  storeName: 'VC MART',
  brandColor: '#965215',
  currency: 'INR',
};

/**
 * Ensures Razorpay Checkout script (checkout.js) is loaded into the page
 */
export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false);
      return;
    }

    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      console.log('✅ Razorpay Checkout SDK loaded successfully');
      resolve(true);
    };
    script.onerror = () => {
      console.warn('⚠️ Could not load Razorpay SDK from checkout.razorpay.com');
      resolve(false);
    };
    document.body.appendChild(script);
  });
}

export interface RazorpayCheckoutParams {
  orderNumber: string;
  amount: number; // in Rupees (e.g. 1499)
  customer: {
    fullName: string;
    email: string;
    mobile: string;
    address?: string;
    city?: string;
    pincode?: string;
  };
  backendOrder?: { orderId: string; keyId: string; amount: number };
  firebaseOrderId?: string;
  onSuccess: (response: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => void;
  onDismiss?: () => void;
  onError?: (error: any) => void;
}

/**
 * Validates the payment signature securely on the backend.
 * Strictest verification: NEVER marks payment as authentic unless cryptographic signature passes.
 */
async function verifyBackendRazorpayPayment(payload: {
  orderId: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}): Promise<boolean> {
  if (!firebaseApp) throw new Error('Firebase is not configured.');
  const verify = httpsCallable(getFunctions(firebaseApp, 'asia-south1'), 'verifyRazorpayPayment');
  const response = await verify(payload);
  return Boolean((response.data as { verified?: boolean }).verified);
}

/**
 * Launches the official Razorpay Live Checkout modal
 */
export async function initiateRazorpayPayment(params: RazorpayCheckoutParams): Promise<void> {
  const isLoaded = await loadRazorpayScript();

  if (!isLoaded || !window.Razorpay) {
    console.warn('Razorpay SDK unavailable or blocked. Please check your network or select Cash on Delivery.');
    if (params.onError) {
      params.onError(
        new Error('Razorpay Checkout SDK could not be loaded. Please ensure an active internet connection or choose Cash on Delivery (COD).')
      );
    }
    return;
  }

  let backendOrder: { orderId: string; keyId: string; amount: number };
  try { backendOrder = params.backendOrder || (() => { throw new Error("Payment must be initialized by the Firebase checkout function."); })(); }
  catch (err: any) { params.onError?.(err); return; }

  const cleanPhone = (params.customer.mobile || '').replace(/[^0-9]/g, '').slice(-10);
  const activeLogoUrl = getInitialLogoSync();

  const options: any = {
    key: backendOrder.keyId,
    amount: backendOrder.amount,
    currency: 'INR',
    name: 'VC MART',
    description: `Order #${params.orderNumber} - Unified Shopping`,
    image: activeLogoUrl,
    order_id: backendOrder.orderId,
    prefill: {
      name: params.customer.fullName,
      email: params.customer.email,
      contact: cleanPhone ? `+91${cleanPhone}` : '',
    },
    notes: {
      order_number: params.orderNumber,
      city: params.customer.city || 'India',
      pincode: params.customer.pincode || '',
      merchant: 'Vinayak Collection & VC MART',
    },
    theme: {
      color: '#965215',
    },
    modal: {
      backdropclose: false,
      escape: true,
      handleback: true,
      confirm_close: true,
      ondismiss: () => {
        if (params.onDismiss) {
          params.onDismiss();
        }
      },
    },
    handler: async (response: any) => {
      console.log('Razorpay payment response received from gateway:', {
        payment_id: response.razorpay_payment_id,
        order_id: response.razorpay_order_id,
      });

      try {
        if (!response.razorpay_payment_id || !response.razorpay_signature) {
          throw new Error('Incomplete payment response from Razorpay gateway.');
        }

        const isValid = await verifyBackendRazorpayPayment({
          orderId: params.firebaseOrderId || params.orderNumber,
          razorpay_order_id: response.razorpay_order_id || backendOrder.orderId,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
        });

        if (!isValid) {
          throw new Error('Payment signature verification failed on the server. Your card/account was not debited, or is awaiting clearance.');
        }

        params.onSuccess({
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_order_id: response.razorpay_order_id || backendOrder.orderId,
          razorpay_signature: response.razorpay_signature,
        });
      } catch (err: any) {
        console.error('Server payment verification error:', err);
        if (params.onError) {
          params.onError(err);
        }
      }
    },
  };

  try {
    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', function (resp: any) {
      console.error('❌ Razorpay Payment Failed:', resp.error);
      if (params.onError) {
        params.onError(new Error(resp.error?.description || 'Payment was declined or failed at Razorpay gateway'));
      }
    });
    rzp.open();
  } catch (err: any) {
    console.error('Error opening Razorpay modal:', err);
    if (params.onError) {
      params.onError(err);
    }
  }
}
