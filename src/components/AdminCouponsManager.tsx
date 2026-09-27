import React, { useState, useMemo } from 'react';
import {
  Tag,
  Plus,
  Edit,
  Trash2,
  Check,
  X,
  Search,
  CheckCircle2,
  AlertCircle,
  Percent,
  Banknote,
  Calendar,
  Users,
  ShoppingBag,
  TrendingDown,
  TrendingUp,
  Layers,
  ArrowUpDown,
  Filter,
  Database,
  RefreshCw,
  Copy,
  ExternalLink,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Coupon, DiscountType, ApplicableShoppingType } from '../types';
import { syncAllCouponsToFirebase } from '../lib/firebaseRepository';

export const AdminCouponsManager: React.FC = () => {
  const {
    coupons,
    addCoupon,
    updateCoupon,
    deleteCoupon,
    toggleCouponActive,
    couponUsages,
    shops,
    products,
    orders,
    loadCoupons,
    firebaseStatus,
  } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'percentage' | 'flat'>('all');
  const [filterMode, setFilterMode] = useState<'all' | 'retail' | 'wholesale' | 'both'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Form State
  const [formData, setFormData] = useState<{
    code: string;
    description: string;
    discountType: DiscountType;
    discountValue: number;
    minimumOrderValue: number;
    maximumDiscount: string; // string for input flexibility
    startDate: string;
    expiryDate: string;
    usageLimit: string;
    perCustomerLimit: number;
    applicableShoppingType: ApplicableShoppingType;
    applicableShop: string;
    applicableProductsMode: 'all' | 'selected';
    selectedProductIds: string[];
    active: boolean;
  }>({
    code: '',
    description: '',
    discountType: 'percentage',
    discountValue: 10,
    minimumOrderValue: 499,
    maximumDiscount: '200',
    startDate: new Date().toISOString().split('T')[0],
    expiryDate: new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
    usageLimit: '500',
    perCustomerLimit: 1,
    applicableShoppingType: 'both',
    applicableShop: 'all',
    applicableProductsMode: 'all',
    selectedProductIds: [],
    active: true,
  });

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handlePrefillInsta100 = () => {
    setFormData({
      code: 'INSTA100',
      description: 'Special ₹100 OFF on orders above ₹999 (Instagram Reel Promo)',
      discountType: 'flat',
      discountValue: 100,
      minimumOrderValue: 999,
      maximumDiscount: '100',
      startDate: new Date().toISOString().split('T')[0],
      expiryDate: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
      usageLimit: '500',
      perCustomerLimit: 1,
      applicableShoppingType: 'retail',
      applicableShop: 'all',
      applicableProductsMode: 'all',
      selectedProductIds: [],
      active: true,
    });
  };

  const handleSyncWithFirebase = async () => {
    setIsSyncing(true);
    showFeedback('success', 'Synchronizing coupons with Firebase cloud...');
    try {
      const syncRes = await syncAllCouponsToFirebase(coupons);
      await loadCoupons();
      if (syncRes.success) {
        showFeedback('success', `All ${syncRes.syncedCount} coupons synchronized with Firebase!`);
      } else {
        showFeedback('success', `Sync complete: ${syncRes.syncedCount} synced (${syncRes.errors.length} notices).`);
      }
    } catch (err: any) {
      showFeedback('error', err?.message || 'Failed to sync with Firebase');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleOpenCreateModal = () => {
    setEditingCoupon(null);
    setFormData({
      code: '',
      description: '',
      discountType: 'percentage',
      discountValue: 10,
      minimumOrderValue: 499,
      maximumDiscount: '200',
      startDate: new Date().toISOString().split('T')[0],
      expiryDate: new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
      usageLimit: '500',
      perCustomerLimit: 1,
      applicableShoppingType: 'both',
      applicableShop: 'all',
      applicableProductsMode: 'all',
      selectedProductIds: [],
      active: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (coupon: Coupon) => {
    setEditingCoupon(coupon);

    let appProdMode: 'all' | 'selected' = 'all';
    let selIds: string[] = [];

    let appProds: any = coupon.applicable_products || coupon.applicableProducts || 'all';
    if (typeof appProds === 'string' && appProds !== 'all') {
      try {
        appProds = JSON.parse(appProds);
      } catch {
        appProds = 'all';
      }
    }
    if (Array.isArray(appProds) && appProds.length > 0) {
      appProdMode = 'selected';
      selIds = appProds;
    }

    const start = coupon.start_at || coupon.startDate || new Date().toISOString();
    const expiry = coupon.expires_at || coupon.expiryDate || new Date(Date.now() + 90 * 86400000).toISOString();

    setFormData({
      code: (coupon.code || '').toUpperCase(),
      description: coupon.description || '',
      discountType: coupon.discount_type || coupon.type || 'percentage',
      discountValue: Number(coupon.discount_value ?? coupon.value ?? 0),
      minimumOrderValue: Number(coupon.minimum_order_value ?? coupon.minOrder ?? 0),
      maximumDiscount: coupon.maximum_discount !== undefined && coupon.maximum_discount !== null ? String(coupon.maximum_discount) : coupon.maxDiscount !== undefined && coupon.maxDiscount !== null ? String(coupon.maxDiscount) : '',
      startDate: start.includes('T') ? start.split('T')[0] : start,
      expiryDate: expiry.includes('T') ? expiry.split('T')[0] : expiry,
      usageLimit: String(coupon.usage_limit ?? coupon.usageLimit ?? 1000),
      perCustomerLimit: Number(coupon.per_customer_limit ?? coupon.perCustomerLimit ?? 1),
      applicableShoppingType: coupon.applicable_shopping_type || coupon.applicableShoppingType || 'both',
      applicableShop: coupon.applicable_shop || coupon.shopId || 'all',
      applicableProductsMode: appProdMode,
      selectedProductIds: selIds,
      active: coupon.active !== false,
    });
    setIsModalOpen(true);
  };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = formData.code.trim().toUpperCase();
    if (!cleanCode) {
      showFeedback('error', 'Coupon code cannot be empty.');
      return;
    }

    const payload: Partial<Coupon> = {
      code: cleanCode,
      description: formData.description.trim(),
      type: formData.discountType,
      discount_type: formData.discountType,
      value: Number(formData.discountValue),
      discount_value: Number(formData.discountValue),
      minOrder: Number(formData.minimumOrderValue),
      minimum_order_value: Number(formData.minimumOrderValue),
      maxDiscount: formData.maximumDiscount !== '' ? Number(formData.maximumDiscount) : undefined,
      maximum_discount: formData.maximumDiscount !== '' ? Number(formData.maximumDiscount) : undefined,
      startDate: new Date(formData.startDate).toISOString(),
      start_at: new Date(formData.startDate).toISOString(),
      expiryDate: new Date(formData.expiryDate + 'T23:59:59Z').toISOString(),
      expires_at: new Date(formData.expiryDate + 'T23:59:59Z').toISOString(),
      usageLimit: formData.usageLimit !== '' ? Number(formData.usageLimit) : undefined,
      usage_limit: formData.usageLimit !== '' ? Number(formData.usageLimit) : undefined,
      perCustomerLimit: Number(formData.perCustomerLimit || 1),
      per_customer_limit: Number(formData.perCustomerLimit || 1),
      applicableShoppingType: formData.applicableShoppingType,
      applicable_shopping_type: formData.applicableShoppingType,
      shopId: formData.applicableShop,
      applicable_shop: formData.applicableShop,
      applicableProducts: formData.applicableProductsMode === 'all' ? 'all' : formData.selectedProductIds,
      applicable_products: formData.applicableProductsMode === 'all' ? 'all' : formData.selectedProductIds,
      active: formData.active,
    };

    if (editingCoupon) {
      await updateCoupon(editingCoupon.id, payload);
      showFeedback('success', `Coupon '${cleanCode}' updated successfully!`);
    } else {
      await addCoupon(payload);
      showFeedback('success', `Coupon '${cleanCode}' created and activated!`);
    }

    setIsModalOpen(false);
  };

  const handleDelete = async (coupon: Coupon) => {
    if (window.confirm(`Are you sure you want to permanently delete coupon '${coupon.code}'?`)) {
      await deleteCoupon(coupon.id);
      showFeedback('success', `Coupon '${coupon.code}' deleted.`);
    }
  };

  // Enriched coupons with real usage statistics, orders and revenue
  const enrichedCoupons = useMemo(() => {
    return coupons.map((c) => {
      const codeUpper = (c.code || '').toUpperCase();
      const usages = couponUsages.filter(
        (u) => u.coupon_id === c.id || (u.coupon_code || '').toUpperCase() === codeUpper
      );
      const matchingOrders = orders.filter(
        (o) => o.couponCode && o.couponCode.toUpperCase() === codeUpper
      );
      const ordersGenerated = Math.max(usages.length, matchingOrders.length, c.usage_count || c.usedCount || 0);
      const totalDiscountGiven = usages.length > 0
        ? usages.reduce((sum, u) => sum + (Number(u.discount_amount) || 0), 0)
        : matchingOrders.reduce((sum, o) => sum + (Number(o.discount) || 0), 0);
      const revenueGenerated = matchingOrders.reduce((sum, o) => sum + (Number(o.totalAmount || o.total) || 0), 0);
      const usageLimit = c.usage_limit ?? c.usageLimit;
      const usageCount = c.usage_count ?? c.usedCount ?? ordersGenerated;
      const remainingUsage = usageLimit !== undefined && usageLimit !== null
        ? Math.max(0, Number(usageLimit) - Number(usageCount))
        : 'Unlimited';

      return {
        ...c,
        ordersGenerated,
        totalDiscountGiven,
        revenueGenerated,
        remainingUsage,
      };
    });
  }, [coupons, couponUsages, orders]);

  // Filtered coupons
  const filteredCoupons = useMemo(() => {
    return enrichedCoupons.filter((c) => {
      // Search
      const q = searchQuery.trim().toLowerCase();
      if (q) {
        const matchesCode = (c.code || '').toLowerCase().includes(q);
        const matchesDesc = (c.description || '').toLowerCase().includes(q);
        if (!matchesCode && !matchesDesc) return false;
      }

      // Filter Discount Type
      const type = c.discount_type || c.type || 'percentage';
      if (filterType !== 'all' && type !== filterType) return false;

      // Filter Shopping Mode
      const mode = c.applicable_shopping_type || c.applicableShoppingType || 'both';
      if (filterMode !== 'all' && mode !== filterMode) return false;

      // Filter Status
      if (filterStatus === 'active' && !c.active) return false;
      if (filterStatus === 'inactive' && c.active) return false;

      return true;
    });
  }, [enrichedCoupons, searchQuery, filterType, filterMode, filterStatus]);

  // Overall Statistics
  const totalCouponsCount = coupons.length;
  const activeCouponsCount = coupons.filter((c) => c.active).length;
  const totalOrdersWithCoupons = enrichedCoupons.reduce((sum, c) => sum + c.ordersGenerated, 0);
  const totalRevenueViaCoupons = enrichedCoupons.reduce((sum, c) => sum + c.revenueGenerated, 0);
  const totalDiscountGranted = enrichedCoupons.reduce((sum, c) => sum + c.totalDiscountGiven, 0);

  return (
    <div className="space-y-6">
      {/* Firebase Cloud Connection & Quick Actions Bar */}
      <div className="bg-gradient-to-r from-amber-50/80 via-white to-orange-50/50 p-4 sm:p-5 rounded-3xl border border-amber-200/80 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-white border border-amber-200 flex items-center justify-center text-[#965215] shrink-0 shadow-2xs">
            <Database size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-stone-900 font-['Marcellus']">
                Firebase Coupons Cloud Integration
              </h3>
              {firebaseStatus.connected ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  Live Connected ({firebaseStatus.latencyMs}ms)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                  Checking Firebase...
                </span>
              )}
            </div>
            <p className="text-xs text-stone-600 mt-0.5">
              Coupons are stored in Firestore and validated by a Firebase Cloud Function before checkout.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
          <button
            type="button"
            disabled={isSyncing}
            onClick={handleSyncWithFirebase}
            className="flex-1 md:flex-none px-3.5 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors disabled:opacity-50"
          >
            <RefreshCw size={13} className={isSyncing ? 'animate-spin' : ''} />
            <span>{isSyncing ? 'Syncing...' : 'Sync to Firebase'}</span>
          </button>

          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="flex-1 md:flex-none px-4 py-2 bg-[#965215] hover:bg-[#7A3F0E] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
          >
            <Plus size={14} />
            <span>Create Coupon</span>
          </button>
        </div>
      </div>

      {/* Top Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-[#E8DEC8] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Total Coupons</span>
            <div className="w-9 h-9 rounded-2xl bg-amber-50 text-[#965215] flex items-center justify-center">
              <Tag size={18} />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-stone-900 mt-2">{totalCouponsCount}</p>
          <span className="text-[11px] text-emerald-700 font-bold mt-1 inline-block">
            {activeCouponsCount} Active Live &bull; {totalCouponsCount - activeCouponsCount} Inactive
          </span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-[#E8DEC8] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Orders Generated</span>
            <div className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-800 flex items-center justify-center">
              <ShoppingBag size={18} />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-stone-900 mt-2">{totalOrdersWithCoupons}</p>
          <span className="text-[11px] text-stone-500 mt-1 inline-block">Orders placed using promo codes</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-[#E8DEC8] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Revenue Generated</span>
            <div className="w-9 h-9 rounded-2xl bg-purple-50 text-purple-800 flex items-center justify-center">
              <TrendingUp size={18} />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-stone-900 mt-2">
            ₹{totalRevenueViaCoupons.toLocaleString('en-IN')}
          </p>
          <span className="text-[11px] text-stone-500 mt-1 inline-block">Gross sales through coupon traffic</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-[#E8DEC8] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Total Discount Given</span>
            <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
              <TrendingDown size={18} />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-emerald-800 mt-2">
            ₹{totalDiscountGranted.toLocaleString('en-IN')}
          </p>
          <span className="text-[11px] text-stone-500 mt-1 inline-block">Customer savings delivered</span>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {feedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-[#E8DEC8] shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search coupon code or description (e.g. INSTA100)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-stone-50 border border-stone-300 rounded-xl focus:border-[#965215]"
            />
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="py-2 px-3 text-xs bg-stone-50 border border-stone-300 rounded-xl font-medium text-stone-700"
            >
              <option value="all">All Discount Types</option>
              <option value="percentage">Percentage (%)</option>
              <option value="flat">Flat Amount (₹)</option>
            </select>

            <select
              value={filterMode}
              onChange={(e) => setFilterMode(e.target.value as any)}
              className="py-2 px-3 text-xs bg-stone-50 border border-stone-300 rounded-xl font-medium text-stone-700"
            >
              <option value="all">All Shopping Types</option>
              <option value="retail">Retail Only</option>
              <option value="wholesale">Wholesale Only</option>
              <option value="both">Both (Retail & Wholesale)</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="py-2 px-3 text-xs bg-stone-50 border border-stone-300 rounded-xl font-medium text-stone-700"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Coupons Table */}
      <div className="bg-white rounded-3xl border border-[#E8DEC8] shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-stone-100 flex items-center justify-between">
          <h3 className="font-bold text-sm text-stone-900 uppercase tracking-wider flex items-center gap-2">
            <Tag size={16} className="text-[#965215]" />
            <span>Store Coupons ({filteredCoupons.length})</span>
          </h3>
          <span className="text-[11px] text-stone-500">
            Real-time validation enforced at checkout & Firebase database
          </span>
        </div>

        {filteredCoupons.length === 0 ? (
          <div className="p-12 text-center text-stone-500">
            <Tag size={36} className="mx-auto mb-2 text-stone-300" />
            <p className="text-sm font-semibold">No coupons match your filter</p>
            <p className="text-xs text-stone-400 mt-1">
              Create a new coupon like <span className="font-mono font-bold">INSTA100</span> or adjust filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#FAF7F2] text-stone-700 font-bold border-b border-[#E8DEC8]">
                  <th className="py-3 px-4">Coupon Code</th>
                  <th className="py-3 px-4">Discount</th>
                  <th className="py-3 px-4">Rules & Limits</th>
                  <th className="py-3 px-4">Applicable To</th>
                  <th className="py-3 px-4 text-center">Orders & Revenue</th>
                  <th className="py-3 px-4 text-right">Discount Given</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredCoupons.map((coupon) => {
                  const type = coupon.discount_type || coupon.type || 'percentage';
                  const val = Number(coupon.discount_value ?? coupon.value ?? 0);
                  const minOrder = Number(coupon.minimum_order_value ?? coupon.minOrder ?? 0);
                  const maxDisc = coupon.maximum_discount ?? coupon.maxDiscount;
                  const shop = coupon.applicable_shop || coupon.shopId || 'all';
                  const shoppingType = coupon.applicable_shopping_type || coupon.applicableShoppingType || 'both';

                  const expiryStr = coupon.expires_at || coupon.expiryDate;
                  const isExpired = expiryStr ? new Date(expiryStr).getTime() < Date.now() : false;

                  return (
                    <tr key={coupon.id} className="hover:bg-amber-50/20 transition-colors">
                      {/* Code */}
                      <td className="py-3.5 px-4 font-mono font-extrabold text-stone-900">
                        <div className="flex items-center gap-1.5">
                          <span className="bg-amber-100/70 text-[#965215] px-2 py-0.5 rounded-lg border border-amber-200">
                            {coupon.code}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyCode(coupon.code)}
                            title="Copy Code"
                            className="p-1 text-stone-400 hover:text-stone-700 cursor-pointer"
                          >
                            {copiedCode === coupon.code ? (
                              <Check size={12} className="text-emerald-600" />
                            ) : (
                              <Copy size={12} />
                            )}
                          </button>
                        </div>
                        {coupon.description && (
                          <p className="text-[10px] text-stone-500 font-sans font-normal mt-1 line-clamp-1 max-w-xs">
                            {coupon.description}
                          </p>
                        )}
                      </td>

                      {/* Discount Value */}
                      <td className="py-3.5 px-4">
                        <span className="font-extrabold text-[#7A3F0E] text-sm">
                          {type === 'percentage' ? `${val}% OFF` : `₹${val} FLAT`}
                        </span>
                        {type === 'percentage' && maxDisc && (
                          <span className="text-[10px] text-stone-500 block">
                            Max ₹{maxDisc}
                          </span>
                        )}
                      </td>

                      {/* Rules */}
                      <td className="py-3.5 px-4 text-[11px] text-stone-600 space-y-0.5">
                        <div>
                          Min Order: <strong className="text-stone-800">₹{minOrder}</strong>
                        </div>
                        <div>
                          Usage: <strong className="text-stone-800">{coupon.usage_count || coupon.usedCount || 0}</strong>
                          {coupon.usage_limit || coupon.usageLimit ? ` / ${coupon.usage_limit || coupon.usageLimit}` : ' (Unlimited)'}
                          <span className="text-[10px] text-stone-500 ml-1">
                            ({coupon.remainingUsage} left)
                          </span>
                        </div>
                        <div>
                          Per Customer: <strong className="text-stone-800">{coupon.per_customer_limit || coupon.perCustomerLimit || 1} use</strong>
                        </div>
                        <div className="text-[10px] text-stone-500">
                          Expires: {expiryStr ? new Date(expiryStr).toLocaleDateString() : 'No expiry'}
                          {isExpired && <span className="text-red-600 font-bold ml-1">(Expired)</span>}
                        </div>
                      </td>

                      {/* Applicable To */}
                      <td className="py-3.5 px-4 space-y-1">
                        <div>
                          <span
                            className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded uppercase ${
                              shoppingType === 'wholesale'
                                ? 'bg-blue-100 text-blue-900'
                                : shoppingType === 'retail'
                                ? 'bg-amber-100 text-amber-900'
                                : 'bg-purple-100 text-purple-900'
                            }`}
                          >
                            {shoppingType === 'both' ? 'Retail & Wholesale' : `${shoppingType} Only`}
                          </span>
                        </div>
                        <div className="text-[10px] text-stone-500 truncate max-w-36">
                          Shop: <strong className="text-stone-700 capitalize">{shop === 'all' ? 'All Divisions' : shop.replace('-', ' ')}</strong>
                        </div>
                      </td>

                      {/* Orders & Revenue Generated */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="font-bold text-stone-900">
                          {coupon.ordersGenerated || 0} Orders
                        </div>
                        <div className="text-[10px] text-stone-500 font-medium mt-0.5">
                          ₹{(coupon.revenueGenerated || 0).toLocaleString('en-IN')} Sales
                        </div>
                      </td>

                      {/* Discount Given */}
                      <td className="py-3.5 px-4 text-right font-extrabold text-emerald-800">
                        ₹{(coupon.totalDiscountGiven || 0).toLocaleString('en-IN')}
                      </td>

                      {/* Active Status Toggle */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => toggleCouponActive(coupon.id)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                            coupon.active && !isExpired
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-stone-200 text-stone-600 hover:bg-stone-300'
                          }`}
                        >
                          {coupon.active && !isExpired ? 'Active' : isExpired ? 'Expired' : 'Inactive'}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(coupon)}
                            className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-lg cursor-pointer"
                            title="Edit Coupon"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(coupon)}
                            className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                            title="Delete Coupon"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 border border-[#E8DEC8] shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-4">
              <div className="flex items-center gap-2">
                <Tag size={18} className="text-[#965215]" />
                <h3 className="font-bold text-base font-['Marcellus'] text-stone-900">
                  {editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                {!editingCoupon && (
                  <button
                    type="button"
                    onClick={handlePrefillInsta100}
                    className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-[#965215] border border-amber-200 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                    title="Load INSTA100 Instagram Reel promo template"
                  >
                    <Sparkles size={11} />
                    <span>Quick Fill INSTA100</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="text-stone-400 hover:text-stone-700 cursor-pointer p-1"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveCoupon} className="space-y-4 text-xs">
              {/* Code */}
              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Coupon Code * (automatically uppercase)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. INSTA100"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full p-2.5 font-mono font-bold uppercase bg-stone-50 border border-stone-300 rounded-xl focus:border-[#965215]"
                />
                <span className="text-[10px] text-stone-500 mt-1 block">
                  Example: INSTA100, WELCOME10, FESTIVE20
                </span>
              </div>

              {/* Description */}
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Description</label>
                <input
                  type="text"
                  placeholder="e.g. Special ₹100 discount on orders above ₹999"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:border-[#965215]"
                />
              </div>

              {/* Discount Type & Value */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Discount Type *</label>
                  <select
                    value={formData.discountType}
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value as DiscountType })}
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl font-bold"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="flat">Flat Amount (₹)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Discount Value * ({formData.discountType === 'percentage' ? '%' : '₹'})
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                    className="w-full p-2.5 font-bold bg-stone-50 border border-stone-300 rounded-xl"
                  />
                </div>
              </div>

              {/* Minimum Order Value & Maximum Discount */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Minimum Order Value (₹) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.minimumOrderValue}
                    onChange={(e) => setFormData({ ...formData, minimumOrderValue: Number(e.target.value) })}
                    className="w-full p-2.5 font-bold bg-stone-50 border border-stone-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Maximum Discount Cap (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Leave empty for unlimited"
                    value={formData.maximumDiscount}
                    onChange={(e) => setFormData({ ...formData, maximumDiscount: e.target.value })}
                    className="w-full p-2.5 font-bold bg-stone-50 border border-stone-300 rounded-xl"
                  />
                </div>
              </div>

              {/* Start Date & Expiry Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Expiry Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl"
                  />
                </div>
              </div>

              {/* Usage Limits */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Total Usage Limit</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 500"
                    value={formData.usageLimit}
                    onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Per Customer Usage Limit *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.perCustomerLimit}
                    onChange={(e) => setFormData({ ...formData, perCustomerLimit: Number(e.target.value) })}
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl"
                  />
                </div>
              </div>

              {/* Applicable Shopping Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Applicable Shopping Type *
                  </label>
                  <select
                    value={formData.applicableShoppingType}
                    onChange={(e) =>
                      setFormData({ ...formData, applicableShoppingType: e.target.value as ApplicableShoppingType })
                    }
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl font-bold"
                  >
                    <option value="both">Both (Retail & Wholesale)</option>
                    <option value="retail">Retail Only</option>
                    <option value="wholesale">Wholesale Only</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Applicable Shop Division *
                  </label>
                  <select
                    value={formData.applicableShop}
                    onChange={(e) => setFormData({ ...formData, applicableShop: e.target.value })}
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl font-bold"
                  >
                    <option value="all">All Divisions (Store-wide)</option>
                    {shops.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Applicable Products */}
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Applicable Products</label>
                <div className="flex items-center gap-4 mb-2">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="app-products"
                      checked={formData.applicableProductsMode === 'all'}
                      onChange={() => setFormData({ ...formData, applicableProductsMode: 'all', selectedProductIds: [] })}
                      className="accent-[#965215]"
                    />
                    <span>All Products</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="app-products"
                      checked={formData.applicableProductsMode === 'selected'}
                      onChange={() => setFormData({ ...formData, applicableProductsMode: 'selected' })}
                      className="accent-[#965215]"
                    />
                    <span>Selected Products Only</span>
                  </label>
                </div>

                {formData.applicableProductsMode === 'selected' && (
                  <div className="max-h-36 overflow-y-auto border border-stone-200 rounded-xl p-2 space-y-1.5 bg-stone-50">
                    {products.map((p) => {
                      const isChecked = formData.selectedProductIds.includes(p.id);
                      return (
                        <label key={p.id} className="flex items-center gap-2 text-[11px] cursor-pointer hover:bg-stone-100 p-1 rounded">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({
                                  ...formData,
                                  selectedProductIds: [...formData.selectedProductIds, p.id],
                                });
                              } else {
                                setFormData({
                                  ...formData,
                                  selectedProductIds: formData.selectedProductIds.filter((id) => id !== p.id),
                                });
                              }
                            }}
                            className="accent-[#965215]"
                          />
                          <span className="truncate">{p.name}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Status Toggle */}
              <div className="pt-2 flex items-center justify-between border-t border-stone-200">
                <span className="font-semibold text-stone-700">Coupon Status</span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="accent-[#965215] w-4 h-4 rounded"
                  />
                  <span className="font-bold text-stone-900">
                    {formData.active ? 'Active (Live)' : 'Inactive'}
                  </span>
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 flex gap-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 border border-stone-300 rounded-xl font-bold text-stone-700 cursor-pointer hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#965215] hover:bg-[#7A3F0E] text-white rounded-xl font-bold cursor-pointer shadow-xs"
                >
                  {editingCoupon ? 'Update Coupon' : 'Create Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
