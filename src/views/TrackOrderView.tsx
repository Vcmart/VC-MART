import React, { useState } from 'react';
import {
  Search,
  Truck,
  CheckCircle2,
  Clock,
  Package,
  MapPin,
  AlertCircle,
  Calendar,
  MessageCircle,
  Cloud,
  Loader2,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { siteConfig } from '../config/siteConfig';
import { Order } from '../types';
import { getOrderById } from '../lib/firebaseRepository';
import { Logo } from '../components/Logo';

export const TrackOrderView: React.FC = () => {
  const { orders, setCurrentView, currentUser, openAuthModal } = useStore();
  const [query, setQuery] = useState('');
  const [searchedOrder, setSearchedOrder] = useState<Order | null>(
    orders.length > 0 ? orders[0] : null
  );
  const [hasSearched, setHasSearched] = useState(orders.length > 0);
  const [notFound, setNotFound] = useState(false);
  const [isSearchingCloud, setIsSearchingCloud] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = query.trim();
    if (!clean) return;

    const cleanUpper = clean.toUpperCase();
    setHasSearched(true);
    const found = orders.find((o) => {
      const ordNo = (o.orderNumber || o.id || '').toUpperCase();
      const trkNo = (o.trackingNumber || '').toUpperCase();
      const custPh = (o.customerMobile || o.shippingAddress?.mobile || o.customer?.phone || '');
      return (
        ordNo === cleanUpper ||
        o.id.toUpperCase() === cleanUpper ||
        trkNo === cleanUpper ||
        custPh.includes(clean)
      );
    });

    if (found) {
      setSearchedOrder(found);
      setNotFound(false);
      return;
    }

    if (!currentUser) { openAuthModal('Sign in to securely view your order.', 'customer'); setNotFound(true); setIsSearchingCloud(false); return; }
    setIsSearchingCloud(true);
    try {
      const remote = await getOrderById(clean);
      if (remote && remote.customerId === currentUser.id) {
        setSearchedOrder(remote);
        setNotFound(false);
      } else {
        setSearchedOrder(null);
        setNotFound(true);
      }
    } catch {
      setSearchedOrder(null);
      setNotFound(true);
    } finally {
      setIsSearchingCloud(false);
    }
  };

  // Timeline steps
  const steps: Array<{ status: Order['orderStatus']; label: string; desc: string }> = [
    { status: 'pending', label: 'Order Confirmed', desc: 'Order received & verified' },
    { status: 'processing', label: 'Processing & Packed', desc: 'Quality checked at warehouse' },
    { status: 'shipped', label: 'Shipped', desc: 'Handed to courier partner' },
    { status: 'delivered', label: 'Delivered', desc: 'Package handed to recipient' },
  ];

  const getStepIndex = (status: Order['orderStatus']) => {
    switch (status) {
      case 'pending':
        return 0;
      case 'processing':
        return 1;
      case 'shipped':
        return 2;
      case 'delivered':
        return 3;
      case 'cancelled':
        return -1;
      default:
        return 0;
    }
  };

  const currentStepIdx = searchedOrder ? getStepIndex(searchedOrder.orderStatus) : 0;

  return (
    <div className="bg-[#FAF7F2] min-h-screen py-8 sm:py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center max-w-xl mx-auto mb-8 flex flex-col items-center">
          <div className="mb-3">
            <Logo size="sm" variant="emblem" />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#965215] bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
            Real-Time Tracking
          </span>
          <h1 className="text-2xl sm:text-3xl font-['Marcellus'] font-bold text-stone-900 mt-2">
            Track Your Shipment
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Enter your Order ID (e.g. VRG-2026-...) or your 10-digit registered mobile number.
          </p>
        </div>

        {/* Search Input Box */}
        <div className="bg-white p-4 sm:p-6 rounded-3xl border border-[#E8DEC8] shadow-xs mb-8">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Enter Order ID or Mobile Number..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 text-xs sm:text-sm bg-stone-50 border border-stone-300 rounded-2xl focus:border-[#965215] focus:bg-white text-stone-900"
              />
              <Search
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#965215]"
              />
            </div>
            <button
              type="submit"
              disabled={isSearchingCloud}
              className="px-6 sm:px-8 py-3 bg-[#965215] hover:bg-[#7A3F0E] text-white rounded-2xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-xs disabled:opacity-70 flex items-center gap-1.5"
            >
              {isSearchingCloud ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Searching...</span>
                </>
              ) : (
                <span>TRACK</span>
              )}
            </button>
          </form>

          {/* Quick Demo Hint */}
          {orders.length > 0 && !hasSearched && (
            <div className="mt-3 text-[11px] text-stone-500 flex items-center gap-1.5">
              <span>Recent order hint:</span>
              <button
                type="button"
                onClick={() => {
                  const firstNum = orders[0].orderNumber || orders[0].id || '';
                  setQuery(firstNum);
                  setSearchedOrder(orders[0]);
                  setHasSearched(true);
                  setNotFound(false);
                }}
                className="font-mono text-[#965215] font-semibold underline cursor-pointer"
              >
                {orders[0].orderNumber || orders[0].id}
              </button>
            </div>
          )}
        </div>

        {/* Results Box */}
        {notFound && (
          <div className="bg-white p-8 rounded-3xl border border-red-200 text-center shadow-xs">
            <AlertCircle size={32} className="text-red-500 mx-auto mb-2" />
            <h3 className="text-base font-bold text-stone-900 font-['Marcellus']">
              Order Not Found
            </h3>
            <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
              Please double check the Order ID or phone number entered. You can also contact our WhatsApp helpline for manual lookup.
            </p>
            <a
              href={`https://wa.me/${siteConfig.whatsappNumber.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 px-5 py-2 bg-[#25D366] text-white rounded-full text-xs font-bold"
            >
              <MessageCircle size={14} /> Contact WhatsApp Support
            </a>
          </div>
        )}

        {searchedOrder && (
          <div className="bg-white rounded-3xl border border-[#E8DEC8] shadow-sm overflow-hidden divide-y divide-stone-100">
            {/* Top Order Status Banner */}
            <div className="p-6 bg-gradient-to-r from-[#FAF7F2] to-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#965215] bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                  Tracking Details
                </span>
                <h3 className="text-lg font-bold font-['Marcellus'] text-stone-900 mt-1">
                  Order #{searchedOrder.orderNumber}
                </h3>
                <p className="text-xs text-stone-500">
                  Placed on {new Date(searchedOrder.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-xs text-stone-500 block">Status:</span>
                <span className="text-sm font-extrabold uppercase tracking-wider px-3 py-1 rounded-full bg-amber-100 text-[#7A3F0E] inline-block mt-0.5">
                  {searchedOrder.orderStatus}
                </span>
                {searchedOrder.paymentMethod === 'razorpay' && <span className="mt-2 block text-xs font-semibold text-stone-700">Payment: {searchedOrder.paymentStatus === 'paid' ? 'Paid online' : searchedOrder.paymentStatus === 'failed' ? 'Not completed' : 'Pending verification'}</span>}
              </div>
            </div>

            {/* Visual Tracking Progress Bar */}
            <div className="p-6 sm:p-8">
              <div className="grid grid-cols-4 gap-2 relative">
                {/* Horizontal line */}
                <div className="absolute top-4 left-6 right-6 h-1 bg-stone-200 -z-0">
                  <div
                    className="h-full bg-[#965215] transition-all duration-500"
                    style={{
                      width: `${(Math.max(0, currentStepIdx) / (steps.length - 1)) * 100}%`,
                    }}
                  />
                </div>

                {steps.map((step, idx) => {
                  const isCompleted = currentStepIdx >= idx;
                  const isCurrent = currentStepIdx === idx;

                  return (
                    <div key={idx} className="flex flex-col items-center text-center relative z-10">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all ${
                          isCompleted
                            ? 'bg-[#965215] border-[#965215] text-white shadow-xs'
                            : 'bg-white border-stone-300 text-stone-400'
                        }`}
                      >
                        {isCompleted ? <CheckCircle2 size={16} /> : <Clock size={16} />}
                      </div>
                      <span
                        className={`text-[11px] font-bold mt-2 ${
                          isCurrent ? 'text-[#965215]' : isCompleted ? 'text-stone-900' : 'text-stone-400'
                        }`}
                      >
                        {step.label}
                      </span>
                      <span className="text-[10px] text-stone-500 hidden sm:block mt-0.5">
                        {step.desc}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Courier Partner Card */}
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#FAF7F2] p-4 rounded-2xl border border-[#E8DEC8] text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-stone-400 block">Courier Partner</span>
                  <span className="font-bold text-stone-900 flex items-center gap-1.5 mt-0.5">
                    <Truck size={14} className="text-[#965215]" /> Delhivery Express / Blue Dart
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-stone-400 block">Tracking ID (AWB)</span>
                  <span className="font-mono font-bold text-stone-900 mt-0.5 block">{searchedOrder.trackingNumber}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-stone-400 block">Estimated Arrival</span>
                  <span className="font-bold text-emerald-700 flex items-center gap-1 mt-0.5">
                    <Calendar size={13} /> Within 2-4 Days
                  </span>
                </div>
              </div>
            </div>

            {/* Delivery Destination and Items */}
            <div className="p-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900 mb-3">
                Shipment Destination & Items:
              </h4>
              <p className="text-xs text-stone-600 mb-4 bg-stone-50 p-3 rounded-xl">
                <MapPin size={14} className="inline mr-1 text-[#965215]" />
                {(searchedOrder.customerName || searchedOrder.shippingAddress?.fullName || searchedOrder.customer?.fullName || 'Customer')} &bull;{' '}
                {(searchedOrder.shippingAddress?.address || searchedOrder.customer?.address || '')},{' '}
                {(searchedOrder.shippingAddress?.city || searchedOrder.customer?.city || '')},{' '}
                {(searchedOrder.shippingAddress?.state || searchedOrder.customer?.state || 'UP')} -{' '}
                {(searchedOrder.shippingAddress?.pincode || searchedOrder.customer?.pincode || '')}
              </p>

              <div className="space-y-2">
                {searchedOrder.items.map((item, idx) => {
                  const img = item.image || item.product?.images?.[0] || '';
                  const name = item.name || item.product?.name || 'Product';
                  const price = item.price || item.product?.salePrice || 0;
                  return (
                    <div key={idx} className="flex items-center justify-between text-xs p-2 rounded-lg border border-stone-100">
                      <div className="flex items-center gap-2">
                        {img && (
                          <img
                            src={img}
                            alt=""
                            className="w-9 h-9 object-cover rounded-md"
                          />
                        )}
                        <div>
                          <p className="font-semibold text-stone-900 truncate max-w-xs">{name}</p>
                          <p className="text-[10px] text-stone-400">Qty: {item.quantity}</p>
                        </div>
                      </div>
                      <span className="font-bold text-stone-900">
                        ₹{(price * item.quantity).toLocaleString('en-IN')}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
