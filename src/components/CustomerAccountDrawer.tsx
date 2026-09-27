import React, { useState } from 'react';
import {
  X,
  User,
  Package,
  MapPin,
  Phone,
  Mail,
  LogOut,
  ExternalLink,
  ChevronRight,
  Clock,
  CheckCircle2,
  Truck,
  ShoppingBag,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Logo } from './Logo';

export const CustomerAccountDrawer: React.FC = () => {
  const {
    currentUser,
    isAccountDrawerOpen,
    setIsAccountDrawerOpen,
    orders,
    logoutUser,
    setCurrentView,
    updateUserProfile,
    setActiveTrackedOrder,
  } = useStore();

  const [activeTab, setActiveTab] = useState<'orders' | 'profile'>('orders');
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [editAddress, setEditAddress] = useState(currentUser?.address || '');
  const [editCity, setEditCity] = useState(currentUser?.city || '');
  const [editPincode, setEditPincode] = useState(currentUser?.pincode || '');

  if (!isAccountDrawerOpen || !currentUser) return null;

  // Filter orders strictly for this customer only!
  const myOrders = orders.filter(
    (o) =>
      (currentUser.email && o.customerEmail?.toLowerCase() === currentUser.email.toLowerCase()) ||
      (currentUser.mobile && o.customerMobile?.replace(/[^0-9]/g, '') === currentUser.mobile.replace(/[^0-9]/g, '')) ||
      (currentUser.id && o.customerId === currentUser.id)
  );

  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile({
      address: editAddress,
      city: editCity,
      pincode: editPincode,
    });
    setIsEditingAddress(false);
  };

  const handleTrackSingleOrder = (ord: any) => {
    setActiveTrackedOrder(ord);
    setIsAccountDrawerOpen(false);
    setCurrentView('track-order');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-[#FAF7F2] border-b border-[#E8DEC8] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Logo size="sm" variant="image-only" />
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="font-bold text-sm text-stone-900 leading-tight">
                  {currentUser.fullName || 'Valued Customer'}
                </h2>
                <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-full bg-[#965215]/10 text-[#7A3F0E]">
                  Customer
                </span>
              </div>
              <span className="text-[11px] text-stone-500 truncate block max-w-[200px]">
                {currentUser.email}
              </span>
            </div>
          </div>

          <button
            onClick={() => setIsAccountDrawerOpen(false)}
            className="p-1.5 rounded-full hover:bg-[#F0E7DA] text-stone-600 hover:text-stone-900 cursor-pointer"
            aria-label="Close drawer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-stone-200 bg-stone-50 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`flex-1 py-3 flex items-center justify-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'orders'
                ? 'border-[#965215] text-[#965215] bg-white'
                : 'border-transparent text-stone-500 hover:text-stone-900'
            }`}
          >
            <Package size={15} />
            <span>My Orders ({myOrders.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-3 flex items-center justify-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'profile'
                ? 'border-[#965215] text-[#965215] bg-white'
                : 'border-transparent text-stone-500 hover:text-stone-900'
            }`}
          >
            <User size={15} />
            <span>Profile & Address</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* TAB 1: My Orders */}
          {activeTab === 'orders' && (
            <div>
              {myOrders.length === 0 ? (
                <div className="text-center py-12 px-4 bg-stone-50 rounded-2xl border border-stone-200">
                  <ShoppingBag size={36} className="text-stone-400 mx-auto mb-2" />
                  <h3 className="text-sm font-bold text-stone-800">No Orders Yet</h3>
                  <p className="text-xs text-stone-500 mt-1 max-w-xs mx-auto">
                    When you purchase clothing, bike spare parts, or mobile items, your orders will appear here.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAccountDrawerOpen(false);
                      setCurrentView('shop');
                    }}
                    className="mt-4 px-4 py-2 bg-[#965215] text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[#7A3F0E] cursor-pointer"
                  >
                    Start Shopping
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {myOrders.map((ord) => (
                    <div
                      key={ord.id}
                      className="p-3.5 bg-white rounded-2xl border border-stone-200 shadow-xs hover:border-[#965215]/40 transition-all"
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                        <div>
                          <span className="text-xs font-bold text-stone-900">
                            Order #{ord.orderNumber || ord.id}
                          </span>
                          <span className="block text-[10px] text-stone-400">
                            {new Date(ord.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            ord.orderStatus?.toLowerCase() === 'delivered'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {ord.orderStatus || 'Confirmed'}
                        </span>
                      </div>

                      {/* Items Preview */}
                      <div className="py-2.5 space-y-1.5 text-xs">
                        {ord.items?.slice(0, 3).map((it, idx) => (
                          <div key={idx} className="flex justify-between items-center text-stone-700">
                            <span className="truncate max-w-[220px]">
                              {it.quantity}x {it.name}
                            </span>
                            <span className="font-semibold text-stone-900">₹{it.price * it.quantity}</span>
                          </div>
                        ))}
                        {ord.items?.length > 3 && (
                          <span className="text-[10px] text-stone-400 italic">
                            + {ord.items.length - 3} more items
                          </span>
                        )}
                      </div>

                      {/* Total & Action */}
                      <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-stone-400 block">Total Amount</span>
                          <span className="font-bold text-sm text-[#965215]">₹{ord.total}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleTrackSingleOrder(ord)}
                          className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Truck size={13} />
                          <span>Track Delivery</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Profile & Saved Address */}
          {activeTab === 'profile' && (
            <div className="space-y-4 text-xs">
              <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
                <div className="flex items-center gap-2 text-stone-700">
                  <User size={15} className="text-[#965215]" />
                  <span className="font-semibold">{currentUser.fullName || 'Name Not Set'}</span>
                </div>
                <div className="flex items-center gap-2 text-stone-700">
                  <Mail size={15} className="text-[#965215]" />
                  <span>{currentUser.email}</span>
                </div>
                {currentUser.mobile && (
                  <div className="flex items-center gap-2 text-stone-700">
                    <Phone size={15} className="text-[#965215]" />
                    <span>{currentUser.mobile}</span>
                  </div>
                )}
              </div>

              {/* Delivery Address Box */}
              <div className="p-3.5 bg-white rounded-2xl border border-stone-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold uppercase tracking-wider text-[11px] text-stone-700 flex items-center gap-1.5">
                    <MapPin size={14} className="text-[#965215]" />
                    Saved Delivery Address
                  </span>
                  {!isEditingAddress && (
                    <button
                      type="button"
                      onClick={() => setIsEditingAddress(true)}
                      className="text-[#965215] font-bold hover:underline text-[11px] cursor-pointer"
                    >
                      {currentUser.address ? 'Edit' : 'Add Address'}
                    </button>
                  )}
                </div>

                {isEditingAddress ? (
                  <form onSubmit={handleSaveAddress} className="space-y-2 pt-2">
                    <textarea
                      rows={2}
                      placeholder="Street address, house number"
                      value={editAddress}
                      onChange={(e) => setEditAddress(e.target.value)}
                      className="w-full p-2 bg-stone-50 border border-stone-300 rounded-xl outline-hidden"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="City"
                        value={editCity}
                        onChange={(e) => setEditCity(e.target.value)}
                        className="p-2 bg-stone-50 border border-stone-300 rounded-xl outline-hidden"
                      />
                      <input
                        type="text"
                        placeholder="PIN Code"
                        value={editPincode}
                        onChange={(e) => setEditPincode(e.target.value)}
                        className="p-2 bg-stone-50 border border-stone-300 rounded-xl outline-hidden"
                      />
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsEditingAddress(false)}
                        className="flex-1 py-1.5 border border-stone-300 rounded-lg font-bold text-stone-600"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-1.5 bg-[#965215] text-white rounded-lg font-bold"
                      >
                        Save
                      </button>
                    </div>
                  </form>
                ) : (
                  <p className="text-stone-600 leading-relaxed">
                    {currentUser.address
                      ? `${currentUser.address}, ${currentUser.city || ''} ${currentUser.pincode ? `- ${currentUser.pincode}` : ''}`
                      : 'No delivery address saved yet. Addresses added during checkout will save here automatically.'}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Logout & Close */}
        <div className="p-4 bg-[#FAF7F2] border-t border-[#E8DEC8] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={logoutUser}
            className="flex-1 py-2.5 px-4 bg-stone-200/80 hover:bg-stone-300 text-stone-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <LogOut size={15} />
            <span>Sign Out</span>
          </button>
          <button
            type="button"
            onClick={() => setIsAccountDrawerOpen(false)}
            className="flex-1 py-2.5 px-4 bg-[#965215] hover:bg-[#7A3F0E] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
};
