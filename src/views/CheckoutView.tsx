import React, { useState, useEffect, useRef } from 'react';
import { getCartItemPrice, WHOLESALE_DELIVERY_PER_SET } from '../utils/pricing';
import {
  ShieldCheck,
  Truck,
  Banknote,
  CheckCircle2,
  ChevronRight,
  ShoppingBag,
  ArrowRight,
  MessageCircle,
  Printer,
  Cloud,
  Lock,
  Loader2,
  AlertCircle,
  User,
  Tag,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { siteConfig } from '../config/siteConfig';
import { CustomerDetails, Order } from '../types';
import { requestCheckout, getOrderById, applyCouponSecure, createRazorpayCheckout, verifyRazorpayPayment, markRazorpayCheckoutFailed } from '../lib/firebaseRepository';
import { loadRazorpayCheckout, type RazorpaySuccess } from '../lib/razorpayCheckout';
import { Logo } from '../components/Logo';
import { safeStringArray } from '../utils/clothingSizes';

type CheckoutResult = { orderId: string; total: number; paymentMethod: 'cod'; paymentStatus: string };
type RazorpayStart = { orderId: string; razorpayOrderId: string; amount: number; currency: 'INR'; keyId: string };
type RazorpayVerify = { orderId: string; paymentStatus: 'paid' | 'pending'; fulfillmentReview: boolean };

export const CheckoutView: React.FC = () => {
  const {
    cart,
    cartSubtotal,
    cartDiscount,
    deliveryFee,
    cartTotal,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    clearCart,
    setCurrentView,
    shops,
    currentUser,
    openAuthModal,
    shoppingMode,
    isWholesaleEligibleForCheckout,
    wholesaleCartErrors,
  } = useStore();

  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const hasWholesaleItems = cart.some((item) => item?.product && (item.shoppingMode || shoppingMode) === 'wholesale');
  const hasRetailItems = cart.some((item) => item?.product && (item.shoppingMode || shoppingMode) === 'retail');

  const [customer, setCustomer] = useState<CustomerDetails>({
    fullName: '',
    phone: '',
    mobile: '',
    email: '',
    address: '',
    city: '',
    state: 'Uttar Pradesh',
    pincode: '',
  });

  // Prepopulate customer details from logged in user
  useEffect(() => {
    if (currentUser) {
      setCustomer((prev) => ({
        ...prev,
        fullName: prev.fullName || currentUser.fullName || '',
        email: currentUser.email || prev.email || '',
        mobile: currentUser.mobile || prev.mobile || '',
        phone: currentUser.mobile || prev.phone || '',
        address: prev.address || currentUser.address || '',
        city: prev.city || currentUser.city || '',
        pincode: prev.pincode || currentUser.pincode || '',
      }));
    }
  }, [currentUser]);

  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'razorpay'>('cod');
  const [pendingPayment, setPendingPayment] = useState<(RazorpaySuccess & { orderId: string }) | null>(null);
  const checkoutInFlight = useRef(false);
  const checkoutAttempt = useRef<{ fingerprint: string; id: string } | null>(null);

  // If cart is empty and no order placed
  if (cart.length === 0 && !placedOrder) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center py-12 px-4 bg-[#FAF7F2]">
        <div className="bg-white p-8 rounded-3xl border border-[#E8DEC8] text-center max-w-md shadow-xs">
          <ShoppingBag size={36} className="text-[#965215] mx-auto mb-3" />
          <h2 className="text-xl font-bold font-['Marcellus'] text-stone-900">
            Your Cart is Empty
          </h2>
          <p className="text-xs text-stone-500 mt-2">
            Please add items from Vinayak Collection, Kinshuk Spare Parts, or Khushi Communication before checking out.
          </p>
          <button
            onClick={() => setCurrentView('shop')}
            className="mt-6 px-6 py-2.5 bg-[#965215] text-white rounded-full text-xs font-bold uppercase tracking-wider hover:bg-[#7A3F0E] cursor-pointer"
          >
            BROWSE PRODUCTS
          </button>
        </div>
      </div>
    );
  }

  const validateForm = () => {
    const errors: Record<string, string> = {};
    const ph = (customer.phone || customer.mobile || '').trim();
    if (!customer.fullName.trim()) errors.fullName = 'Full name is required';
    if (!ph || !/^[6-9]\d{9}$/.test(ph.replace(/[^0-9]/g, ''))) {
      errors.phone = 'Valid 10-digit Indian mobile number is required';
    }
    if (!customer.email.trim() || !/^\S+@\S+\.\S+$/.test(customer.email)) {
      errors.email = 'Valid email address is required';
    }
    if (!customer.address.trim()) errors.address = 'Delivery address is required';
    if (!customer.city.trim()) errors.city = 'City is required';
    if (!customer.pincode.trim() || !/^\d{6}$/.test(customer.pincode.trim())) {
      errors.pincode = 'Valid 6-digit Indian PIN code is required';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (checkoutInFlight.current) return;

    // Enforce login before placing order
    if (!currentUser) {
      openAuthModal(
        'Please sign in or create an account to finalize and confirm your order.',
        'customer'
      );
      return;
    }

    // Enforce wholesale cart requirements
    if (!isWholesaleEligibleForCheckout) {
      setPaymentError(
        wholesaleCartErrors.length > 0
          ? `Wholesale requirements not met: ${wholesaleCartErrors.join('; ')}`
          : 'Wholesale orders must contain at least 1 complete set and have sufficient stock.'
      );
      return;
    }

    if (!validateForm()) return;

    const contactMobile = (customer.phone || customer.mobile || '').trim();
    const customerPayload = {
      ...customer,
      mobile: contactMobile,
      phone: contactMobile,
    };

    checkoutInFlight.current = true;
    setIsProcessingPayment(true);
    setPaymentError(null);

    const items = cart.map((item) => ({
      productId: item.productId || item.product.id,
      quantity: item.quantity,
      shoppingMode: item.shoppingMode || shoppingMode,
      selectedSize: item.selectedSize || '',
      selectedColor: item.selectedColor || '',
      selectedVariants: item.selectedVariants || {},
    }));
    const fingerprint = JSON.stringify({ uid: currentUser.id, customer: customerPayload, items, paymentMethod, shoppingMode, couponId: appliedCoupon?.id || '', couponCode: appliedCoupon?.code || '' });
    if (checkoutAttempt.current?.fingerprint !== fingerprint) {
      checkoutAttempt.current = { fingerprint, id: crypto.randomUUID() };
    }
    const finishProcessing = () => { checkoutInFlight.current = false; setIsProcessingPayment(false); };

    if (paymentMethod === 'razorpay') {
      let preparedOrderId = '';
      try {
        const callable = await createRazorpayCheckout({
          customer: customerPayload, shoppingMode, couponId: appliedCoupon?.id || '',
          couponCode: appliedCoupon?.code || '', items, checkoutAttemptId: checkoutAttempt.current.id,
        });
        const prepared = callable.data as RazorpayStart;
        preparedOrderId = prepared.orderId;
        if (!prepared.keyId || !prepared.razorpayOrderId || prepared.currency !== 'INR' || prepared.amount !== cartTotal * 100) {
          throw new Error('Payment details changed. Please refresh your cart and try again.');
        }
        const Razorpay = await loadRazorpayCheckout();
        let completed = false;
        const checkout = new Razorpay({
          key: prepared.keyId, amount: prepared.amount, currency: 'INR', order_id: prepared.razorpayOrderId,
          name: 'VC MART', description: 'VC MART order payment',
          prefill: { name: customerPayload.fullName, email: customerPayload.email, contact: customerPayload.mobile },
          theme: { color: '#965215' },
          handler: async (response) => {
            completed = true;
            const payload = { ...response, orderId: prepared.orderId };
            setPendingPayment(payload);
            try {
              const verified = (await verifyRazorpayPayment(payload)).data as RazorpayVerify;
              if (verified.paymentStatus !== 'paid') {
                setPaymentError('Payment is processing. Use Check Payment Status shortly; your cart is saved.');
                return;
              }
              const order = await getOrderById(prepared.orderId);
              if (!order) throw new Error('Order is not available yet.');
              checkoutAttempt.current = null;
              setPendingPayment(null);
              clearCart(); setPlacedOrder(order); window.scrollTo({ top: 0, behavior: 'smooth' });
            } catch {
              setPaymentError('Payment confirmation is pending. Please check its status before trying to pay again.');
            } finally { finishProcessing(); }
          },
          modal: { ondismiss: () => {
            if (completed) return;
            void markRazorpayCheckoutFailed(prepared.orderId).catch(() => undefined);
            setPaymentError('Payment was cancelled. No online payment was confirmed.');
            finishProcessing();
          } },
        });
        checkout.on('payment.failed', () => setPaymentError('Payment failed. Please retry in the payment window or close it to return to checkout.'));
        checkout.open();
        return;
      } catch {
        checkoutAttempt.current = null;
        if (preparedOrderId) void markRazorpayCheckoutFailed(preparedOrderId).catch(() => undefined);
        finishProcessing();
        setPaymentError('Online payment could not be started. Please try again or choose Cash on Delivery.');
        return;
      }
    }

    try {
      const callable = await requestCheckout({
        customer: customerPayload,
        paymentMethod: 'cod',
        shoppingMode,
        couponId: appliedCoupon?.id || '',
        couponCode: appliedCoupon?.code || '',
        items,
        checkoutAttemptId: checkoutAttempt.current.id,
      });
      const result = callable.data as CheckoutResult;
      const order = await getOrderById(result.orderId);
      if (!order) throw new Error('Order was created but could not be loaded.');
      checkoutAttempt.current = null;
      clearCart(); setPlacedOrder(order); finishProcessing(); window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      finishProcessing();
      setPaymentError('We could not place your Cash on Delivery order. Please try again.');
    }
  };

  // 1. Order Placed Success Screen
  if (placedOrder) {
    const ordNum = placedOrder.orderNumber || placedOrder.id;
    const ordTotal = placedOrder.totalAmount || placedOrder.total || 0;
    const custName =
      placedOrder.customerName ||
      placedOrder.shippingAddress?.fullName ||
      placedOrder.customer?.fullName ||
      'Customer';
    const custPhone =
      placedOrder.customerMobile ||
      placedOrder.shippingAddress?.mobile ||
      placedOrder.customer?.phone ||
      '';
    const custEmail =
      placedOrder.customerEmail ||
      placedOrder.shippingAddress?.email ||
      placedOrder.customer?.email ||
      '';
    const custAddr = placedOrder.shippingAddress || placedOrder.customer;

    const whatsappOrderUrl = `https://wa.me/${siteConfig.whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
      `Hello VC MART, I have placed order #${ordNum} for ₹${ordTotal}. Please confirm shipping updates.`
    )}`;

    return (
      <div className="bg-[#FAF7F2] min-h-screen py-8 sm:py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="bg-white rounded-3xl p-6 sm:p-10 border-2 border-emerald-200 shadow-md">
            {/* Success icon & title with official Logo */}
            <div className="text-center pb-6 border-b border-stone-100">
              <div className="flex justify-center mb-3">
                <Logo size="md" variant="full" />
              </div>
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 size={32} />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
                Order Placed Successfully!
              </span>
              <h1 className="text-2xl sm:text-3xl font-['Marcellus'] font-bold text-stone-900 mt-2">
                Thank you, {custName}!
              </h1>
              <p className="text-xs text-stone-500 mt-1">
                Your order <strong className="text-stone-900 font-mono">#{ordNum}</strong> has been received and sent to our warehouse for dispatch.
              </p>
              <div className="mt-2.5 flex items-center justify-center gap-2 flex-wrap">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-medium">
                  <Cloud size={13} className="text-emerald-600" />
                  <span>Saved & Synchronized to Cloud Database (Firebase)</span>
                </div>
              </div>
            </div>

            {/* Order Details & Summary */}
            <div className="py-6 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#FAF7F2] p-4 rounded-2xl border border-[#E8DEC8] text-xs">
                <div>
                  <span className="text-[10px] uppercase text-stone-400 font-bold block">Order No.</span>
                  <span className="font-mono font-bold text-stone-900">{ordNum}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-stone-400 font-bold block">Payment</span>
                  <span className="font-bold text-stone-900 uppercase">
                    {placedOrder.paymentMethod === 'cod'
                      ? 'Cash on Delivery (COD)'
                      : placedOrder.paymentMethod === 'razorpay' ? 'Online payment · Paid' : 'Previous online payment'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-stone-400 font-bold block">Tracking ID</span>
                  <span className="font-mono font-bold text-stone-900">{placedOrder.trackingNumber}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-stone-400 font-bold block">Total Amount</span>
                  <span className="font-extrabold text-[#7A3F0E]">₹{ordTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Delivery Address Box */}
              <div className="p-4 bg-stone-50 rounded-2xl text-xs text-stone-700">
                <h4 className="font-bold text-stone-900 mb-1">Shipping Destination:</h4>
                <p>{custAddr?.address}, {custAddr?.city}, {custAddr?.state} - {custAddr?.pincode}</p>
                <p className="text-[11px] text-stone-500 mt-0.5">Phone: +91 {custPhone} &bull; Email: {custEmail}</p>
              </div>

              {/* Ordered Items with Shop badges */}
              <div className="border border-stone-200 rounded-2xl p-4 divide-y divide-stone-100">
                <div className="flex items-center justify-between pb-2">
                  <h4 className="font-bold text-xs text-stone-900">Order Items ({placedOrder.items.length}):</h4>
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                    placedOrder.orderType === 'wholesale'
                      ? 'bg-blue-900 text-white'
                      : 'bg-amber-100 text-amber-900'
                  }`}>
                    {placedOrder.orderType === 'wholesale' ? 'WHOLESALE ORDER' : 'RETAIL ORDER'}
                  </span>
                </div>
                {placedOrder.items.map((item, idx) => {
                  const itemImg = item.image || item.product?.images?.[0] || '';
                  const itemName = item.name || item.product?.name || 'Product';
                  const isItemWholesale = item.orderType === 'wholesale' || item.shoppingMode === 'wholesale' || placedOrder.orderType === 'wholesale';
                  const itemPrice = Number(item.unitPrice ?? item.price ?? (isItemWholesale ? item.product?.wholesale_price ?? item.product?.wholesalePrice : item.product?.salePrice) ?? 0);
                  const itemSize = item.selectedSize || item.selectedVariants?.Size;
                  const itemColor = item.selectedColor || item.selectedVariants?.Color;
                  const rawColors = item.wholesaleColors || (item.product?.wholesale_mix_colors || item.product?.wholesaleMixColors);
                  const wholesaleColors = safeStringArray(rawColors);
                  const setSize = Number(item.setSize || item.product?.setSize || item.product?.set_size || wholesaleColors.length || 6);
                  const sets = Number(item.numberOfSets || item.quantity) || 1;
                  const pieces = Number(item.totalPieces || (sets * setSize)) || (sets * setSize);

                  return (
                    <div key={idx} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={item.colorImageUrl || itemImg}
                          alt=""
                          className="w-10 h-10 object-cover rounded-lg border border-stone-200 shrink-0"
                        />
                        <div>
                          <div className="flex items-center gap-1">
                            <span className="text-[9px] uppercase font-bold text-[#965215] bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                              {item.shopName || item.product?.categoryName}
                            </span>
                            {isItemWholesale && (
                              <span className="text-[9px] font-black uppercase text-blue-900 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                                MIX COLOR SET
                              </span>
                            )}
                          </div>
                          <p className="font-semibold text-stone-900 line-clamp-1">{itemName}</p>
                          {isItemWholesale ? (
                            <div className="text-[10px] text-blue-900 mt-0.5">
                              <span>{sets} Set{sets > 1 ? 's' : ''} • {pieces} Pieces (1 Set = {setSize} pcs)</span>
                              {itemSize && <span className="ml-1 font-bold">• Size: {itemSize}</span>}
                              {wholesaleColors.length > 0 && (
                                <p className="text-[9px] text-stone-500 truncate max-w-xs">
                                  Colors: {wholesaleColors.join(', ')}
                                </p>
                              )}
                            </div>
                          ) : (
                            <p className="text-[10px] text-stone-500 mt-0.5 flex items-center gap-1 flex-wrap">
                              {itemColor && (
                                <span className="font-bold text-stone-800 bg-stone-100 px-1.5 py-0.2 rounded">
                                  Color: {itemColor}
                                </span>
                              )}
                              {itemSize && (
                                <span className="font-bold text-[#7A3F0E] bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded font-mono">
                                  Size: {itemSize}
                                </span>
                              )}
                              <span>Qty: {item.quantity}</span>
                            </p>
                          )}
                        </div>
                      </div>
                      <span className="font-bold text-stone-900">
                        ₹{(itemPrice * sets).toLocaleString('en-IN')}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-6 border-t border-stone-100 flex flex-col sm:flex-row gap-3">
              <a
                href={whatsappOrderUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-3 bg-[#25D366] hover:bg-[#1EBE5D] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm"
              >
                <MessageCircle size={16} />
                <span>Confirm Order on WhatsApp</span>
              </a>

              <button
                type="button"
                onClick={() => window.print()}
                className="py-3 px-4 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
              >
                <Printer size={15} />
                <span>Print Invoice</span>
              </button>

              <button
                type="button"
                onClick={() => setCurrentView('track-order')}
                className="flex-1 py-3 bg-[#965215] hover:bg-[#7A3F0E] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm cursor-pointer"
              >
                <span>Track Order Status</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. Main Checkout Form
  return (
    <div className="bg-[#FAF7F2] min-h-screen py-6 sm:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-stone-500 mb-6">
          <button onClick={() => setCurrentView('home')} className="hover:text-[#965215]">
            Home
          </button>
          <ChevronRight size={12} />
          <button onClick={() => setCurrentView('shop')} className="hover:text-[#965215]">
            Shop
          </button>
          <ChevronRight size={12} />
          <span className="font-semibold text-stone-800">Checkout</span>
        </nav>

        <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
          <div className="flex items-center gap-3">
            <Logo size="sm" variant="image-only" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-['Marcellus'] font-bold text-stone-900">
                Checkout & Order Confirmation
              </h1>
              <p className="text-xs text-stone-500">Official VC MART Unified Cart Checkout</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
            <Lock size={13} className="text-emerald-600" />
            <span>256-Bit SSL Encrypted</span>
          </div>
        </div>

        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Customer Info & Payment Options */}
          <div className="lg:col-span-7 space-y-6">
            {/* Login Verification Banner */}
            {!currentUser ? (
              <div className="p-4 bg-amber-50 border border-amber-300 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#965215] text-white flex items-center justify-center shrink-0">
                    <User size={20} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                      Account Required to Place Order
                    </h4>
                    <p className="text-xs text-stone-600">
                      Sign in or create an account with your email to link this order, track shipping, and access your invoice.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => openAuthModal('Sign in to complete your checkout', 'customer')}
                  className="px-4 py-2 bg-[#965215] hover:bg-[#7A3F0E] text-white rounded-xl text-xs font-bold uppercase tracking-wider shrink-0 cursor-pointer shadow-xs"
                >
                  Sign In / Register
                </button>
              </div>
            ) : (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-3xl flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-sm shrink-0">
                    {currentUser.fullName ? currentUser.fullName.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                      Authenticated Customer
                    </span>
                    <p className="text-xs font-bold text-stone-900">
                      {currentUser.fullName || 'Customer'} &bull; {currentUser.email}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => openAuthModal('Switching account for order', 'customer')}
                  className="text-xs text-[#965215] font-semibold hover:underline cursor-pointer"
                >
                  Switch Account
                </button>
              </div>
            )}

            {/* Customer Details Box */}
            <div className="bg-white p-5 sm:p-6 rounded-3xl border border-[#E8DEC8] shadow-xs">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-full bg-amber-100 text-[#965215] flex items-center justify-center font-bold text-xs">
                  1
                </div>
                <h3 className="font-bold text-sm text-stone-900 uppercase tracking-wider">
                  Shipping & Contact Information
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Full Name */}
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-stone-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Rahul Sharma"
                    value={customer.fullName}
                    onChange={(e) => setCustomer({ ...customer, fullName: e.target.value })}
                    className="w-full p-2.5 bg-white border border-stone-300 rounded-xl focus:border-[#965215]"
                  />
                  {formErrors.fullName && (
                    <p className="text-red-600 text-[11px] mt-1">{formErrors.fullName}</p>
                  )}
                </div>

                {/* Mobile Number */}
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Mobile Number (10 digits) *
                  </label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 bg-stone-100 border border-r-0 border-stone-300 rounded-l-xl text-stone-600 font-semibold">
                      +91
                    </span>
                    <input
                      type="tel"
                      maxLength={10}
                      placeholder="9876543210"
                      value={customer.phone}
                      onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                      className="w-full p-2.5 bg-white border border-stone-300 rounded-r-xl focus:border-[#965215]"
                    />
                  </div>
                  {formErrors.phone && (
                    <p className="text-red-600 text-[11px] mt-1">{formErrors.phone}</p>
                  )}
                </div>

                {/* Email Address */}
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    placeholder="rahul@example.com"
                    value={customer.email}
                    onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                    className="w-full p-2.5 bg-white border border-stone-300 rounded-xl focus:border-[#965215]"
                  />
                  {formErrors.email && (
                    <p className="text-red-600 text-[11px] mt-1">{formErrors.email}</p>
                  )}
                </div>

                {/* Delivery Address */}
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-stone-700 mb-1">
                    House / Flat No., Building, Street Address *
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Flat 302, Royal Residency, Station Road"
                    value={customer.address}
                    onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                    className="w-full p-2.5 bg-white border border-stone-300 rounded-xl focus:border-[#965215]"
                  />
                  {formErrors.address && (
                    <p className="text-red-600 text-[11px] mt-1">{formErrors.address}</p>
                  )}
                </div>

                {/* City */}
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">City *</label>
                  <input
                    type="text"
                    placeholder="e.g. Bareilly / Lucknow"
                    value={customer.city}
                    onChange={(e) => setCustomer({ ...customer, city: e.target.value })}
                    className="w-full p-2.5 bg-white border border-stone-300 rounded-xl focus:border-[#965215]"
                  />
                  {formErrors.city && (
                    <p className="text-red-600 text-[11px] mt-1">{formErrors.city}</p>
                  )}
                </div>

                {/* State */}
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">State *</label>
                  <select
                    value={customer.state}
                    onChange={(e) => setCustomer({ ...customer, state: e.target.value })}
                    className="w-full p-2.5 bg-white border border-stone-300 rounded-xl focus:border-[#965215]"
                  >
                    {[
                      'Uttar Pradesh',
                      'Delhi',
                      'Haryana',
                      'Rajasthan',
                      'Madhya Pradesh',
                      'Maharashtra',
                      'Bihar',
                      'Gujarat',
                      'Punjab',
                      'Karnataka',
                      'Uttarakhand',
                      'West Bengal',
                      'Other State',
                    ].map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                {/* PIN Code */}
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">PIN Code *</label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="e.g. 243001"
                    value={customer.pincode}
                    onChange={(e) => setCustomer({ ...customer, pincode: e.target.value })}
                    className="w-full p-2.5 bg-white border border-stone-300 rounded-xl focus:border-[#965215]"
                  />
                  {formErrors.pincode && (
                    <p className="text-red-600 text-[11px] mt-1">{formErrors.pincode}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="bg-white p-5 sm:p-6 rounded-3xl border border-[#E8DEC8] shadow-xs">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-full bg-amber-100 text-[#965215] flex items-center justify-center font-bold text-xs">
                  2
                </div>
                <h3 className="font-bold text-sm text-stone-900 uppercase tracking-wider">
                  Payment Method
                </h3>
              </div>

              <div className="space-y-3">
                <button type="button" aria-pressed={paymentMethod === 'cod'} onClick={() => { setPaymentMethod('cod'); setPaymentError(null); }} className={`flex w-full items-start gap-3 p-3.5 rounded-2xl border-2 text-left shadow-xs ${paymentMethod === 'cod' ? 'border-[#965215] bg-amber-50/50' : 'border-stone-200 bg-white'}`}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Banknote size={16} className="text-[#965215]" />
                      <span className="text-xs font-bold text-stone-900">
                        Cash on Delivery (COD)
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      Pay in cash or digital payment at your doorstep upon order delivery.
                    </p>
                  </div>
                </button>
                <button type="button" aria-pressed={paymentMethod === 'razorpay'} onClick={() => { setPaymentMethod('razorpay'); setPaymentError(null); }} className={`flex w-full items-start gap-3 p-3.5 rounded-2xl border-2 text-left shadow-xs ${paymentMethod === 'razorpay' ? 'border-blue-900 bg-blue-50/60' : 'border-stone-200 bg-white'}`}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2"><ShieldCheck size={16} className="text-blue-900" /><span className="text-xs font-bold text-stone-900">Pay Online Securely</span></div>
                    <p className="text-[11px] text-stone-500 mt-0.5">UPI, cards and netbanking through Razorpay. Order confirms only after payment verification.</p>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary & Placement */}
          <div className="lg:col-span-5">
            <div className="sticky top-28 bg-white p-5 sm:p-6 rounded-3xl border border-[#E8DEC8] shadow-xs space-y-4">
              <h3 className="font-bold text-sm text-stone-900 uppercase tracking-wider pb-3 border-b border-stone-100 flex items-center justify-between">
                <span>Order Summary ({hasWholesaleItems && hasRetailItems ? 'Mixed items and sets' : hasWholesaleItems ? 'Wholesale sets' : 'Retail items'})</span>
                {hasWholesaleItems && (
                  <span className="text-[10px] bg-blue-900 text-white font-extrabold px-2 py-0.5 rounded uppercase">
                    Wholesale Order
                  </span>
                )}
              </h3>

              {/* Items List */}
              <div className="max-h-60 overflow-y-auto divide-y divide-stone-100 pr-1">
                {cart.map((item) => {
                  if (!item || !item.product) return null;
                  const isItemWholesale = (item.shoppingMode || shoppingMode) === 'wholesale';
                  const rawColors = item.wholesaleColors || (item.product?.wholesale_mix_colors || item.product?.wholesaleMixColors);
                  const wholesaleColors = safeStringArray(rawColors);
                  const setSize = Number(item.product.setSize || item.product.set_size || wholesaleColors.length || 6);
                  const itemUnitPrice = getCartItemPrice(item, shoppingMode);
                  const totalPieces = Number(item.totalPieces ?? (isItemWholesale ? item.quantity * setSize : item.quantity)) || item.quantity;

                  const itemImage =
                    item.colorImageUrl ||
                    (Array.isArray(item.product.images) && item.product.images[0]) ||
                    item.product.image ||
                    item.product.image_url ||
                    'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=800&auto=format&fit=crop';

                  return (
                    <div key={item.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2 truncate">
                        <img
                          src={itemImage}
                          alt=""
                          className="w-10 h-10 object-cover rounded-lg border border-stone-200 shrink-0"
                        />
                        <div className="truncate">
                          <div className="flex items-center gap-1">
                            <span className="text-[9px] uppercase font-bold text-[#965215] bg-amber-50 px-1 rounded">
                              {item.product.categoryName || 'Item'}
                            </span>
                            {isItemWholesale && (
                              <span className="text-[9px] font-black uppercase text-blue-900 bg-blue-50 px-1 rounded">
                                MIX COLOR SET
                              </span>
                            )}
                          </div>
                          <p className="font-semibold text-stone-900 truncate mt-0.5">{item.product.name}</p>
                          <div className="text-[10px] text-stone-500 flex items-center gap-1.5 flex-wrap">
                            {item.selectedColor && (
                              <span className="font-bold text-stone-800 bg-stone-100 px-1.5 py-0.2 rounded">
                                Color: {item.selectedColor}
                              </span>
                            )}
                            {item.selectedSize && (
                              <span className="font-bold text-[#7A3F0E] bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded font-mono">
                                Size: {item.selectedSize}
                              </span>
                            )}
                            <span>
                              {isItemWholesale
                                ? `${item.quantity} Set${item.quantity > 1 ? 's' : ''} • ${totalPieces} Pcs (₹${itemUnitPrice}/set)`
                                : `Qty: ${item.quantity} (₹${itemUnitPrice} each)`}
                            </span>
                          </div>
                          {isItemWholesale && wholesaleColors.length > 0 && (
                            <p className="text-[9px] text-stone-400 truncate mt-0.5">
                              Colors: {wholesaleColors.join(', ')}
                            </p>
                          )}
                        </div>
                      </div>
                      <span className="font-bold text-stone-900 shrink-0">
                        ₹{(itemUnitPrice * item.quantity).toLocaleString('en-IN')}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Have a coupon code? Box */}
              <div className="pt-3 border-t border-stone-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                    <Tag size={13} className="text-[#965215]" />
                    <span>Have a coupon code?</span>
                  </span>
                  {!appliedCoupon && (
                    <span className="text-[10px] text-stone-500 font-mono">
                      e.g. INSTA100, FLAT100
                    </span>
                  )}
                </div>

                {appliedCoupon ? (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs shadow-2xs">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                        ✓
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-emerald-900 font-mono text-xs">
                            {appliedCoupon.code}
                          </span>
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                            Coupon Applied ✓
                          </span>
                        </div>
                        <p className="text-[11px] font-bold text-emerald-800 mt-0.5">
                          Discount: <span className="font-mono">-₹{cartDiscount.toLocaleString('en-IN')}</span>
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        removeCoupon();
                        setCouponSuccess(null);
                        setCouponError(null);
                      }}
                      className="px-2.5 py-1 text-xs font-bold text-red-600 hover:text-red-700 bg-white border border-red-200 rounded-lg hover:bg-red-50 cursor-pointer shadow-2xs transition-colors"
                    >
                      Remove Coupon
                    </button>
                  </div>
                ) : (
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const codeToTest = couponInput.trim().toUpperCase();
                      if (!codeToTest) {
                        setCouponError('Please enter a coupon code.');
                        return;
                      }

                      setCouponError(null);
                      setCouponSuccess(null);
                      setIsValidatingCoupon(true);

                      try {
                        const verified = await applyCouponSecure({
                          code: codeToTest,
                          shoppingMode,
                          items: cart.map((item) => ({ productId: item.productId || item.product.id, quantity: item.quantity, shoppingMode: item.shoppingMode || shoppingMode, selectedSize: item.selectedSize, selectedColor: item.selectedColor })),
                        });
                        const data = verified.data as { discount: number };
                        setIsValidatingCoupon(false);
                        {
                          // Apply in context
                          const applyRes = applyCoupon(codeToTest);
                          if (applyRes.success) {
                            setCouponSuccess(`Coupon Applied ✓ Discount: -₹${data.discount}`);
                            setCouponInput('');
                          } else {
                            setCouponError(applyRes.message);
                          }
                        }
                      } catch (err: any) {
                        setIsValidatingCoupon(false);
                        setCouponError(err?.message || `Coupon '${codeToTest}' could not be verified.`);
                      }
                    }}
                    className="space-y-1.5"
                  >
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Enter coupon code"
                        value={couponInput}
                        onChange={(e) => {
                          setCouponInput(e.target.value.toUpperCase());
                          setCouponError(null);
                        }}
                        className="flex-1 px-3 py-2 text-xs font-mono font-bold uppercase bg-stone-50 border border-stone-300 rounded-xl focus:border-[#965215]"
                      />
                      <button
                        type="submit"
                        disabled={isValidatingCoupon || !couponInput.trim()}
                        className="px-4 py-2 bg-[#965215] hover:bg-[#7A3F0E] text-white rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer shadow-xs disabled:opacity-50 transition-colors"
                      >
                        {isValidatingCoupon ? 'Checking...' : 'Apply'}
                      </button>
                    </div>

                    {couponError && (
                      <p className="text-[11px] text-red-600 font-bold flex items-center gap-1 mt-1">
                        <AlertCircle size={12} /> {couponError}
                      </p>
                    )}

                    {couponSuccess && (
                      <p className="text-[11px] text-emerald-700 font-bold flex items-center gap-1 mt-1">
                        <CheckCircle2 size={12} /> {couponSuccess}
                      </p>
                    )}
                  </form>
                )}
              </div>

              {/* Price Calculation */}
              <div className="pt-3 border-t border-stone-200 space-y-2 text-xs text-stone-600">
                <div className="flex justify-between">
                  <span>Cart Subtotal</span>
                  <span className="font-semibold text-stone-900">₹{cartSubtotal.toLocaleString('en-IN')}</span>
                </div>

                {cartDiscount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount ({appliedCoupon?.code})</span>
                    <span className="font-bold">-₹{cartDiscount.toLocaleString('en-IN')}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>{hasWholesaleItems ? `Wholesale Delivery (₹${WHOLESALE_DELIVERY_PER_SET} × ${cart.filter((item) => (item.shoppingMode || shoppingMode) === 'wholesale').reduce((sum, item) => sum + item.quantity, 0)} Sets)` : 'Delivery'}</span>
                  {deliveryFee === 0 ? (
                    <span className="font-bold text-emerald-700">FREE</span>
                  ) : (
                    <span className="font-semibold text-stone-900">₹{deliveryFee.toLocaleString('en-IN')}</span>
                  )}
                </div>

                <div className="flex justify-between text-sm font-extrabold text-[#2A1810] pt-2 border-t border-stone-300">
                  <span>Grand Total</span>
                  <span className="text-lg text-[#7A3F0E]">₹{cartTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Payment Error Banner if any */}
              {paymentError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
                  <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold">Order Notice</p>
                    <p className="text-[11px] mt-0.5">{paymentError}</p>
                  </div>
                </div>
              )}

              {pendingPayment && <button type="button" disabled={isProcessingPayment} onClick={async () => {
                setIsProcessingPayment(true); setPaymentError(null);
                try {
                  const verified = (await verifyRazorpayPayment(pendingPayment)).data as RazorpayVerify;
                  if (verified.paymentStatus !== 'paid') { setPaymentError('Payment is still processing. Please check again shortly.'); return; }
                  const order = await getOrderById(pendingPayment.orderId);
                  if (!order) throw new Error('Order is not available yet.');
                  checkoutAttempt.current = null; setPendingPayment(null); clearCart(); setPlacedOrder(order);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                } catch { setPaymentError('Payment confirmation is still pending. Please check again shortly.'); }
                finally { setIsProcessingPayment(false); }
              }} className="w-full rounded-xl border border-blue-300 bg-blue-50 px-4 py-3 text-xs font-bold text-blue-900 disabled:opacity-50">Check Payment Status</button>}

              {/* Place Order / Pay Button */}
              <button
                id="place-order-submit-btn"
                type="submit"
                disabled={isProcessingPayment || !isWholesaleEligibleForCheckout || Boolean(pendingPayment)}
                className={`w-full py-4 rounded-xl text-xs sm:text-sm font-bold tracking-wider uppercase shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer disabled:cursor-not-allowed ${
                  !isWholesaleEligibleForCheckout
                    ? 'bg-stone-300 text-stone-500 shadow-none'
                    : isProcessingPayment
                    ? 'bg-stone-400 text-white'
                    : hasWholesaleItems
                    ? 'bg-blue-900 hover:bg-blue-950 text-white'
                    : 'bg-[#965215] hover:bg-[#7A3F0E] text-white'
                }`}
              >
                {isProcessingPayment ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>{paymentMethod === 'razorpay' ? 'PREPARING SECURE PAYMENT...' : 'CONFIRMING ORDER...'}</span>
                  </>
                ) : (
                  <>
                    {paymentMethod === 'razorpay' ? <ShieldCheck size={15} /> : <Truck size={15} />}
                    <span>
                      {paymentMethod === 'razorpay' ? 'PAY ONLINE ' : hasWholesaleItems && hasRetailItems ? 'CONFIRM MIXED COD ' : hasWholesaleItems ? 'CONFIRM WHOLESALE COD ' : 'CONFIRM CASH ON DELIVERY '}
                      (₹{cartTotal.toLocaleString('en-IN')})
                    </span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>

              <div className="text-center pt-2 space-y-1">
                <p className="text-[11px] text-stone-500 flex items-center justify-center gap-1">
                  <ShieldCheck size={14} className="text-emerald-600" />
                  256-Bit SSL Encrypted &bull; 100% Genuine Retail Guarantee
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
