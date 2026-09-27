import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Product,
  Shop,
  ShopId,
  CartItem,
  Order,
  Coupon,
  FilterState,
  CustomerReview,
  ShippingAddress,
  PaymentMethod,
  PaymentStatus,
  OrderStatus,
  UserProfile,
  UserRole,
  ShoppingMode,
  PRIMARY_ADMIN_EMAIL,
  isAuthorizedAdminEmail,
} from '../types';
import { initialShops, siteConfig } from '../config/siteConfig';
import { initialReviews, ensureProductWholesaleFields } from '../data/initialData';
import {
  saveOrderToFirebase,
  fetchOrdersFromFirebase,
  updateOrderStatusInFirebase,
  testFirebaseConnection,
  fetchCouponsFromFirebase,
  saveCouponToFirebase,
  deleteCouponFromFirebase,
  recordCouponUsageToFirebase,
  fetchCouponUsagesFromFirebase,
  fetchProductsFromFirebase,
  saveProductToFirebase,
  syncAllProductsToFirebase,
} from '../lib/firebaseRepository';
import { isFirebaseConfigured } from '../lib/firebase';
import { watchStoreSettings } from '../lib/firebaseRepository';
import { watchProducts, watchCoupons, watchShops, watchAdminOrders, watchCustomerOrders, listAdminProducts, saveProduct, softDeleteProduct, saveShop as saveShopFirebase, updateOrder, onAuthStateChanged, auth, registerCustomer as registerCustomerFirebase, loginCustomer as loginCustomerFirebase, logoutCustomer as logoutCustomerFirebase, loadUserProfile, saveUserProfile, verifyAdmin } from '../lib/firebaseRepository';
import {
  getInitialLogoSync,
  fetchLatestAdminLogo,
  saveAdminLogoEverywhere,
  updateDocumentHeadBranding,
  PRIMARY_ACTIVE_LOGO_KEY,
  LEGACY_CUSTOM_LOGO_KEY,
} from '../utils/branding';
import {
  getProductColors,
  getProductWholesaleColors,
  validateWholesaleCartItem,
  calculateWholesalePieces,
  safeStringArray,
  normalizeProductFields,
  safeSearchMatch,
  inferCategoryHierarchy,
} from '../utils/clothingSizes';

type StoreView = 'home' | 'shop' | 'cart' | 'checkout' | 'order-success' | 'track-order' | 'admin';

const viewFromPathname = (pathname: string): StoreView => {
  switch (pathname.replace(/\/+$/, '') || '/') {
    case '/shop': return 'shop';
    case '/checkout': return 'checkout';
    case '/track-order': return 'track-order';
    case '/admin': return 'admin';
    default: return 'home';
  }
};

const pathnameForView = (view: StoreView): string => {
  switch (view) {
    case 'shop': return '/shop';
    case 'checkout':
    case 'order-success': return '/checkout';
    case 'track-order': return '/track-order';
    case 'admin': return '/admin';
    default: return '/';
  }
};

interface StoreContextType {
  // Navigation & View
  currentView: StoreView;
  setCurrentView: (view: StoreView) => void;
  selectedProduct: Product | null;
  setSelectedProduct: (product: Product | null) => void;
  openProductDetails: (product: Product) => void;
  closeProductDetails: () => void;
  
  // Shops
  shops: Shop[];
  activeShop: Shop | null;
  setActiveShopId: (shopId: ShopId | 'all') => void;
  addShop: (shop: Omit<Shop, 'id' | 'slug'>) => Shop;
  updateShop: (shopOrId: string | Shop, updates?: Partial<Shop>) => void;
  
  // Products
  products: Product[];
  addProduct: (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Product;
  updateProduct: (productOrId: string | Product, updates?: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  getProductById: (id: string) => Product | undefined;
  refreshProducts: () => Promise<void>;
  syncAllProductsToCloud: () => Promise<{
    success: boolean;
    syncedCount: number;
    message: string;
    errors: string[];
  }>;
  
  // Cart
  cart: CartItem[];
  cartCount: number;
  addToCart: (
    product: Product,
    quantity?: number,
    variants?: Record<string, string> | string,
    mode?: ShoppingMode,
    colorOption?: { color?: string; colorImageUrl?: string }
  ) => void;
  updateCartQuantity: (cartItemId: string, quantity: number) => void;
  removeFromCart: (cartItemId: string) => void;
  clearCart: () => void;
  isCartDrawerOpen: boolean;
  setIsCartDrawerOpen: (open: boolean) => void;

  // Shopping Mode (Retail vs Wholesale)
  shoppingMode: ShoppingMode;
  setShoppingMode: (mode: ShoppingMode) => void;
  isWholesaleEligibleForCheckout: boolean;
  wholesaleCartErrors: string[];
  
  // Cart Financials
  cartSubtotal: number;
  cartDiscount: number;
  appliedCoupon: Coupon | null;
  applyCoupon: (code: string) => { success: boolean; message: string };
  removeCoupon: () => void;
  deliveryCharge: number;
  deliveryFee: number;
  freeDeliveryThreshold: number;
  standardDeliveryFee: number;
  lowStockThreshold: number;
  cartTotal: number;
  
  // Wishlist
  wishlist: string[]; // Product IDs
  toggleWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  
  // Filters & Search
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  resetFilters: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filteredProducts: Product[];
  
  // Orders
  orders: Order[];
  lastPlacedOrder: Order | null;
  placeOrder: (
    customer: ShippingAddress,
    paymentMethod: PaymentMethod,
    notes?: string,
    paymentDetails?: {
      paymentStatus?: PaymentStatus;
      razorpayPaymentId?: string;
      razorpayOrderId?: string;
      razorpaySignature?: string;
    }
  ) => Order | null;
  updateOrderStatus: (orderId: string, status: OrderStatus, trackingNumber?: string) => Promise<void>;
  trackOrder: (orderIdOrPhone: string) => Order | undefined;
  activeTrackedOrder: Order | null;
  setActiveTrackedOrder: (order: Order | null) => void;
  
  // Coupons
  coupons: Coupon[];
  addCoupon: (coupon: Partial<Coupon>) => Promise<Coupon>;
  updateCoupon: (couponOrId: string | Coupon, updates?: Partial<Coupon>) => Promise<void>;
  deleteCoupon: (id: string) => Promise<void>;
  toggleCouponActive: (id: string) => Promise<void>;
  couponUsages: any[];
  loadCoupons: () => Promise<void>;
  
  // Reviews
  reviews: CustomerReview[];
  addReview: (review: Omit<CustomerReview, 'id' | 'date'>) => void;
  
  // User & Authentication (Customer and Admin)
  currentUser: UserProfile | null;
  isAdminLoggedIn: boolean;
  loginCustomer: (email: string, passwordOrOtp?: string, fullName?: string, mobile?: string, mode?: ShoppingMode) => Promise<{ success: boolean; message?: string }>;
  registerCustomer: (details: { fullName: string; email: string; mobile: string; address?: string; city?: string; state?: string; pincode?: string; password?: string; mode?: ShoppingMode }) => Promise<{ success: boolean; message?: string }>;
  loginAdminWithEmail: (email: string, pinOrPass: string) => Promise<{ success: boolean; message?: string }>;
  loginAdmin: (pin: string) => Promise<boolean>;
  logoutUser: () => void;
  logoutAdmin: () => void;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;

  // Auth & Account Modal Controls
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  authModalReason: string | null;
  authModalInitialTab: 'customer' | 'admin';
  openAuthModal: (reason?: string, initialTab?: 'customer' | 'admin', onComplete?: () => void) => void;
  isAccountDrawerOpen: boolean;
  setIsAccountDrawerOpen: (open: boolean) => void;

  // Custom Logo & Branding (Restricted to Admin only)
  customLogo: string | null;
  activeLogo: string;
  updateLogo: (logoDataUrlOrUrl: string | null) => boolean;
  resetLogo: () => boolean;
  
  // Utilities
  getWhatsAppProductUrl: (product: Product) => string;
  getWhatsAppGeneralUrl: () => string;

  // Firebase Database Integration
  firebaseStatus: {
    connected: boolean | null;
    tableExists: boolean | null;
    message: string;
    latencyMs?: number;
    isChecking: boolean;
  };
  checkFirebaseConnection: () => Promise<{
    connected: boolean;
    tableExists: boolean;
    message: string;
    latencyMs: number;
  }>;
  fetchOrdersFromCloud: () => Promise<{
    success: boolean;
    count: number;
    error?: string;
  }>;
}

const defaultFilterState: FilterState = {
  shopId: 'all',
  minPrice: 0,
  maxPrice: 5000,
  inStockOnly: false,
  sortBy: 'popular',
};

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Shops are authoritative in Firestore after Firebase configuration.
  const [shops, setShops] = useState<Shop[]>([]);
  const [deliverySettings, setDeliverySettings] = useState({ freeDeliveryThreshold: 499, standardDeliveryFee: 49, lowStockThreshold: 5 });

  // The Firestore products collection is canonical; localStorage is never a product database.
  const [products, setProducts] = useState<Product[]>([]);

  // 3. Cart State with LocalStorage Persistence
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('vrg_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('vrg_cart', JSON.stringify(cart));
  }, [cart]);

  // 4. Wishlist State
  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('vrg_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('vrg_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  // 5. Orders State
  const [orders, setOrders] = useState<Order[]>([]);

  // 6. Coupons & Reviews
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [couponUsages, setCouponUsages] = useState<any[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [reviews, setReviews] = useState<CustomerReview[]>(initialReviews);

  const loadCoupons = async () => {
    if (!isFirebaseConfigured) throw new Error('Firebase is not configured.');
    const { coupons: remoteCoupons } = await fetchCouponsFromFirebase(isAdminLoggedIn);
    setCoupons(remoteCoupons);
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  // 7. Navigation & View State
  const [currentView, setCurrentViewState] = useState<StoreView>(() =>
    typeof window === 'undefined' ? 'home' : viewFromPathname(window.location.pathname)
  );
  const setCurrentView = (view: StoreView) => {
    setCurrentViewState(view);
    if (typeof window === 'undefined') return;
    const pathname = pathnameForView(view);
    if (window.location.pathname !== pathname) {
      window.history.pushState({ view }, '', pathname);
    }
  };
  useEffect(() => {
    const handlePopState = () => setCurrentViewState(viewFromPathname(window.location.pathname));
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState<boolean>(false);
  const [lastPlacedOrder, setLastPlacedOrder] = useState<Order | null>(null);
  const [activeTrackedOrder, setActiveTrackedOrder] = useState<Order | null>(null);

  // 8. Filters & Search State
  const [filters, setFilters] = useState<FilterState>(defaultFilterState);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // 9. User Authentication & Admin Session State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (!auth) return;
    return onAuthStateChanged(auth, async (authUser) => {
      if (!authUser) { setCurrentUser(null); setOrders([]); return; }
      try {
        const profile = await loadUserProfile(authUser.uid);
        const adminRole = await verifyAdmin(authUser.uid);
        if (!profile && !adminRole) { setCurrentUser(null); return; }
        const fallbackProfile: UserProfile = {
          id: authUser.uid,
          email: authUser.email || '',
          fullName: authUser.displayName || 'VC MART Admin',
          mobile: '',
          address: '',
          city: '',
          state: '',
          pincode: '',
          role: 'admin',
          createdAt: new Date().toISOString(),
        };
        const resolvedProfile = profile || fallbackProfile;
        setCurrentUser({ ...resolvedProfile, id: authUser.uid, email: authUser.email || resolvedProfile.email, role: adminRole ? 'admin' : 'customer' });
      } catch (error) { console.error('Could not load authenticated profile:', error); setCurrentUser(null); }
    });
  }, []);

  useEffect(() => {
    if (!isFirebaseConfigured || !currentUser?.id) { setOrders([]); return; }
    const listener = currentUser.role === 'admin' ? watchAdminOrders(setOrders, console.error) : watchCustomerOrders(currentUser.id, setOrders, console.error);
    return () => listener();
  }, [currentUser?.id, currentUser?.role]);

  const isAdminLoggedIn = Boolean(currentUser?.role === 'admin');

  // Auth modal and account drawer state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalReason, setAuthModalReason] = useState<string | null>(null);
  const [authModalInitialTab, setAuthModalInitialTab] = useState<'customer' | 'admin'>('customer');
  const [authOnSuccessCallback, setAuthOnSuccessCallback] = useState<(() => void) | null>(null);
  const [isAccountDrawerOpen, setIsAccountDrawerOpen] = useState<boolean>(false);

  // 9.5 Shopping Mode State (Retail vs Wholesale)
  const [shoppingMode, setShoppingModeState] = useState<ShoppingMode>(() => {
    try {
      const savedMode = localStorage.getItem('vcmart_shopping_mode');
      if (savedMode === 'wholesale' || savedMode === 'retail') {
        return savedMode as ShoppingMode;
      }
    } catch {
      // ignore
    }
    return 'retail';
  });

  const setShoppingMode = (mode: ShoppingMode) => {
    setShoppingModeState(mode);
    try {
      localStorage.setItem('vcmart_shopping_mode', mode);
      if (currentUser) {
        const updated: UserProfile = { ...currentUser, shoppingMode: mode };
        setCurrentUser(updated);
        void saveUserProfile(currentUser.id, { shoppingMode: mode }).catch((error) => console.error('Could not persist shopping mode:', error));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const openAuthModal = (
    reason?: string,
    initialTab: 'customer' | 'admin' = 'customer',
    onComplete?: () => void
  ) => {
    setAuthModalReason(reason || null);
    setAuthModalInitialTab(initialTab);
    if (onComplete) {
      setAuthOnSuccessCallback(() => onComplete);
    } else {
      setAuthOnSuccessCallback(null);
    }
    setIsAuthModalOpen(true);
  };

  const loginCustomer = async (
    email: string,
    passwordOrOtp?: string,
    fullName?: string,
    mobile?: string,
    mode?: ShoppingMode
  ): Promise<{ success: boolean; message?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !/^\S+@\S+\.\S+$/.test(cleanEmail)) {
      return { success: false, message: 'Please enter a valid email address.' };
    }

    if (!passwordOrOtp) return { success: false, message: 'Enter your password.' };
    try {
      const result = await loginCustomerFirebase(cleanEmail, passwordOrOtp);
      const profile = await loadUserProfile(result.user.uid);
      if (!profile) return { success: false, message: 'Account profile is missing. Contact support.' };
      const role: UserRole = await verifyAdmin(result.user.uid) ? 'admin' : 'customer';
      const user = { ...profile, id: result.user.uid, role };
      setCurrentUser(user);
      const chosenMode = mode || profile.shoppingMode || shoppingMode || 'retail';
      setShoppingModeState(chosenMode);
      localStorage.setItem('vcmart_shopping_mode', chosenMode);
      setIsAuthModalOpen(false);
      authOnSuccessCallback?.(); setAuthOnSuccessCallback(null);
      return { success: true, message: 'Signed in successfully.' };
    } catch (error) { return { success: false, message: error instanceof Error ? error.message : 'Unable to sign in.' }; }
  };

  const registerCustomer = async (details: {
    fullName: string;
    email: string;
    mobile: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    password?: string;
    mode?: ShoppingMode;
  }): Promise<{ success: boolean; message?: string }> => {
    const cleanEmail = details.email.trim().toLowerCase();
    if (!cleanEmail || !/^\S+@\S+\.\S+$/.test(cleanEmail)) {
      return { success: false, message: 'Please enter a valid email address.' };
    }
    if (!details.fullName.trim()) {
      return { success: false, message: 'Please enter your full name.' };
    }
    if (!/^[6-9]\d{9}$/.test(details.mobile.replace(/\D/g, ''))) {
      return { success: false, message: 'Please enter a valid 10-digit mobile number.' };
    }
    if (!/^\d{6}$/.test(details.pincode || '')) return { success: false, message: 'Please enter a valid 6-digit PIN code.' };
    if (!details.password || details.password.length < 6) return { success: false, message: 'Password must contain at least 6 characters.' };
    const chosenMode = details.mode || shoppingMode || 'retail';

    try {
      const { profile: user } = await registerCustomerFirebase(cleanEmail, details.password, {
      email: cleanEmail,
      fullName: details.fullName.trim(),
      mobile: details.mobile.trim(),
      address: details.address?.trim() || '',
      city: details.city?.trim() || '',
      state: details.state?.trim() || '',
      pincode: details.pincode?.trim() || '',
      });
      const chosenMode = details.mode || shoppingMode || 'retail';
      await saveUserProfile(user.id, { shoppingMode: chosenMode });

    setShoppingModeState(chosenMode);
    try {
      localStorage.setItem('vcmart_shopping_mode', chosenMode);
    } catch (e) {
      console.error(e);
    }

      setCurrentUser({ ...user, role: 'customer', shoppingMode: chosenMode });

    setIsAuthModalOpen(false);
    if (authOnSuccessCallback) {
      authOnSuccessCallback();
      setAuthOnSuccessCallback(null);
    }

      return { success: true, message: 'Account created successfully!' };
    } catch (error) { return { success: false, message: error instanceof Error ? error.message : 'Registration failed.' }; }
  };

  const loginAdminWithEmail = async (
    email: string,
    pinOrPass: string
  ): Promise<{ success: boolean; message?: string }> => {
    const cleanEmail = email.trim().toLowerCase();

    if (!pinOrPass) return { success: false, message: 'Enter your Firebase account password.' };
    try {
      const result = await loginCustomerFirebase(cleanEmail, pinOrPass);
      if (!(await verifyAdmin(result.user.uid))) { await logoutCustomerFirebase(); return { success: false, message: 'This Firebase account is not authorized for admin access.' }; }
      const profile = await loadUserProfile(result.user.uid);
      const adminUser = { ...(profile || { id: result.user.uid, email: cleanEmail, fullName: result.user.displayName || 'VC MART Admin', mobile: '', createdAt: new Date().toISOString() }), id: result.user.uid, role: 'admin' as const };
      setCurrentUser(adminUser);

    setIsAuthModalOpen(false);
    if (authOnSuccessCallback) {
      authOnSuccessCallback();
      setAuthOnSuccessCallback(null);
    }

      return { success: true, message: 'Admin verified successfully.' };
    } catch (error) { return { success: false, message: error instanceof Error ? error.message : 'Admin sign-in failed.' }; }
  };

  const loginAdmin = async (password: string): Promise<boolean> => {
    return (await loginAdminWithEmail(PRIMARY_ADMIN_EMAIL, password)).success;
  };

  const logoutUser = () => {
    void logoutCustomerFirebase();
    setCurrentUser(null);
    setIsAccountDrawerOpen(false);
    if (currentView === 'admin') {
      setCurrentView('home');
    }
  };

  const logoutAdmin = () => {
    logoutUser();
  };

  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    if (!currentUser) return;
    const updated: UserProfile = {
      ...currentUser,
      ...updates,
      // Protect role from arbitrary client update
      role: currentUser.role,
    };
    const allowed = { fullName: updates.fullName, mobile: updates.mobile, address: updates.address, city: updates.city, state: updates.state, pincode: updates.pincode, shoppingMode: updates.shoppingMode, updatedAt: new Date().toISOString() };
    await saveUserProfile(currentUser.id, allowed);
    setCurrentUser(updated);
  };

  // 10. Custom Logo & Branding (Single Source of Truth, Admin-restricted)
  const [customLogo, setCustomLogo] = useState<string | null>(() => {
    try {
      const saved =
        localStorage.getItem(PRIMARY_ACTIVE_LOGO_KEY) ||
        localStorage.getItem(LEGACY_CUSTOM_LOGO_KEY);
      return saved && saved.trim() ? saved.trim() : null;
    } catch {
      return null;
    }
  });

  // Active logo string: guaranteed to be non-empty (admin-selected if set, or official default)
  const activeLogo = customLogo || getInitialLogoSync();

  // On mount and across window focus: sync with remote cloud server and Firebase for all visitors
  useEffect(() => {
    let isMounted = true;

    // Apply document head branding immediately
    updateDocumentHeadBranding(activeLogo);

    // Fetch asynchronously from server/Firebase to guarantee latest Admin logo for new visitors
    fetchLatestAdminLogo().then((remoteLogo) => {
      if (isMounted && remoteLogo && remoteLogo !== customLogo) {
        setCustomLogo(remoteLogo);
      }
    });

    // Cross-tab / cross-component logo sync listener
    const handleLogoSync = (e: any) => {
      const newLogo = e?.detail?.logoUrl;
      if (newLogo !== undefined) {
        setCustomLogo(newLogo);
      }
    };

    window.addEventListener('vcmart_logo_updated', handleLogoSync);
    return () => {
      isMounted = false;
      window.removeEventListener('vcmart_logo_updated', handleLogoSync);
    };
  }, []);

  const updateLogo = (logoDataUrlOrUrl: string | null): boolean => {
    // Strict Admin authorization check
    if (!isAdminLoggedIn) {
      console.warn('Unauthorized logo change attempt: Admin login required');
      return false;
    }

    setCustomLogo(logoDataUrlOrUrl);
    // Asynchronously save to LocalStorage, Express server, Firebase, and document head
    saveAdminLogoEverywhere(logoDataUrlOrUrl).catch((err) => {
      console.error('Error broadcasting admin logo update:', err);
    });

    return true;
  };

  const resetLogo = (): boolean => {
    return updateLogo(null);
  };

  // 11. Firebase Cloud Database Integration State
  const [firebaseStatus, setFirebaseStatus] = useState<{
    connected: boolean | null;
    tableExists: boolean | null;
    message: string;
    latencyMs?: number;
    isChecking: boolean;
  }>({
    connected: null,
    tableExists: null,
    message: 'Firebase connection initializing...',
    isChecking: false,
  });

  const checkFirebaseConnection = async () => {
    setFirebaseStatus((prev) => ({ ...prev, isChecking: true }));
    try {
      const res = await testFirebaseConnection();
      setFirebaseStatus({
        connected: res.connected,
        tableExists: res.tableExists,
        message: res.message,
        latencyMs: res.latencyMs,
        isChecking: false,
      });
      return res;
    } catch (err: any) {
      const fallback = {
        connected: false,
        tableExists: false,
        message: err?.message || 'Connection test failed',
        latencyMs: 0,
      };
      setFirebaseStatus({
        ...fallback,
        isChecking: false,
      });
      return fallback;
    }
  };

  const fetchOrdersFromCloud = async (): Promise<{
    success: boolean;
    count: number;
    error?: string;
  }> => {
    try {
      const res = await fetchOrdersFromFirebase();
      if (res.success) { setOrders(res.orders); return { success: true, count: res.orders.length }; }
      return { success: res.success, count: 0, error: res.error };
    } catch (e: any) {
      console.warn('Could not fetch orders from cloud:', e);
      return { success: false, count: 0, error: e?.message || 'Fetch failed' };
    }
  };

  // Automated Products Sync (Server Disk & Firebase Cloud)
  const refreshProducts = async () => {
    if (!isFirebaseConfigured) throw new Error('Firebase is not configured.');
    const remote = await listAdminProducts();
    setProducts(remote.map((p) => ensureProductWholesaleFields(normalizeProductFields(p))));
  };

  const syncAllProductsToCloud = async (): Promise<{
    success: boolean;
    syncedCount: number;
    message: string;
    errors: string[];
  }> => {
    return syncAllProductsToFirebase(products);
  };

  useEffect(() => { void checkFirebaseConnection(); }, []);

  // Public catalog, admin catalog, and coupons observe their canonical Firestore collections.
  useEffect(() => {
    if (!isFirebaseConfigured) return;
    const unsubscribeProducts = watchProducts((remote) => {
      setProducts(remote.map((product) => ensureProductWholesaleFields(normalizeProductFields(product))));
    }, (error) => console.error('Firebase product listener failed:', error), isAdminLoggedIn);
    const unsubscribeCoupons = watchCoupons(setCoupons, (error) => console.error('Firebase coupon listener failed:', error), isAdminLoggedIn);
    const unsubscribeShops = watchShops((remote) => setShops(remote as Shop[]), (error) => console.error('Firebase shops listener failed:', error), isAdminLoggedIn);
    const unsubscribeSettings = watchStoreSettings(setDeliverySettings, (error) => console.error('Firebase settings listener failed:', error));
    return () => { unsubscribeProducts(); unsubscribeCoupons(); unsubscribeShops(); unsubscribeSettings(); };
  }, [isAdminLoggedIn]);

  // Active Shop Helper
  const activeShop = filters.shopId !== 'all' ? shops.find((s) => s.id === filters.shopId) || null : null;

  const setActiveShopId = (shopId: ShopId | 'all') => {
    setFilters((prev) => ({
      ...prev,
      shopId,
      categoryId: undefined,
      subcategoryId: undefined,
    }));
  };

  const resetFilters = () => {
    setFilters(defaultFilterState);
    setSearchQuery('');
  };

  const openProductDetails = (product: Product) => {
    setSelectedProduct(product);
  };

  // Cart Calculations
  const cartCount = cart.reduce((total, item) => total + (Number(item?.quantity) || 0), 0);

  const cartSubtotal = cart.reduce((sum, item) => {
    if (!item || !item.product) return sum;
    const isItemWholesale = (item.shoppingMode || shoppingMode) === 'wholesale';
    const price = Number(
      isItemWholesale
        ? (item.unitPrice ?? item.product.wholesale_price ?? item.product.wholesalePrice ?? item.product.salePrice ?? 0)
        : (item.product.salePrice ?? item.unitPrice ?? 0)
    ) || 0;
    const qty = Number(item.quantity) || 0;
    return sum + (price * qty);
  }, 0);

  // Wholesale cart validation & eligibility
  const wholesaleCartErrors: string[] = [];
  let isWholesaleEligibleForCheckout = true;

  cart.forEach((item) => {
    if (!item?.product || (item.shoppingMode || shoppingMode) !== 'wholesale') return;
    try {
      const validation = validateWholesaleCartItem(item);
      if (!validation.isValid) wholesaleCartErrors.push(...validation.errors);
    } catch (error) {
      console.error('[StoreContext] Wholesale validation failed:', error);
      wholesaleCartErrors.push(`${item.product.name} could not be validated for wholesale checkout.`);
    }
  });
  isWholesaleEligibleForCheckout = wholesaleCartErrors.length === 0;

  let cartDiscount = 0;
  if (appliedCoupon) {
    const discType = appliedCoupon.discount_type || appliedCoupon.type || 'percentage';
    const discVal = Number(appliedCoupon.discount_value ?? appliedCoupon.value ?? 0);
    const maxDisc = appliedCoupon.maximum_discount ?? appliedCoupon.maxDiscount;
    const appShop = appliedCoupon.applicable_shop || appliedCoupon.shopId || 'all';

    // Filter items eligible for this coupon
    let eligibleItems = cart.filter((item) => item && item.product);
    const appliedMode = appliedCoupon.applicable_shopping_type || appliedCoupon.applicableShoppingType || 'both';
    if (appliedMode !== 'both') eligibleItems = eligibleItems.filter((item) => (item.shoppingMode || shoppingMode) === appliedMode);
    if (appShop !== 'all') {
      eligibleItems = eligibleItems.filter((item) => item.product.shopId === appShop);
    }

    let appProducts: any = appliedCoupon.applicable_products || appliedCoupon.applicableProducts || 'all';
    if (typeof appProducts === 'string' && appProducts !== 'all') {
      try {
        appProducts = JSON.parse(appProducts);
      } catch {
        appProducts = 'all';
      }
    }

    if (Array.isArray(appProducts) && appProducts.length > 0) {
      eligibleItems = eligibleItems.filter((item) => appProducts.includes(item.product.id) || appProducts.includes(item.productId));
    }

    const eligibleSubtotal = eligibleItems.reduce((sum, item) => {
      if (!item || !item.product) return sum;
      const isItemWholesale = (item.shoppingMode || shoppingMode) === 'wholesale';
      const price = Number(
        isItemWholesale
          ? (item.unitPrice ?? item.product.wholesale_price ?? item.product.wholesalePrice ?? item.product.salePrice ?? 0)
          : (item.product.salePrice ?? item.unitPrice ?? 0)
      ) || 0;
      const qty = Number(item.quantity) || 0;
      return sum + (price * qty);
    }, 0);

    if (discType === 'percentage') {
      const calculated = (eligibleSubtotal * discVal) / 100;
      cartDiscount = maxDisc ? Math.min(calculated, maxDisc) : calculated;
    } else if (discType === 'flat') {
      cartDiscount = Math.min(cartSubtotal, discVal);
    }
    cartDiscount = Math.round(cartDiscount);
  }

  const deliveryCharge =
    cartSubtotal === 0 || cartSubtotal >= deliverySettings.freeDeliveryThreshold
      ? 0
      : deliverySettings.standardDeliveryFee;

  const cartTotal = Math.max(0, cartSubtotal - cartDiscount + deliveryCharge);

  // Cart Handlers
  const addToCart = (
    product: Product,
    quantity = 1,
    variants: Record<string, string> | string = {},
    mode?: ShoppingMode,
    colorOption?: { color?: string; colorImageUrl?: string }
  ) => {
    if (!product) return;
    if (Number(product.stock ?? 0) <= 0) return;

    const parsedVariants: Record<string, string> =
      typeof variants === 'string' ? { Size: variants } : { ...(variants || {}) };
    const chosenSize = parsedVariants.Size || (typeof variants === 'string' ? variants : undefined);
    const chosenColor = colorOption?.color || parsedVariants.Color || parsedVariants.color;
    const activeMode = mode || shoppingMode;
    const isWholesale = activeMode === 'wholesale';

    // Safe product normalization
    const safeImages = Array.isArray(product.images) && product.images.length > 0
      ? product.images
      : [product.image || product.image_url || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=800&auto=format&fit=crop'];

    const normalizedProduct: Product = {
      ...product,
      images: safeImages,
      stock: Number(product.stock ?? 0),
      salePrice: Number(product.salePrice ?? product.price ?? 0),
    };

    // STRICT WHOLESALE VALIDATION & MIX COLOR SET ENFORCEMENT
    if (isWholesale) {
      const wholesaleValidation = validateWholesaleCartItem({
        product: normalizedProduct,
        sets: quantity,
        selectedSize: chosenSize,
        selectedColor: chosenColor,
        shoppingMode: 'wholesale',
      });

      if (!wholesaleValidation.isValid) {
        try {
          if (typeof window !== 'undefined' && typeof window.alert === 'function') {
            window.alert(wholesaleValidation.errors.join('\n'));
          }
        } catch {
          console.warn('[Wholesale addToCart Validation Notice]:', wholesaleValidation.errors);
        }
        return;
      }

      const itemMixColors = Array.isArray(wholesaleValidation.wholesaleMixColors) && wholesaleValidation.wholesaleMixColors.length > 0
        ? wholesaleValidation.wholesaleMixColors
        : ['Black', 'White', 'Blue', 'Red', 'Green', 'Maroon'];

      let chosenColorImage = colorOption?.colorImageUrl;
      if (!chosenColorImage && chosenColor) {
        const availColors = getProductColors(normalizedProduct);
        const match = availColors.find((c) => c.name.toLowerCase() === chosenColor.toLowerCase());
        if (match?.imageUrl) chosenColorImage = match.imageUrl;
      }
      if (!chosenColorImage) chosenColorImage = safeImages[0];

      setCart((prev) => {
        const existingIndex = prev.findIndex(
          (item) =>
            item.productId === normalizedProduct.id &&
            (item.shoppingMode || 'retail') === 'wholesale' &&
            (item.selectedSize || '').toLowerCase() === (chosenSize || '').toLowerCase() &&
            (item.selectedColor || '').toLowerCase() === (chosenColor || '').toLowerCase()
        );

        if (existingIndex > -1) {
          const currentSets = Number(prev[existingIndex].quantity) || 1;
          const combinedSets = currentSets + wholesaleValidation.sets;
          const combinedValidation = validateWholesaleCartItem({
            product: normalizedProduct,
            sets: combinedSets,
            selectedSize: chosenSize,
            selectedColor: chosenColor,
            shoppingMode: 'wholesale',
          });

          const updated = [...prev];
          const finalSets = combinedValidation.isValid ? combinedValidation.sets : combinedSets;
          const finalPieces = calculateWholesalePieces(finalSets, wholesaleValidation.numberOfColors);

          updated[existingIndex] = {
            ...updated[existingIndex],
            quantity: finalSets,
            sets: finalSets,
            totalPieces: finalPieces,
            unitPrice: wholesaleValidation.unitPrice,
            wholesaleColors: itemMixColors,
            selectedSize: chosenSize || updated[existingIndex].selectedSize,
            selectedColor: chosenColor || updated[existingIndex].selectedColor,
            colorImageUrl: chosenColorImage || updated[existingIndex].colorImageUrl || safeImages[0],
          };
          return updated;
        } else {
          const newItem: CartItem = {
            id: `cart-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            productId: normalizedProduct.id,
            product: normalizedProduct,
            quantity: wholesaleValidation.sets,
            shoppingMode: 'wholesale',
            sets: wholesaleValidation.sets,
            totalPieces: wholesaleValidation.totalPieces, // Strictly: Sets * Number of Colors
            unitPrice: wholesaleValidation.unitPrice,
            selectedVariants: {
              ...(chosenSize ? { Size: chosenSize } : {}),
              ...(chosenColor ? { Color: chosenColor } : {}),
            },
            selectedSize: chosenSize,
            selectedColor: chosenColor,
            colorImageUrl: chosenColorImage,
            wholesaleColors: itemMixColors,
            addedAt: new Date().toISOString(),
          };
          return [...prev, newItem];
        }
      });

      setIsCartDrawerOpen(true);
      return;
    }

    // RETAIL MODE ADD TO CART
    const effectiveQty = Math.max(1, Math.round(quantity));

    // Color resolution for retail
    let chosenColorImage: string | undefined = colorOption?.colorImageUrl;

    const availableColors = getProductColors(normalizedProduct);
    if (!chosenColorImage && chosenColor) {
      const match = availableColors.find((c) => c.name.toLowerCase() === chosenColor!.toLowerCase());
      if (match?.imageUrl) {
        chosenColorImage = match.imageUrl;
      }
    }
    if (!chosenColorImage) chosenColorImage = safeImages[0];

    // Size-specific stock check
    let sizeStock = Number(normalizedProduct.stock ?? 0);
    const rawSizeVariants = normalizedProduct.size_variants || normalizedProduct.sizeVariants;
    const sizeVariants = Array.isArray(rawSizeVariants)
      ? rawSizeVariants
      : typeof rawSizeVariants === 'string'
      ? safeStringArray(rawSizeVariants)
      : [];

    if (chosenSize && Array.isArray(sizeVariants) && sizeVariants.length > 0) {
      const matchedVariant = sizeVariants.find(
        (v: any) => String(v?.size || '').toLowerCase() === chosenSize.toLowerCase()
      );
      if (matchedVariant && typeof matchedVariant === 'object') {
        sizeStock = Number(matchedVariant.stock_quantity ?? matchedVariant.stock ?? sizeStock);
      }
    }

    if (sizeStock <= 0) {
      try {
        if (typeof window !== 'undefined' && typeof window.alert === 'function') {
          window.alert(`Selected size "${chosenSize}" is currently out of stock.`);
        }
      } catch {
        console.warn(`Selected size "${chosenSize}" is out of stock.`);
      }
      return;
    }

    if (effectiveQty > sizeStock) {
      try {
        if (typeof window !== 'undefined' && typeof window.alert === 'function') {
          window.alert(`Insufficient stock for size ${chosenSize || 'default'}: Only ${sizeStock} pieces available.`);
        }
      } catch {
        console.warn(`Insufficient stock for size ${chosenSize || 'default'}: Only ${sizeStock} pieces available.`);
      }
      return;
    }

    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (item) =>
          item.productId === normalizedProduct.id &&
          (item.shoppingMode || 'retail') === 'retail' &&
          (item.selectedSize || '').toLowerCase() === (chosenSize || '').toLowerCase() &&
          (item.selectedColor || '').toLowerCase() === (chosenColor || '').toLowerCase()
      );

      if (existingIndex > -1) {
        const updated = [...prev];
        const currentQty = Number(updated[existingIndex].quantity) || 1;
        const newQty = currentQty + effectiveQty;
        const cappedQty = Math.min(newQty, sizeStock);
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: cappedQty,
          totalPieces: cappedQty,
        };
        return updated;
      } else {
        const newItem: CartItem = {
          id: `cart-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          productId: normalizedProduct.id,
          product: normalizedProduct,
          quantity: effectiveQty,
          shoppingMode: 'retail',
          totalPieces: effectiveQty,
          unitPrice: normalizedProduct.salePrice,
          selectedVariants: {
            ...parsedVariants,
            ...(chosenSize ? { Size: chosenSize } : {}),
            ...(chosenColor ? { Color: chosenColor } : {}),
          },
          selectedSize: chosenSize,
          selectedColor: chosenColor,
          colorImageUrl: chosenColorImage,
          addedAt: new Date().toISOString(),
        };
        return [...prev, newItem];
      }
    });

    setIsCartDrawerOpen(true);
  };

  const updateCartQuantity = (cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(cartItemId);
      return;
    }

    setCart((prev) =>
      prev.map((item) => {
        if (item.id === cartItemId) {
          const isWholesale = (item.shoppingMode || shoppingMode) === 'wholesale';
          if (isWholesale) {
            const wholesaleValidation = validateWholesaleCartItem({
              product: item.product,
              sets: quantity,
              selectedSize: item.selectedSize,
              selectedColor: item.selectedColor,
              shoppingMode: 'wholesale',
            });
            return {
              ...item,
              quantity: wholesaleValidation.sets,
              sets: wholesaleValidation.sets,
              totalPieces: wholesaleValidation.totalPieces, // Strictly: Sets * Number of Colors
              unitPrice: wholesaleValidation.unitPrice,
              wholesaleColors: wholesaleValidation.wholesaleMixColors,
            };
          } else {
            let maxStock = Number(item.product?.stock ?? 10);
            if (item.selectedSize) {
              const rawVariants = item.product?.size_variants || item.product?.sizeVariants;
              const sizeVariants = Array.isArray(rawVariants)
                ? rawVariants
                : typeof rawVariants === 'string'
                ? safeStringArray(rawVariants)
                : [];
              if (Array.isArray(sizeVariants) && sizeVariants.length > 0) {
                const matched = sizeVariants.find(
                  (v: any) => String(v?.size || '').toLowerCase() === String(item.selectedSize || '').toLowerCase()
                );
                if (matched && typeof matched === 'object') {
                  maxStock = Number(matched.stock_quantity ?? matched.stock ?? maxStock);
                }
              }
            }
            const safeQty = Math.max(1, Math.min(quantity, maxStock));
            return {
              ...item,
              quantity: safeQty,
              totalPieces: safeQty,
            };
          }
        }
        return item;
      })
    );
  };

  const removeFromCart = (cartItemId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== cartItemId));
  };

  const clearCart = () => {
    setCart([]);
    setAppliedCoupon(null);
  };

  // Coupon Application
  const applyCoupon = (code: string): { success: boolean; message: string } => {
    const trimmed = code.trim().toUpperCase();
    const coupon = coupons.find((c) => (c.code || '').toUpperCase() === trimmed);

    if (!coupon) {
      return { success: false, message: `Coupon code '${trimmed}' does not exist.` };
    }

    if (!coupon.active) {
      return { success: false, message: `Coupon '${trimmed}' is currently inactive.` };
    }

    // Check Start and Expiry Dates
    const now = new Date().getTime();
    const rawStart = coupon.start_at || coupon.startDate;
    const rawExpiry = coupon.expires_at || coupon.expiryDate;
    const start = rawStart ? new Date(rawStart).getTime() : 0;
    const expiry = rawExpiry ? new Date(rawExpiry).getTime() : Infinity;

    if (now < start) {
      return { success: false, message: `Coupon '${trimmed}' starts on ${new Date(start).toLocaleDateString()}.` };
    }

    if (now > expiry) {
      return { success: false, message: `Coupon '${trimmed}' has expired.` };
    }

    // Check Total Usage Limit
    const usageLimit = coupon.usage_limit ?? coupon.usageLimit;
    const usageCount = coupon.usage_count ?? coupon.usedCount ?? 0;
    if (usageLimit && usageCount >= usageLimit) {
      return { success: false, message: `Coupon '${trimmed}' has reached its total usage limit.` };
    }

    // Check Per-Customer Usage Limit
    const perCustomerLimit = coupon.per_customer_limit ?? coupon.perCustomerLimit ?? 1;
    if (currentUser) {
      const userUsages = couponUsages.filter(
        (u) =>
          (u.coupon_id === coupon.id || (u.coupon_code || '').toUpperCase() === trimmed) &&
          (u.customer_id === currentUser.id ||
            (u.customer_email && u.customer_email.toLowerCase() === currentUser.email.toLowerCase()) ||
            (u.customer_mobile && currentUser.mobile && u.customer_mobile === currentUser.mobile.replace(/[^0-9]/g, '')))
      );
      if (userUsages.length >= perCustomerLimit) {
        return {
          success: false,
          message: `You have reached the maximum usage limit (${perCustomerLimit}) for coupon '${trimmed}'.`,
        };
      }
    }

    // Check Shopping Mode (Retail / Wholesale / Both)
    const applicableMode = coupon.applicable_shopping_type || coupon.applicableShoppingType || 'both';
    const hasModeEligibleItems = cart.some((item) => (item.shoppingMode || shoppingMode) === applicableMode);
    if (applicableMode !== 'both' && !hasModeEligibleItems) {
      return {
        success: false,
        message: `Coupon '${trimmed}' is only applicable for ${applicableMode.toUpperCase()} purchases.`,
      };
    }

    // Check Minimum Order Value
    const minOrder = Number(coupon.minimum_order_value ?? coupon.minOrder ?? 0);
    if (cartSubtotal < minOrder) {
      return {
        success: false,
        message: `Minimum order value for ${coupon.code} is ₹${minOrder}. Add items worth ₹${minOrder - cartSubtotal} more!`,
      };
    }

    // Check Shop Division
    const appShop = coupon.applicable_shop || coupon.shopId || 'all';
    if (appShop && appShop !== 'all') {
      const hasShopProduct = cart.some((i) => i.product.shopId === appShop);
      if (!hasShopProduct) {
        const shop = shops.find((s) => s.id === appShop);
        return {
          success: false,
          message: `Coupon '${trimmed}' is exclusively valid on products from ${shop?.name || appShop}.`,
        };
      }
    }

    // Check Applicable Products
    let appProducts: any = coupon.applicable_products || coupon.applicableProducts || 'all';
    if (typeof appProducts === 'string' && appProducts !== 'all') {
      try {
        appProducts = JSON.parse(appProducts);
      } catch {
        appProducts = 'all';
      }
    }
    if (Array.isArray(appProducts) && appProducts.length > 0) {
      const hasEligibleProduct = cart.some((i) => appProducts.includes(i.product.id) || appProducts.includes(i.productId));
      if (!hasEligibleProduct) {
        return {
          success: false,
          message: `Coupon '${trimmed}' is valid only on select eligible items.`,
        };
      }
    }

    setAppliedCoupon(coupon);
    return { success: true, message: `Coupon ${coupon.code} applied successfully!` };
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
  };

  // Wishlist Handlers
  const toggleWishlist = (productId: string) => {
    setWishlist((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const isInWishlist = (productId: string) => wishlist.includes(productId);

  // Products Filter & Search Logic
  // The three VC MART divisions are configured site-wide. Until the optional
  // Firestore shops collection is populated, they remain valid product targets;
  // once it has records, its active/inactive state becomes authoritative.
  const catalogProducts = isAdminLoggedIn ? products : products.filter((product) => {
    const shop = shops.find((entry) => entry.id === product.shopId) || initialShops.find((entry) => entry.id === product.shopId);
    return shop?.status === 'active' && shop.isActive !== false;
  });
  const filteredProducts = catalogProducts.filter((p) => {
    // 1. Status Check: Safe against undefined, published, and active
    const statusLower = (p.status || 'active').toLowerCase().trim();
    if (statusLower === 'inactive' || statusLower === 'draft' || statusLower === 'archived' || (p as any).is_active === false) {
      return false;
    }

    // 2. Filter by Shop Division
    if (filters.shopId !== 'all' && p.shopId !== filters.shopId) {
      return false;
    }

    // 3. Filter by Category (Handles category ID, category Name, and singular/plural variations)
    if (filters.categoryId) {
      const target = filters.categoryId.toLowerCase().trim();
      const pCatId = (p.categoryId || '').toLowerCase().trim();
      const pCatName = (p.categoryName || '').toLowerCase().trim();
      const match =
        pCatId === target ||
        pCatName === target ||
        target.includes(pCatId) ||
        pCatId.includes(target) ||
        target.includes(pCatName) ||
        pCatName.includes(target) ||
        (target.endsWith('s') && (pCatId.includes(target.slice(0, -1)) || pCatName.includes(target.slice(0, -1)))) ||
        (pCatId.endsWith('s') && target.includes(pCatId.slice(0, -1))) ||
        (pCatName.endsWith('s') && target.includes(pCatName.slice(0, -1)));
      if (!match) return false;
    }

    // 4. Filter by Subcategory
    if (filters.subcategoryId) {
      const targetSub = filters.subcategoryId.toLowerCase().trim();
      const pSubId = (p.subcategoryId || '').toLowerCase().trim();
      const pSubName = (p.subcategoryName || '').toLowerCase().trim();
      const matchSub =
        pSubId === targetSub ||
        pSubName === targetSub ||
        targetSub.includes(pSubId) ||
        pSubId.includes(targetSub) ||
        targetSub.includes(pSubName) ||
        pSubName.includes(targetSub);
      if (!matchSub) return false;
    }

    // 5. Price Filter
    const productPrice = Number(p.salePrice ?? p.retail_price ?? p.retailPrice ?? p.price ?? 0);
    if (productPrice < filters.minPrice || productPrice > filters.maxPrice) {
      return false;
    }

    // 6. Stock Filter
    if (filters.inStockOnly && Number(p.stock ?? 0) <= 0) {
      return false;
    }

    // 7. Discount Filter
    if (filters.discountMin && Number(p.discount || 0) < filters.discountMin) {
      return false;
    }

    // 8. Rating Filter
    if (filters.rating && Number(p.rating || 0) < filters.rating) {
      return false;
    }

    // 9. Brand Filter
    if (filters.brand && (p.brand || '').toLowerCase() !== filters.brand.toLowerCase()) {
      return false;
    }

    // 10. Global Search Query & Category Navigation Search
    if (searchQuery.trim()) {
      const shopName = shops.find((s) => s.id === p.shopId)?.name || '';
      if (!safeSearchMatch(p, searchQuery, shopName)) {
        return false;
      }
    }

    return true;
  }).sort((a, b) => {
    switch (filters.sortBy) {
      case 'newest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'price-low':
        return a.salePrice - b.salePrice;
      case 'price-high':
        return b.salePrice - a.salePrice;
      case 'discount':
        return b.discount - a.discount;
      case 'rating':
        return b.rating - a.rating;
      case 'popular':
      default:
        return b.reviewsCount * b.rating - a.reviewsCount * a.rating;
    }
  });

  // Place Order Action with Stock Reduction
  const placeOrder = (_customer: ShippingAddress, _paymentMethod: PaymentMethod, _notes?: string, _paymentDetails?: { paymentStatus?: PaymentStatus; razorpayPaymentId?: string; razorpayOrderId?: string; razorpaySignature?: string }): Order | null => {
    console.error('Client-side order creation is disabled. Checkout must use the secure Firebase Cloud Function.');
    return null;
  };
  const updateOrderStatus = async (orderId: string, status: OrderStatus, trackingNumber?: string) => {
    await updateOrderStatusInFirebase(orderId, status, trackingNumber);
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id === orderId) {
          return {
            ...ord,
            orderStatus: status,
            trackingNumber: trackingNumber || ord.trackingNumber,
          };
        }
        return ord;
      })
    );
  };

  const trackOrder = (query: string): Order | undefined => {
    const q = query.trim().toUpperCase();
    const found = orders.find(
      (o) =>
        o.id.toUpperCase() === q ||
        o.customerMobile.includes(q) ||
        o.trackingNumber.toUpperCase() === q
    );
    setActiveTrackedOrder(found || null);
    return found;
  };

  // Product Admin Operations
  const addProduct = (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Product => {
    const rawProduct: Product = {
      ...productData,
      id: (productData as any).id || `prod-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const newProduct = ensureProductWholesaleFields(normalizeProductFields(rawProduct));

    // 1. Immediately update state (optimistic)
    setProducts((prev) => [newProduct, ...prev.filter((p) => p.id !== newProduct.id)]);

    void saveProduct(newProduct).catch((error) => console.error('Firebase product save failed:', error));

    return newProduct;
  };

  const updateProduct = (productOrId: string | Product, updates?: Partial<Product>) => {
    let updatedProd: Product | null = null;
    setProducts((prev) => {
      const next = prev.map((p) => {
        if (typeof productOrId === 'string' ? p.id === productOrId : p.id === productOrId.id) {
          const merged = typeof productOrId === 'string' ? { ...p, ...updates } : { ...productOrId, ...updates };
          const normalized = ensureProductWholesaleFields(
            normalizeProductFields({ ...merged, updatedAt: new Date().toISOString() })
          );
          updatedProd = normalized;
          return normalized;
        }
        return p;
      });
      return next;
    });

    if (updatedProd) {
      const prodToSave = updatedProd as Product;
      void saveProduct(prodToSave).catch((error) => console.error('Firebase product update failed:', error));
    }
  };

  const deleteProduct = (id: string) => {
    void softDeleteProduct(id).then(() => setProducts((prev) => prev.filter((p) => p.id !== id))).catch((error) => console.error('Firebase product deactivation failed:', error));
  };

  const getProductById = (id: string) => products.find((p) => p.id === id);

  // Shop Admin Operations (Allows future shops: Shop 4, Shop 5...)
  const addShop = (shopData: Omit<Shop, 'id' | 'slug'>): Shop => {
    const slug = shopData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const newShop: Shop = {
      ...shopData,
      id: slug,
      slug,
      status: shopData.status || 'active',
      isActive: shopData.isActive ?? true,
    };
    setShops((prev) => [...prev, newShop]);
    void saveShopFirebase(newShop.id, newShop).catch((error) => console.error('Firebase shop save failed:', error));
    return newShop;
  };

  const updateShop = (shopOrId: string | Shop, updates?: Partial<Shop>) => {
    if (typeof shopOrId === 'string') {
      setShops((prev) => {
        const next = prev.map((s) => (s.id === shopOrId ? { ...s, ...updates } : s));
        const shop = next.find((s) => s.id === shopOrId); if (shop) void saveShopFirebase(shop.id, shop).catch((error) => console.error('Firebase shop update failed:', error));
        return next;
      });
    } else {
      setShops((prev) => { void saveShopFirebase(shopOrId.id, shopOrId).catch((error) => console.error('Firebase shop update failed:', error)); return prev.map((s) => (s.id === shopOrId.id ? shopOrId : s)); });
    }
  };

  // Coupon Admin Operations
  const addCoupon = async (couponData: Partial<Coupon>): Promise<Coupon> => {
    const code = (couponData.code || '').trim().toUpperCase();
    const type = couponData.discount_type || couponData.type || 'percentage';
    const val = Number(couponData.discount_value ?? couponData.value ?? 0);
    const minOrder = Number(couponData.minimum_order_value ?? couponData.minOrder ?? 0);
    const maxDisc =
      couponData.maximum_discount !== undefined && couponData.maximum_discount !== null
        ? Number(couponData.maximum_discount)
        : couponData.maxDiscount !== undefined && couponData.maxDiscount !== null
        ? Number(couponData.maxDiscount)
        : undefined;

    const newCoupon: Coupon = {
      id: couponData.id || `coup-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      code,
      description: couponData.description || '',
      type,
      discount_type: type,
      value: val,
      discount_value: val,
      minOrder,
      minimum_order_value: minOrder,
      maxDiscount: maxDisc,
      maximum_discount: maxDisc,
      startDate: couponData.start_at || couponData.startDate || new Date().toISOString(),
      start_at: couponData.start_at || couponData.startDate || new Date().toISOString(),
      expiryDate: couponData.expires_at || couponData.expiryDate || new Date(Date.now() + 365 * 86400000).toISOString(),
      expires_at: couponData.expires_at || couponData.expiryDate || new Date(Date.now() + 365 * 86400000).toISOString(),
      usageLimit: couponData.usage_limit !== undefined && couponData.usage_limit !== null ? Number(couponData.usage_limit) : 1000,
      usage_limit: couponData.usage_limit !== undefined && couponData.usage_limit !== null ? Number(couponData.usage_limit) : 1000,
      usedCount: 0,
      usage_count: 0,
      perCustomerLimit: Number(couponData.per_customer_limit || couponData.perCustomerLimit || 1),
      per_customer_limit: Number(couponData.per_customer_limit || couponData.perCustomerLimit || 1),
      applicableShoppingType: couponData.applicable_shopping_type || couponData.applicableShoppingType || 'both',
      applicable_shopping_type: couponData.applicable_shopping_type || couponData.applicableShoppingType || 'both',
      shopId: couponData.applicable_shop || couponData.shopId || 'all',
      applicable_shop: couponData.applicable_shop || couponData.shopId || 'all',
      applicableProducts: couponData.applicable_products || couponData.applicableProducts || 'all',
      applicable_products: couponData.applicable_products || couponData.applicableProducts || 'all',
      active: couponData.active !== false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setCoupons((prev) => [newCoupon, ...prev.filter((c) => (c.code || '').toUpperCase() !== code)]);

    await saveCouponToFirebase(newCoupon);

    return newCoupon;
  };

  const updateCoupon = async (couponOrId: string | Coupon, updates?: Partial<Coupon>) => {
    let targetId = typeof couponOrId === 'string' ? couponOrId : couponOrId.id;
    let updatedCoupon: Coupon | null = null;

    setCoupons((prev) =>
      prev.map((c) => {
        if (c.id === targetId || (typeof couponOrId !== 'string' && c.code.toUpperCase() === couponOrId.code.toUpperCase())) {
          const merged = {
            ...c,
            ...(typeof couponOrId === 'object' ? couponOrId : updates),
            code: (updates?.code || (typeof couponOrId === 'object' ? couponOrId.code : c.code)).toUpperCase(),
            updated_at: new Date().toISOString(),
          };
          updatedCoupon = merged;
          return merged;
        }
        return c;
      })
    );

    if (updatedCoupon) await saveCouponToFirebase(updatedCoupon);
  };

  const toggleCouponActive = async (id: string) => {
    const target = coupons.find((c) => c.id === id);
    if (target) {
      await updateCoupon(id, { active: !target.active });
    }
  };

  const deleteCoupon = async (id: string) => {
    setCoupons((prev) => prev.filter((c) => c.id !== id));
    if (appliedCoupon?.id === id) {
      setAppliedCoupon(null);
    }

    await deleteCouponFromFirebase(id);
  };

  // Review Operations
  const addReview = (reviewData: Omit<CustomerReview, 'id' | 'date'>) => {
    const newReview: CustomerReview = {
      ...reviewData,
      id: `rev-${Date.now()}`,
      date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
    };
    setReviews((prev) => [newReview, ...prev]);
  };

  // WhatsApp Helpers
  const getWhatsAppProductUrl = (product: Product): string => {
    const cleanNumber = siteConfig.whatsappNumber.replace(/[^0-9]/g, '');
    const message = `Hello, I am interested in this product:
Product Name: ${product.name}
Price: ₹${product.salePrice}
Product Code: ${product.sku}`;
    return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
  };

  const getWhatsAppGeneralUrl = (): string => {
    const cleanNumber = siteConfig.whatsappNumber.replace(/[^0-9]/g, '');
    const message = `Hello ${siteConfig.websiteName}, I have a shopping enquiry. Please guide me.`;
    return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
  };

  return (
    <StoreContext.Provider
      value={{
        currentView,
        setCurrentView,
        selectedProduct,
        setSelectedProduct,
        openProductDetails,
        closeProductDetails: () => setSelectedProduct(null),
        shops,
        activeShop,
        setActiveShopId,
        addShop,
        updateShop,
        products: catalogProducts,
        addProduct,
        updateProduct,
        deleteProduct,
        getProductById,
        refreshProducts,
        syncAllProductsToCloud,
        cart,
        cartCount,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        isCartDrawerOpen,
        setIsCartDrawerOpen,
        shoppingMode,
        setShoppingMode,
        isWholesaleEligibleForCheckout,
        wholesaleCartErrors,
        cartSubtotal,
        cartDiscount,
        appliedCoupon,
        applyCoupon,
        removeCoupon,
        deliveryCharge,
        deliveryFee: deliveryCharge,
        freeDeliveryThreshold: deliverySettings.freeDeliveryThreshold,
        standardDeliveryFee: deliverySettings.standardDeliveryFee,
        lowStockThreshold: deliverySettings.lowStockThreshold,
        cartTotal,
        wishlist,
        toggleWishlist,
        isInWishlist,
        filters,
        setFilters,
        resetFilters,
        searchQuery,
        setSearchQuery,
        filteredProducts,
        orders,
        lastPlacedOrder,
        placeOrder,
        updateOrderStatus,
        trackOrder,
        activeTrackedOrder,
        setActiveTrackedOrder,
        coupons,
        addCoupon,
        updateCoupon,
        deleteCoupon,
        toggleCouponActive,
        couponUsages,
        loadCoupons,
        reviews,
        addReview,
        currentUser,
        isAdminLoggedIn,
        loginCustomer,
        registerCustomer,
        loginAdminWithEmail,
        loginAdmin,
        logoutUser,
        logoutAdmin,
        updateUserProfile,
        isAuthModalOpen,
        setIsAuthModalOpen,
        authModalReason,
        authModalInitialTab,
        openAuthModal,
        isAccountDrawerOpen,
        setIsAccountDrawerOpen,
        customLogo,
        activeLogo,
        updateLogo,
        resetLogo,
        getWhatsAppProductUrl,
        getWhatsAppGeneralUrl,
        firebaseStatus,
        checkFirebaseConnection,
        fetchOrdersFromCloud,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
