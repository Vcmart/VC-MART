export type RazorpaySuccess = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

export type RazorpayCheckoutInstance = {
  open: () => void;
  on: (event: 'payment.failed', handler: () => void) => void;
};

type RazorpayConstructor = new (options: {
  key: string;
  amount: number;
  currency: 'INR';
  order_id: string;
  name: string;
  description: string;
  prefill: { name: string; email: string; contact: string };
  theme: { color: string };
  handler: (response: RazorpaySuccess) => void;
  modal: { ondismiss: () => void };
}) => RazorpayCheckoutInstance;

declare global {
  interface Window { Razorpay?: RazorpayConstructor }
}

let loading: Promise<RazorpayConstructor> | null = null;
export function loadRazorpayCheckout(): Promise<RazorpayConstructor> {
  if (window.Razorpay) return Promise.resolve(window.Razorpay);
  if (loading) return loading;
  const promise = new Promise<RazorpayConstructor>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => window.Razorpay ? resolve(window.Razorpay) : reject(new Error('Payment checkout could not load.'));
    script.onerror = () => reject(new Error('Payment checkout could not load.'));
    document.head.appendChild(script);
  });
  const ready = promise.catch((error) => { loading = null; throw error; });
  loading = ready;
  return ready;
}
