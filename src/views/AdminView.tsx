import React, { useCallback, useEffect, useState } from 'react';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Store,
  Plus,
  Edit,
  Trash2,
  Check,
  X,
  Search,
  MessageCircle,
  ExternalLink,
  ShieldCheck,
  LogOut,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Camera,
  Database,
  Cloud,
  RefreshCw,
  Copy,
  CheckCircle2,
  Loader2,
  Lock,
  Tag,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Product, Order, Shop, ShopId, ProductImageItem } from '../types';
import { Logo } from '../components/Logo';
import { LogoManager } from '../components/LogoManager';
import { AdminCouponsManager } from '../components/AdminCouponsManager';
import { AdminProductImageUploader, ImageSlot } from '../components/AdminProductImageUploader';
import { AdminProductSizeManager } from '../components/AdminProductSizeManager';
import { AdminProductColorManager } from '../components/AdminProductColorManager';
import {
  isClothingCategory,
  calculateTotalStockFromVariants,
  getColorHex,
  getProductRetailColorNames,
  inferCategoryHierarchy,
  normalizeProductFields,
} from '../utils/clothingSizes';
import { uploadProductImage, saveProduct, findProductBySku, saveStoreSettings, FIREBASE_CONFIG, PRODUCT_STORAGE_PATH, STORAGE_FIREBASE_SETUP, VARIANTS_FIREBASE_SETUP } from '../lib/firebaseRepository';
import { initialShops } from '../config/siteConfig';

const createProductDraftId = () => `prod-${crypto.randomUUID()}`;

const productDivisionOptions = initialShops;

export const AdminView: React.FC = () => {
  const {
    products,
    deleteProduct,
    refreshProducts,
    orders,
    updateOrderStatus,
    shops,
    addShop,
    updateShop,
    coupons,
    isAdminLoggedIn,
    logoutAdmin,
    setCurrentView,
    firebaseStatus,
    checkFirebaseConnection,
    fetchOrdersFromCloud,
    currentUser,
    openAuthModal,
    freeDeliveryThreshold,
    standardDeliveryFee,
    lowStockThreshold,
  } = useStore();

  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'products' | 'inventory' | 'orders' | 'shops' | 'branding' | 'coupons' | 'settings'
  >('dashboard');
  const [freeThresholdInput, setFreeThresholdInput] = useState(freeDeliveryThreshold);
  const [deliveryFeeInput, setDeliveryFeeInput] = useState(standardDeliveryFee);
  const [lowStockThresholdInput, setLowStockThresholdInput] = useState(lowStockThreshold);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState<string | null>(null);
  useEffect(() => {
    setFreeThresholdInput(freeDeliveryThreshold);
    setDeliveryFeeInput(standardDeliveryFee);
    setLowStockThresholdInput(lowStockThreshold);
  }, [freeDeliveryThreshold, standardDeliveryFee, lowStockThreshold]);

  const [copiedInstructions, setCopiedInstructions] = useState(false);
  const [isFetchingFromCloud, setIsFetchingFromCloud] = useState(false);
  const [firebaseFeedback, setFirebaseFeedback] = useState<string | null>(null);
  const [individualSyncingId, setIndividualSyncingId] = useState<string | null>(null);

  // Product modal state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productSearch, setProductSearch] = useState('');
  const [productShopFilter, setProductShopFilter] = useState<string>('all');
  const [productCategoryFilter, setProductCategoryFilter] = useState<string>('all');
  const [productStatusFilter, setProductStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [productStockFilter, setProductStockFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventorySavingId, setInventorySavingId] = useState<string | null>(null);
  const [inventoryMessage, setInventoryMessage] = useState<string | null>(null);
  const [orderTypeFilter, setOrderTypeFilter] = useState<'all' | 'retail' | 'wholesale'>('all');

  // Product Image Upload & Storage State
  const [productImageSlots, setProductImageSlots] = useState<ImageSlot[]>([]);
  const [productImageError, setProductImageError] = useState<string | null>(null);
  const [productSaveFeedback, setProductSaveFeedback] = useState<string | null>(null);
  const [productDraftId, setProductDraftId] = useState('');
  const [isProductSaving, setIsProductSaving] = useState(false);
  const [imageUploadStatus, setImageUploadStatus] = useState<{
    isUploading: boolean;
    current: number;
    total: number;
    isSuccess: boolean;
    message?: string;
  }>({
    isUploading: false,
    current: 0,
    total: 0,
    isSuccess: false,
  });

  const handleProductImageSlotsChange = useCallback((slots: ImageSlot[]) => {
    setProductImageSlots(slots);
    setProductImageError(null);
  }, []);

  // New product form state with wholesale support
  const [productForm, setProductForm] = useState<Partial<Product>>({
    shopId: 'vinayak-collection',
    name: '',
    description: '',
    shortDescription: '',
    price: 999,
    salePrice: 499,
    retail_price: 499,
    retailPrice: 499,
    wholesale_price: 2400,
    wholesalePrice: 2400,
    set_size: 12,
    setSize: 12,
    wholesale_minimum_sets: 1,
    wholesaleMinimumSets: 1,
    wholesale_enabled: true,
    wholesaleEnabled: true,
    discount: 50,
    images: [],
    categoryName: 'Fashion',
    stock: 20,
    size_variants: [],
    sizeVariants: [],
    sizes: [],
    has_sizes: false,
    hasSizes: false,
    size_chart: { type: 'none' },
    sizeChart: { type: 'none' },
    colors: ['Black', 'White', 'Blue', 'Red', 'Green', 'Maroon'],
    brand: 'Vinayak Originals',
    rating: 4.8,
    reviewsCount: 12,
    status: 'active',
    isNew: true,
  });

  const divisionOptions = productDivisionOptions;

  // Shop modal state
  const [isShopModalOpen, setIsShopModalOpen] = useState(false);
  const [editingShop, setEditingShop] = useState<Shop | null>(null);
  const [shopForm, setShopForm] = useState<Partial<Shop>>({
    name: '',
    categoryName: '',
    description: '',
    phone: '+91 86849 33759',
    email: 'vcmartshop@gmail.com',
    isActive: true,
    bannerImage: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1200&auto=format&fit=crop',
    categories: ['General'],
  });

  // Strict Admin Gate: Normal customers and guests are strictly blocked from seeing admin data
  if (!isAdminLoggedIn) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center p-4 sm:p-6 bg-[#FAF7F2]">
        <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 border border-[#E8DEC8] shadow-lg text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4 border border-red-200">
            <Lock size={30} />
          </div>
          <span className="text-[10px] font-mono tracking-widest text-red-700 font-bold uppercase bg-red-100/70 px-2.5 py-1 rounded-full">
            Restricted Area &bull; Unauthorized
          </span>
          <h2 className="text-xl font-bold font-['Marcellus'] text-stone-900 mt-3 mb-2">
            Administrator Access Only
          </h2>
          <p className="text-xs text-stone-600 leading-relaxed mb-6">
            The Admin Portal and backend inventory management controls are strictly restricted to the verified store owner (<span className="font-mono font-bold text-stone-800">vinayakcollection9355@gmail.com</span>). Normal customer accounts cannot view this page.
          </p>

          <div className="space-y-3">
            <button
              type="button"
              onClick={() => {
                openAuthModal(
                  'Sign in with your verified store owner account to access the admin portal.',
                  'admin',
                  () => {
                    setCurrentView('admin');
                  }
                );
              }}
              className="w-full py-3 bg-[#2A1810] hover:bg-black text-[#DFB062] rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-colors"
            >
              <ShieldCheck size={16} />
              <span>Owner / Admin Sign In</span>
            </button>

            <button
              type="button"
              onClick={() => setCurrentView('home')}
              className="w-full py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
            >
              Return to Store Homepage
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Calculate Metrics
  const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || o.total || 0), 0);
  const totalOrdersCount = orders.length;
  const totalProductsCount = products.length;
  const publishedProductsCount = products.filter((p) => p.status === 'active').length;
  const totalInventory = products.reduce((sum, p) => sum + Math.max(0, Number(p.stock) || 0), 0);
  const lowStockCount = products.filter((p) => p.stock > 0 && p.stock <= lowStockThreshold).length;
  const outOfStockCount = products.filter((p) => p.stock <= 0).length;
  const pendingOrdersCount = orders.filter((order) => String(order.orderStatus).toLowerCase() === 'pending').length;
  const completedOrdersCount = orders.filter((order) => String(order.orderStatus).toLowerCase() === 'delivered').length;

  // Shop-wise Breakdown
  const shopBreakdown = shops.map((shop) => {
    const shopProducts = products.filter((p) => p.shopId === shop.id);
    const shopOrders = orders.filter((o) =>
      o.items.some((i) => (i.product?.shopId || i.shopId) === shop.id)
    );
    const shopSales = orders.reduce((sum, order) => {
      const itemsInShop = order.items.filter((i) => (i.product?.shopId || i.shopId) === shop.id);
      return (
        sum +
        itemsInShop.reduce(
          (iSum, it) => iSum + (it.product?.salePrice || it.price) * it.quantity,
          0
        )
      );
    }, 0);

    return {
      shop,
      productCount: shopProducts.length,
      orderCount: shopOrders.length,
      sales: shopSales,
    };
  });

  // Filtered products list
  const categories = Array.from(new Set(products.map((product) => product.categoryName).filter(Boolean))).sort();
  const adminFilteredProducts = products.filter((p) => {
    const matchesSearch =
      (p.name || '').toLowerCase().includes(productSearch.toLowerCase()) ||
      (p.sku || '').toLowerCase().includes(productSearch.toLowerCase()) ||
      (p.categoryName || '').toLowerCase().includes(productSearch.toLowerCase());
    const matchesShop = productShopFilter === 'all' || p.shopId === productShopFilter;
    const matchesCategory = productCategoryFilter === 'all' || p.categoryName === productCategoryFilter;
    const matchesStatus = productStatusFilter === 'all' || p.status === productStatusFilter;
    const stock = Number(p.stock) || 0;
    const matchesStock = productStockFilter === 'all'
      || (productStockFilter === 'in_stock' && stock > lowStockThreshold)
      || (productStockFilter === 'low_stock' && stock > 0 && stock <= lowStockThreshold)
      || (productStockFilter === 'out_of_stock' && stock <= 0);
    return matchesSearch && matchesShop && matchesCategory && matchesStatus && matchesStock;
  });

  const inventoryProducts = products.filter((product) => {
    const query = inventorySearch.trim().toLowerCase();
    return !query || [product.name, product.sku, product.categoryName, product.shopId]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query));
  });

  const saveInventory = async (product: Product, stock: number) => {
    if ((product.sizeVariants || product.size_variants || []).length > 0) {
      setInventoryMessage('This product has size-level stock. Use Edit to update each size safely.');
      return;
    }
    setInventorySavingId(product.id);
    setInventoryMessage(null);
    try {
      await saveProduct({ ...product, stock: Math.max(0, Math.floor(stock)), updatedAt: new Date().toISOString() });
      await refreshProducts();
      setInventoryMessage(`${product.name} inventory updated in Firestore.`);
    } catch (error) {
      setInventoryMessage(error instanceof Error ? error.message : 'Inventory update failed.');
    } finally {
      setInventorySavingId(null);
    }
  };

  const duplicateProduct = (product: Product) => {
    setEditingProduct(null);
    setProductDraftId(createProductDraftId());
    setProductForm({
      ...product,
      id: undefined,
      sku: '',
      name: `${product.name} (Copy)`,
      status: 'inactive',
      createdAt: undefined,
      updatedAt: undefined,
    });
    setProductImageSlots((product.images || []).map((url, index) => ({ id: `copy-${index}-${url.slice(-8)}`, url, previewUrl: url })));
    setProductImageError(null);
    setIsProductModalOpen(true);
  };

  // Handle Product Form Submit with Direct Image Upload
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name || !productForm.salePrice) return;

    const sku = (productForm.sku || '').trim().toUpperCase();
    if (!sku) {
      setProductImageError('SKU / Product Code is required.');
      return;
    }

    if (productImageSlots.length === 0) {
      setProductImageError('Please upload between 1 and 7 product images.');
      return;
    }

    if (imageUploadStatus.isUploading) {
      setProductImageError('Please wait for Firebase Storage image uploads to finish before saving the product.');
      return;
    }

    if (productImageSlots.some((slot) => slot.file || !slot.url || slot.url.startsWith('blob:') || slot.url.startsWith('data:'))) {
      setProductImageError('One or more product images are not stored in Firebase Storage. Retry the failed upload before saving.');
      return;
    }

    setIsProductSaving(true);
    setProductImageError(null);
    const productId = editingProduct?.id || productDraftId || createProductDraftId();

    const finalUrls = productImageSlots.map((slot) => slot.url || slot.previewUrl).filter(Boolean);
    const productImages: ProductImageItem[] = finalUrls.map((url, index) => ({
      url,
      position: index + 1,
      is_primary: index === 0,
    }));

    try {
      if (products.some((product) => product.id !== productId && product.sku?.trim().toUpperCase() === sku) || await findProductBySku(sku, productId)) {
        setProductImageError(`SKU ${sku} already belongs to another product.`);
        return;
      }
      if (finalUrls.length === 0) {
        setProductImageError('No Firebase Storage image URLs are available. Please select an image and wait for upload completion.');
        return;
      }

      const discountCalculated =
        productForm.price && productForm.price > (productForm.salePrice || 0)
          ? Math.round((((productForm.price || 0) - (productForm.salePrice || 0)) / (productForm.price || 1)) * 100)
          : 0;

      const retailPrice = Number(productForm.salePrice || productForm.retail_price || productForm.retailPrice || 0);
      const setSize = Math.max(1, Number(productForm.set_size || productForm.setSize || 12));
      const wholesalePrice = Number(
        productForm.wholesale_price ?? productForm.wholesalePrice ?? Math.round(retailPrice * 0.65 * setSize)
      );
      const wholesaleMinSets = Math.max(
        1,
        Number(productForm.wholesale_minimum_sets || productForm.wholesaleMinimumSets || 1)
      );
      const wholesaleEnabled = productForm.wholesale_enabled ?? productForm.wholesaleEnabled ?? true;

      const sizeVariants = productForm.size_variants || productForm.sizeVariants || [];
      const shopId = productForm.shopId || 'vinayak-collection';
      const isClothing = isClothingCategory(productForm.categoryName, shopId);
      const hasSizes = isClothing && sizeVariants.length > 0;
      const totalStock = hasSizes
        ? calculateTotalStockFromVariants(sizeVariants)
        : Number(productForm.stock || 0);

      const catHierarchy = inferCategoryHierarchy(productForm.categoryName, shopId);
      const categoryId = productForm.categoryId || catHierarchy.categoryId;
      const categoryName = productForm.categoryName || catHierarchy.categoryName;
      const subcategoryId = productForm.subcategoryId || catHierarchy.subcategoryId;
      const subcategoryName = productForm.subcategoryName || catHierarchy.subcategoryName;
      const brand = productForm.brand || (shopId === 'vinayak-collection' ? 'Vinayak Originals' : shopId === 'kinshuk-spare-parts' ? 'Kinshuk Genuine Spares' : 'Khushi Certified Gadgets');
      const description = productForm.description || `High-quality ${categoryName} from ${shopId}. Guaranteed authenticity, premium finish, and verified stock.`;

      const payload: Partial<Product> = {
        ...productForm,
        id: productId,
        shopId,
        categoryId,
        categoryName,
        subcategoryId,
        subcategoryName,
        sku,
        brand,
        description,
        shortDescription: productForm.shortDescription || description.slice(0, 80),
        status: productForm.status || 'active',
        isNew: Boolean(productForm.isNew),
        images: finalUrls,
        product_images: productImages,
        productImages: productImages,
        image: finalUrls[0],
        image_url: finalUrls[0],
        price: Number(productForm.price || 0),
        salePrice: retailPrice,
        retail_price: retailPrice,
        retailPrice: retailPrice,
        wholesale_price: wholesalePrice,
        wholesalePrice: wholesalePrice,
        set_size: setSize,
        setSize: setSize,
        wholesale_minimum_sets: wholesaleMinSets,
        wholesaleMinimumSets: wholesaleMinSets,
        wholesale_enabled: wholesaleEnabled,
        wholesaleEnabled: wholesaleEnabled,
        wholesale_set_type: productForm.wholesale_set_type || 'MIX COLOR SET',
        wholesale_mix_colors: productForm.wholesale_mix_colors || productForm.wholesaleMixColors || ['Black', 'White', 'Blue', 'Red', 'Green', 'Maroon'],
        wholesaleMixColors: productForm.wholesale_mix_colors || productForm.wholesaleMixColors || ['Black', 'White', 'Blue', 'Red', 'Green', 'Maroon'],
        wholesale_available_sizes: productForm.wholesale_available_sizes || productForm.wholesaleAvailableSizes || productForm.sizes || ['M', 'L', 'XL', 'XXL'],
        wholesaleAvailableSizes: productForm.wholesale_available_sizes || productForm.wholesaleAvailableSizes || productForm.sizes || ['M', 'L', 'XL', 'XXL'],
        discount: discountCalculated,
        stock: totalStock,
        size_variants: hasSizes ? sizeVariants : undefined,
        sizeVariants: hasSizes ? sizeVariants : undefined,
        sizes: hasSizes ? sizeVariants.filter((v) => v.active !== false).map((v) => v.size) : undefined,
        has_sizes: hasSizes,
        hasSizes: hasSizes,
        size_chart: hasSizes ? (productForm.size_chart || productForm.sizeChart) : undefined,
        sizeChart: hasSizes ? (productForm.size_chart || productForm.sizeChart) : undefined,
        colors: (productForm.colors as string[]) || (isClothing ? ['Black', 'White', 'Blue', 'Red', 'Green', 'Maroon'] : []),
        color_variants: ((productForm.colors as string[]) || (isClothing ? ['Black', 'White', 'Blue', 'Red', 'Green', 'Maroon'] : [])).map((c, idx) => ({
          name: c,
          hex: getColorHex(c),
          imageUrl: finalUrls[idx % finalUrls.length] || finalUrls[0],
        })),
        colorVariants: ((productForm.colors as string[]) || (isClothing ? ['Black', 'White', 'Blue', 'Red', 'Green', 'Maroon'] : [])).map((c, idx) => ({
          name: c,
          hex: getColorHex(c),
          imageUrl: finalUrls[idx % finalUrls.length] || finalUrls[0],
        })),
        clothingDetails: isClothing
          ? {
              ...(productForm.clothingDetails || { sizes: [] }),
              sizes: hasSizes ? sizeVariants.filter((v) => v.active !== false).map((v) => v.size) : (productForm.sizes || []),
              colors: (productForm.colors as string[]) || ['Black', 'White', 'Blue', 'Red', 'Green', 'Maroon'],
            }
          : productForm.clothingDetails,
      };

      const finalSavedProd: Product = {
        ...(editingProduct || {}),
        ...payload,
        createdAt: editingProduct?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as Product;

      // The Firestore product document is canonical for both admin and storefront.
      await saveProduct(finalSavedProd);

      // Refresh products from remote sources to ensure public store has latest state
      await refreshProducts();

      setProductSaveFeedback(`${finalSavedProd.name} was saved to Firebase and is ${finalSavedProd.status === 'active' ? 'published in the storefront' : 'unpublished'}.`);
      setIsProductModalOpen(false);
      setEditingProduct(null);
      setProductImageSlots([]);
      setImageUploadStatus({
        isUploading: false,
        current: 0,
        total: 0,
        isSuccess: false,
      });
    } catch (saveErr: any) {
      console.error('Failed to save product with images:', saveErr);
      setProductImageError(`Product save failed: ${saveErr.message || 'Failed to save product'}`);
    } finally {
      setIsProductSaving(false);
    }
  };

  // Open Product Edit
  const handleOpenEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setProductDraftId(prod.id);
    const setSize = prod.set_size ?? prod.setSize ?? 12;
    const retailPrice = prod.retail_price ?? prod.retailPrice ?? prod.salePrice ?? 499;
    const defaultWholesale = Math.round(retailPrice * 0.65 * setSize);

    const existingImages =
      prod.images && prod.images.length > 0
        ? prod.images
        : (prod.image || prod.image_url)
        ? [prod.image || prod.image_url!]
        : [];

    const existingSizeVariants = prod.size_variants || prod.sizeVariants || [];
    const existingSizes = prod.sizes || (existingSizeVariants.length > 0 ? existingSizeVariants.map((v) => v.size) : []);
    const existingColors = getProductRetailColorNames(prod);

    setProductForm({
      ...prod,
      images: existingImages,
      retail_price: retailPrice,
      retailPrice: retailPrice,
      wholesale_price: prod.wholesale_price ?? prod.wholesalePrice ?? defaultWholesale,
      wholesalePrice: prod.wholesale_price ?? prod.wholesalePrice ?? defaultWholesale,
      set_size: setSize,
      setSize: setSize,
      wholesale_minimum_sets: prod.wholesale_minimum_sets ?? prod.wholesaleMinimumSets ?? 1,
      wholesaleMinimumSets: prod.wholesale_minimum_sets ?? prod.wholesaleMinimumSets ?? 1,
      wholesale_enabled: prod.wholesale_enabled ?? prod.wholesaleEnabled ?? true,
      wholesaleEnabled: prod.wholesale_enabled ?? prod.wholesaleEnabled ?? true,
      size_variants: existingSizeVariants,
      sizeVariants: existingSizeVariants,
      sizes: existingSizes,
      has_sizes: existingSizeVariants.length > 0 || existingSizes.length > 0,
      hasSizes: existingSizeVariants.length > 0 || existingSizes.length > 0,
      size_chart: prod.size_chart || prod.sizeChart,
      sizeChart: prod.size_chart || prod.sizeChart,
      colors: existingColors,
      color_variants: prod.color_variants || prod.colorVariants,
      colorVariants: prod.color_variants || prod.colorVariants,
      wholesale_set_type: prod.wholesale_set_type || 'MIX COLOR SET',
      wholesale_mix_colors: prod.wholesale_mix_colors || prod.wholesaleMixColors || ['Black', 'White', 'Blue', 'Red', 'Green', 'Maroon'],
      wholesaleMixColors: prod.wholesale_mix_colors || prod.wholesaleMixColors || ['Black', 'White', 'Blue', 'Red', 'Green', 'Maroon'],
      wholesale_available_sizes: prod.wholesale_available_sizes || prod.wholesaleAvailableSizes || existingSizes || ['M', 'L', 'XL', 'XXL'],
      wholesaleAvailableSizes: prod.wholesale_available_sizes || prod.wholesaleAvailableSizes || existingSizes || ['M', 'L', 'XL', 'XXL'],
    });

    setProductImageSlots(
      existingImages.map((url, idx) => ({
        id: `edit-${idx}-${url.slice(-8)}`,
        url,
        previewUrl: url,
      }))
    );
    setProductImageError(null);
    setImageUploadStatus({ isUploading: false, current: 0, total: 0, isSuccess: false });
    setIsProductModalOpen(true);
  };

  // Handle Shop Form Submit
  const handleSaveShop = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopForm.name || !shopForm.categoryName) return;

    if (editingShop) {
      updateShop({
        ...editingShop,
        ...shopForm,
      } as Shop);
    } else {
      const newId = shopForm.name.toLowerCase().replace(/[^a-z0-9]/g, '-') as ShopId;
      addShop({
        ...shopForm,
        id: newId,
      } as any);
    }

    setIsShopModalOpen(false);
    setEditingShop(null);
  };

  return (
    <div className="bg-[#FAF7F2] min-h-screen py-6 sm:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Admin Header */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E8DEC8] shadow-xs mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <Logo size="md" variant="image-only" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#965215] bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                  Management Portal
                </span>
                <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                  <ShieldCheck size={14} /> Owner Active
                </span>
              </div>
              <h1 className="text-2xl font-bold font-['Marcellus'] text-stone-900 mt-1">
                VC MART Admin Portal
              </h1>
              <p className="text-xs text-stone-500">
                Manage multi-shop inventory, incoming customer orders, and shop configurations.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setActiveTab('branding')}
              className="px-3 sm:px-4 py-2 bg-amber-50 text-[#965215] border border-amber-300/80 rounded-xl text-xs font-bold hover:bg-amber-100 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Camera size={14} />
              <span>Change Logo</span>
            </button>
            <button
              onClick={() => setCurrentView('home')}
              className="px-3 sm:px-4 py-2 border border-stone-300 text-stone-700 rounded-xl text-xs font-bold hover:bg-stone-50 cursor-pointer"
            >
              View Live Store
            </button>
            <button
              onClick={logoutAdmin}
              className="px-3 sm:px-4 py-2 bg-stone-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-stone-800 cursor-pointer"
            >
              <LogOut size={14} /> Exit Admin
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 overflow-x-auto pb-1 mb-6 border-b border-[#E8DEC8]">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-2.5 rounded-t-2xl text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-white border-[#965215] text-[#965215] shadow-xs'
                : 'text-stone-600 border-transparent hover:text-stone-900'
            }`}
          >
            <LayoutDashboard size={16} />
            <span>Dashboard Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('branding')}
            className={`px-4 py-2.5 rounded-t-2xl text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'branding'
                ? 'bg-white border-[#965215] text-[#965215] shadow-xs'
                : 'text-stone-600 border-transparent hover:text-stone-900'
            }`}
          >
            <Camera size={16} />
            <span>Logo & Branding</span>
          </button>

          <button
            onClick={() => setActiveTab('products')}
            className={`px-4 py-2.5 rounded-t-2xl text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'products'
                ? 'bg-white border-[#965215] text-[#965215] shadow-xs'
                : 'text-stone-600 border-transparent hover:text-stone-900'
            }`}
          >
            <Package size={16} />
            <span>Products ({products.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2.5 rounded-t-2xl text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'orders'
                ? 'bg-white border-[#965215] text-[#965215] shadow-xs'
                : 'text-stone-600 border-transparent hover:text-stone-900'
            }`}
          >
            <ShoppingCart size={16} />
            <span>Orders ({orders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-4 py-2.5 rounded-t-2xl text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'inventory'
                ? 'bg-white border-[#965215] text-[#965215] shadow-xs'
                : 'text-stone-600 border-transparent hover:text-stone-900'
            }`}
          >
            <Package size={16} />
            <span>Inventory</span>
            {lowStockCount > 0 && <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] text-amber-800">{lowStockCount}</span>}
          </button>

          <button
            onClick={() => setActiveTab('shops')}
            className={`px-4 py-2.5 rounded-t-2xl text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'shops'
                ? 'bg-white border-[#965215] text-[#965215] shadow-xs'
                : 'text-stone-600 border-transparent hover:text-stone-900'
            }`}
          >
            <Store size={16} />
            <span>Shop Divisions ({shops.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('coupons')}
            className={`px-4 py-2.5 rounded-t-2xl text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'coupons'
                ? 'bg-white border-[#965215] text-[#965215] shadow-xs'
                : 'text-stone-600 border-transparent hover:text-stone-900'
            }`}
          >
            <Tag size={16} />
            <span>Coupons ({coupons.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2.5 rounded-t-2xl text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-white border-[#965215] text-[#965215] shadow-xs'
                : 'text-stone-600 border-transparent hover:text-stone-900'
            }`}
          >
            <Database size={16} />
            <span>Settings</span>
            {firebaseStatus.connected ? (
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block shrink-0" title="Connected to Firebase" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block shrink-0" title="Checking Firebase..." />
            )}
          </button>
        </div>

        {/* 1. DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Quick Logo Customizer Banner */}
            <div className="bg-gradient-to-r from-amber-50/90 via-white to-orange-50/50 p-4 sm:p-5 rounded-3xl border border-amber-200/90 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-white p-1 border border-amber-200 shadow-2xs shrink-0 flex items-center justify-center">
                  <Logo size="sm" variant="emblem" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-stone-900 font-['Marcellus']">
                      Store Logo Settings
                    </h3>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                      Direct Photo Upload
                    </span>
                  </div>
                  <p className="text-xs text-stone-600 mt-0.5">
                    Apne phone ya computer se direct photo/document upload karke store ka logo badal sakte hain.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab('branding')}
                className="w-full sm:w-auto px-4 py-2.5 bg-[#965215] text-white rounded-xl text-xs font-bold hover:bg-[#7D4311] flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
              >
                <Camera size={14} />
                <span>Upload / Change Logo</span>
              </button>
            </div>

            {/* Quick Coupons & Instagram Promo Banner */}
            <div className="bg-gradient-to-r from-purple-50/90 via-white to-pink-50/50 p-4 sm:p-5 rounded-3xl border border-purple-200/90 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-white p-1 border border-purple-200 shadow-2xs shrink-0 flex items-center justify-center text-purple-700">
                  <Tag size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-stone-900 font-['Marcellus']">
                      Coupons & Instagram Reel Promos
                    </h3>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-300">
                      {coupons.filter(c => c.active).length} Active Live
                    </span>
                  </div>
                  <p className="text-xs text-stone-600 mt-0.5">
                    Create promo codes like <strong className="font-mono text-purple-900">INSTA100</strong>, configure limits, expiry dates, and shopping type restrictions.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab('coupons')}
                className="w-full sm:w-auto px-4 py-2.5 bg-purple-900 text-white rounded-xl text-xs font-bold hover:bg-purple-950 flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer shrink-0"
              >
                <Tag size={14} />
                <span>Manage Coupons ({coupons.length})</span>
              </button>
            </div>

            {/* Top 4 Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-[#E8DEC8] shadow-xs">
                <span className="text-[10px] uppercase font-bold text-stone-400 block">Total Sales</span>
                <p className="text-xl sm:text-2xl font-extrabold text-[#7A3F0E] mt-1 font-mono">
                  ₹{totalRevenue.toLocaleString('en-IN')}
                </p>
                <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-1">
                  <TrendingUp size={13} /> Active Cashflow
                </span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-[#E8DEC8] shadow-xs">
                <span className="text-[10px] uppercase font-bold text-stone-400 block">Total Orders</span>
                <p className="text-xl sm:text-2xl font-extrabold text-stone-900 mt-1">
                  {totalOrdersCount}
                </p>
                <span className="text-[11px] text-stone-500 mt-1 block">Combined across 3 shops</span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-[#E8DEC8] shadow-xs">
                <span className="text-[10px] uppercase font-bold text-stone-400 block">Published Products</span>
                <p className="text-xl sm:text-2xl font-extrabold text-stone-900 mt-1">
                  {publishedProductsCount}
                </p>
                <span className="text-[11px] text-stone-500 mt-1 block">of {totalProductsCount} total products</span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-[#E8DEC8] shadow-xs">
                <span className="text-[10px] uppercase font-bold text-stone-400 block">Out of Stock Alert</span>
                <p className="text-xl sm:text-2xl font-extrabold text-red-600 mt-1">
                  {outOfStockCount}
                </p>
                <span className="text-[11px] text-stone-500 mt-1 block">Needs inventory re-order</span>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-[#E8DEC8] shadow-xs">
                <span className="text-[10px] uppercase font-bold text-stone-400 block">Total Inventory</span>
                <p className="text-xl sm:text-2xl font-extrabold text-stone-900 mt-1">{totalInventory.toLocaleString('en-IN')}</p>
                <span className="text-[11px] text-stone-500 mt-1 block">Sellable pieces across divisions</span>
              </div>
              <button type="button" onClick={() => setActiveTab('inventory')} className="text-left bg-white p-5 rounded-2xl border border-[#E8DEC8] shadow-xs hover:border-amber-300 transition-colors">
                <span className="text-[10px] uppercase font-bold text-stone-400 block">Low Stock</span>
                <p className="text-xl sm:text-2xl font-extrabold text-amber-700 mt-1">{lowStockCount}</p>
                <span className="text-[11px] text-stone-500 mt-1 block">At or below {lowStockThreshold} pieces</span>
              </button>
              <button type="button" onClick={() => setActiveTab('orders')} className="text-left bg-white p-5 rounded-2xl border border-[#E8DEC8] shadow-xs hover:border-amber-300 transition-colors">
                <span className="text-[10px] uppercase font-bold text-stone-400 block">Pending Orders</span>
                <p className="text-xl sm:text-2xl font-extrabold text-amber-700 mt-1">{pendingOrdersCount}</p>
                <span className="text-[11px] text-stone-500 mt-1 block">Awaiting confirmation</span>
              </button>
              <button type="button" onClick={() => setActiveTab('orders')} className="text-left bg-white p-5 rounded-2xl border border-[#E8DEC8] shadow-xs hover:border-amber-300 transition-colors">
                <span className="text-[10px] uppercase font-bold text-stone-400 block">Completed Orders</span>
                <p className="text-xl sm:text-2xl font-extrabold text-emerald-700 mt-1">{completedOrdersCount}</p>
                <span className="text-[11px] text-stone-500 mt-1 block">Delivered orders</span>
              </button>
            </div>

            {/* Shop-Wise Revenue & Order Breakdown */}
            <div className="bg-white p-6 rounded-3xl border border-[#E8DEC8] shadow-xs">
              <h3 className="font-bold text-base font-['Marcellus'] text-stone-900 mb-4">
                Shop-Wise Performance Breakdown
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {shopBreakdown.map(({ shop, productCount, orderCount, sales }) => {
                  const isShopActive = shop.status === 'active' || shop.isActive !== false;
                  return (
                    <div key={shop.id} className="bg-[#FAF7F2] p-4 rounded-2xl border border-[#E8DEC8]">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-stone-900">{shop.name}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isShopActive
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-stone-200 text-stone-600'
                          }`}
                        >
                          {isShopActive ? 'Active' : 'Disabled'}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-500">{shop.categoryName}</p>
                      <div className="mt-4 pt-3 border-t border-stone-200 grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-[10px] text-stone-400 block">Catalog</span>
                          <span className="font-bold text-stone-800">{productCount} Products</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-stone-400 block">Orders</span>
                          <span className="font-bold text-stone-800">{orderCount} Placed</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 2. PRODUCTS TAB */}
        {activeTab === 'products' && (
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-[#E8DEC8] shadow-xs space-y-4">
            {productSaveFeedback && (
              <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">
                {productSaveFeedback}
              </p>
            )}
            {/* Top Bar with Add Button & Filter */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <input
                    type="text"
                    placeholder="Search product..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-stone-50 border border-stone-300 rounded-xl"
                  />
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                </div>

                <select
                  value={productShopFilter}
                  onChange={(e) => setProductShopFilter(e.target.value)}
                  className="py-2 px-3 text-xs bg-stone-50 border border-stone-300 rounded-xl font-semibold text-stone-700"
                >
                  <option value="all">All Shops</option>
                  {divisionOptions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <select value={productCategoryFilter} onChange={(e) => setProductCategoryFilter(e.target.value)} className="py-2 px-3 text-xs bg-stone-50 border border-stone-300 rounded-xl font-semibold text-stone-700">
                  <option value="all">All Categories</option>
                  {categories.map((category) => <option key={category} value={category}>{category}</option>)}
                </select>
                <select value={productStatusFilter} onChange={(e) => setProductStatusFilter(e.target.value as 'all' | 'active' | 'inactive')} className="py-2 px-3 text-xs bg-stone-50 border border-stone-300 rounded-xl font-semibold text-stone-700">
                  <option value="all">All Visibility</option>
                  <option value="active">Published</option>
                  <option value="inactive">Unpublished</option>
                </select>
                <select value={productStockFilter} onChange={(e) => setProductStockFilter(e.target.value as 'all' | 'in_stock' | 'low_stock' | 'out_of_stock')} className="py-2 px-3 text-xs bg-stone-50 border border-stone-300 rounded-xl font-semibold text-stone-700">
                  <option value="all">All Stock</option>
                  <option value="in_stock">In Stock</option>
                  <option value="low_stock">Low Stock</option>
                  <option value="out_of_stock">Out of Stock</option>
                </select>
              </div>

              <button
                type="button"
                onClick={() => {
                  setEditingProduct(null);
                  setProductDraftId(createProductDraftId());
                  setProductImageSlots([]);
                  setProductImageError(null);
                  setImageUploadStatus({
                    isUploading: false,
                    current: 0,
                    total: 0,
                    isSuccess: false,
                  });
                  setProductForm({
                    shopId: 'vinayak-collection',
                    name: '',
                    description: '',
                    shortDescription: '',
                    price: 999,
                    salePrice: 499,
                    retail_price: 499,
                    retailPrice: 499,
                    wholesale_price: 2400,
                    wholesalePrice: 2400,
                    set_size: 12,
                    setSize: 12,
                    wholesale_minimum_sets: 1,
                    wholesaleMinimumSets: 1,
                    wholesale_enabled: true,
                    wholesaleEnabled: true,
                    images: [],
                    categoryName: 'Fashion',
                    stock: 20,
                    size_variants: [],
                    sizeVariants: [],
                    sizes: [],
                    has_sizes: false,
                    hasSizes: false,
                    size_chart: { type: 'none' },
                    sizeChart: { type: 'none' },
                    colors: ['Black', 'White', 'Blue', 'Red', 'Green', 'Maroon'],
                    brand: 'Vinayak Originals',
                    rating: 4.8,
                    reviewsCount: 1,
                    status: 'active',
                    isNew: true,
                  });
                  setIsProductModalOpen(true);
                }}
                className="w-full sm:w-auto px-4 py-2.5 bg-[#965215] hover:bg-[#7A3F0E] text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus size={16} />
                <span>ADD NEW PRODUCT</span>
              </button>
            </div>

            {/* Products Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-stone-200 text-stone-500 uppercase text-[10px]">
                    <th className="py-2.5 px-3">Product</th>
                    <th className="py-2.5 px-3">Shop Division</th>
                    <th className="py-2.5 px-3">Retail Price</th>
                    <th className="py-2.5 px-3">Wholesale Sets & Price</th>
                    <th className="py-2.5 px-3">Stock</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {adminFilteredProducts.map((p) => {
                    const shop = shops.find((s) => s.id === p.shopId);
                    const setSize = p.set_size || p.setSize || 12;
                    const wholesalePrice = p.wholesale_price || p.wholesalePrice || 0;
                    const wholesaleMin = p.wholesale_minimum_sets || p.wholesaleMinimumSets || 1;
                    const isWholesaleActive = p.wholesale_enabled ?? p.wholesaleEnabled ?? true;

                    return (
                      <tr key={p.id} className="hover:bg-stone-50">
                        <td className="py-2.5 px-3 flex items-center gap-2.5">
                          <img
                            src={p.images[0]}
                            alt=""
                            className="w-10 h-10 object-cover rounded-lg border border-stone-200 shrink-0"
                          />
                          <div className="truncate max-w-xs">
                            <span className="font-bold text-stone-900 block truncate">{p.name}</span>
                            <span className="text-[10px] text-stone-400">{p.categoryName}</span>
                          </div>
                        </td>

                        <td className="py-2.5 px-3 font-semibold text-stone-700">
                          {shop?.name || p.shopId}
                        </td>

                        <td className="py-2.5 px-3">
                          <span className="font-bold text-[#7A3F0E]">₹{p.salePrice}</span>
                          <span className="text-[10px] text-stone-400 block">/ piece</span>
                          {p.price > p.salePrice && (
                            <span className="text-[10px] text-stone-400 line-through block">₹{p.price}</span>
                          )}
                        </td>

                        <td className="py-2.5 px-3">
                          {isWholesaleActive ? (
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-amber-900 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded text-[11px]">
                                  ₹{wholesalePrice.toLocaleString('en-IN')} / set
                                </span>
                              </div>
                              <span className="text-[10px] text-stone-500 block mt-0.5">
                                1 Set = <strong>{setSize} pcs</strong> (Min {wholesaleMin} set)
                              </span>
                              <span className="text-[10px] text-amber-700 block">
                                ~₹{Math.round(wholesalePrice / setSize)} / pc
                              </span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-stone-400 bg-stone-100 px-2 py-0.5 rounded font-medium">
                              Wholesale Disabled
                            </span>
                          )}
                        </td>

                        <td className="py-2.5 px-3">
                          <span
                            className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                              p.stock <= 0
                                ? 'bg-red-100 text-red-700'
                                : p.stock <= 5
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-50 text-emerald-700'
                            }`}
                          >
                            {p.stock <= 0 ? '0 (Out)' : `${p.stock} pcs`}
                          </span>
                        </td>

                        <td className="py-2.5 px-3">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                              p.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-600'
                            }`}
                          >
                            {p.status}
                          </span>
                        </td>

                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenEditProduct(p)}
                              className="p-1.5 text-stone-600 hover:text-[#965215] hover:bg-stone-100 rounded-lg cursor-pointer"
                              title="Edit product"
                            >
                              <Edit size={15} />
                            </button>
                            <button
                              onClick={() => duplicateProduct(p)}
                              className="p-1.5 text-stone-500 hover:text-[#965215] hover:bg-stone-100 rounded-lg cursor-pointer"
                              title="Duplicate as unpublished product"
                            >
                              <Copy size={15} />
                            </button>
                            <button
                              onClick={() => deleteProduct(p.id)}
                              className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                              title="Delete product"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. INVENTORY TAB */}
        {activeTab === 'inventory' && (
          <div className="space-y-4">
            <div className="bg-white p-5 sm:p-6 rounded-3xl border border-[#E8DEC8] shadow-xs">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-['Marcellus'] text-lg font-bold text-stone-900">Inventory Control</h2>
                  <p className="mt-1 text-xs text-stone-500">Updates save directly to the canonical Firestore product document. Size-based products are edited at size level to preserve accurate stock.</p>
                </div>
                <div className="relative w-full sm:w-72">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input value={inventorySearch} onChange={(event) => setInventorySearch(event.target.value)} placeholder="Search name, SKU, category…" className="w-full rounded-xl border border-stone-300 bg-stone-50 py-2 pl-9 pr-3 text-xs" />
                </div>
              </div>
              {inventoryMessage && <p role="status" className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-900">{inventoryMessage}</p>}
            </div>

            <div className="overflow-hidden rounded-3xl border border-[#E8DEC8] bg-white shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-xs">
                  <thead className="border-b border-stone-200 bg-stone-50 text-[10px] font-bold uppercase tracking-wide text-stone-500">
                    <tr><th className="px-4 py-3">Product</th><th className="px-4 py-3">Division</th><th className="px-4 py-3">Availability</th><th className="px-4 py-3">Size stock</th><th className="px-4 py-3 text-right">Exact stock</th><th className="px-4 py-3 text-right">Actions</th></tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {inventoryProducts.map((product) => {
                      const variants = product.sizeVariants || product.size_variants || [];
                      const stock = Math.max(0, Number(product.stock) || 0);
                      const state = stock <= 0 ? 'OUT OF STOCK' : stock <= lowStockThreshold ? 'LOW STOCK' : 'IN STOCK';
                      const stateClass = stock <= 0 ? 'bg-red-100 text-red-700' : stock <= lowStockThreshold ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800';
                      return <tr key={product.id} className="hover:bg-stone-50/70">
                        <td className="px-4 py-3"><div className="font-bold text-stone-900">{product.name}</div><div className="mt-0.5 font-mono text-[10px] text-stone-400">{product.sku || product.id}</div></td>
                        <td className="px-4 py-3 text-stone-600">{shops.find((shop) => shop.id === product.shopId)?.name || product.shopId}</td>
                        <td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${stateClass}`}>{state}</span><div className="mt-1 text-[10px] text-stone-500">Threshold: {lowStockThreshold}</div></td>
                        <td className="px-4 py-3 text-stone-600">{variants.length ? <div className="flex max-w-xs flex-wrap gap-1">{variants.filter((variant) => variant.active !== false).map((variant) => <span key={variant.id} className="rounded bg-stone-100 px-1.5 py-0.5 text-[10px]">{variant.size}: {Math.max(0, Number(variant.stock_quantity ?? variant.stock) || 0)}</span>)}</div> : <span className="text-stone-400">No size variants</span>}</td>
                        <td className="px-4 py-3 text-right">{variants.length ? <span className="font-bold text-stone-800">{stock} pcs</span> : <input key={`${product.id}-${stock}`} type="number" min="0" defaultValue={stock} onBlur={(event) => { const next = Math.max(0, Math.floor(Number(event.target.value) || 0)); if (next !== stock) void saveInventory(product, next); }} className="w-20 rounded-lg border border-stone-300 bg-white px-2 py-1.5 text-right font-bold" />}</td>
                        <td className="px-4 py-3"><div className="flex justify-end gap-1.5">{!variants.length && <><button type="button" disabled={inventorySavingId === product.id || stock === 0} onClick={() => void saveInventory(product, stock - 1)} className="rounded-lg border border-stone-300 px-2 py-1 text-xs font-bold disabled:opacity-40">−1</button><button type="button" disabled={inventorySavingId === product.id} onClick={() => void saveInventory(product, stock + 1)} className="rounded-lg border border-stone-300 px-2 py-1 text-xs font-bold disabled:opacity-40">+1</button></>}<button type="button" onClick={() => handleOpenEditProduct(product)} className="rounded-lg bg-[#965215] px-2 py-1 text-xs font-bold text-white">{variants.length ? 'Edit sizes' : 'Edit'}</button></div></td>
                      </tr>;
                    })}
                    {!inventoryProducts.length && <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-stone-500">No products match this inventory search.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 4. ORDERS TAB */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            {/* Firebase Cloud Connection & Sync Banner */}
            <div className="bg-white p-4 sm:p-5 rounded-3xl border border-[#E8DEC8] shadow-xs">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-[#965215] shrink-0">
                    <Database size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-sm text-stone-900 font-['Marcellus']">
                        Firebase Cloud Database
                      </h4>
                      {firebaseStatus.connected ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Connected ({firebaseStatus.latencyMs}ms)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          Checking...
                        </span>
                      )}
                      <span className="text-[11px] text-stone-500 font-mono bg-stone-100 px-2 py-0.5 rounded-md">
                        Project: {FIREBASE_CONFIG.projectId}
                      </span>
                    </div>
                    <p className="text-xs text-stone-500 mt-1">
                      {firebaseStatus.tableExists
                        ? 'All customer checkout orders are automatically saved and retrievable in your Firebase database.'
                        : 'Firebase is not reachable. Check the project configuration, Firestore setup and network connection.'}
                    </p>
                  </div>
                </div>

                {/* Cloud actions */}
                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                  <button
                    type="button"
                    onClick={async () => {
                      setIsFetchingFromCloud(true);
                      setFirebaseFeedback('Fetching latest orders from Firebase cloud...');
                      const res = await fetchOrdersFromCloud();
                      setIsFetchingFromCloud(false);
                      setFirebaseFeedback(
                        res.success
                          ? `Fetched ${res.count} orders from Firebase cloud.`
                          : `Fetch note: ${res.error}`
                      );
                      setTimeout(() => setFirebaseFeedback(null), 4000);
                    }}
                    disabled={isFetchingFromCloud}
                    className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors"
                  >
                    {isFetchingFromCloud ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <RefreshCw size={13} />
                    )}
                    <span>Fetch Cloud Orders</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('settings')}
                    className="px-3 py-2 border border-stone-300 hover:border-[#965215] text-[#965215] rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <span>DB Settings &rarr;</span>
                  </button>
                </div>
              </div>

              {/* Feedback toast banner if any */}
              {firebaseFeedback && (
                <div className="mt-3 py-2 px-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 font-medium flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-[#965215]" />
                  <span>{firebaseFeedback}</span>
                </div>
              )}

              {/* Firebase connection guidance */}
              {!firebaseStatus.tableExists && (
                <div className="mt-3 p-3 bg-stone-50 border border-stone-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-stone-700">
                    <AlertTriangle size={15} className="text-amber-600 shrink-0" />
                    <span>
                      Firestore is currently unavailable. Check your Firebase configuration and deploy the Firestore rules and Cloud Functions.
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(FIREBASE_CONFIG.setupInstructions);
                        setCopiedInstructions(true);
                        setTimeout(() => setCopiedInstructions(false), 3000);
                      }}
                      className="px-3 py-1.5 bg-[#965215] hover:bg-[#7A3F0E] text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      {copiedInstructions ? <Check size={12} /> : <Copy size={12} />}
                      <span>{copiedInstructions ? 'Copied Instructions' : 'Copy Setup Instructions'}</span>
                    </button>
                    <a
                      href={`${FIREBASE_CONFIG.url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-white border border-stone-300 hover:bg-stone-50 text-stone-700 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <span>Open Firebase Console</span>
                      <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Orders List */}
            <div className="bg-white p-5 sm:p-6 rounded-3xl border border-[#E8DEC8] shadow-xs space-y-4">
              {(() => {
                const retailOrdersCount = orders.filter(
                  (o) => (o.orderType || o.order_type || 'retail') === 'retail'
                ).length;
                const wholesaleOrdersCount = orders.filter(
                  (o) => (o.orderType || o.order_type) === 'wholesale'
                ).length;
                const filteredOrdersList = orders.filter((o) => {
                  const m = o.orderType || o.order_type || 'retail';
                  if (orderTypeFilter === 'all') return true;
                  return m === orderTypeFilter;
                });

                return (
                  <>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
                      <div>
                        <h3 className="font-bold text-base font-['Marcellus'] text-stone-900">
                          Customer Orders ({orders.length})
                        </h3>
                        <span className="text-xs text-stone-500 font-medium">
                          Orders stream live from the same Firebase database used by checkout.
                        </span>
                      </div>

                      {/* Orders Mode Filter: All / Retail / Wholesale */}
                      <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl">
                        <button
                          type="button"
                          onClick={() => setOrderTypeFilter('all')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            orderTypeFilter === 'all'
                              ? 'bg-white text-stone-900 shadow-2xs'
                              : 'text-stone-600 hover:text-stone-900'
                          }`}
                        >
                          All ({orders.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setOrderTypeFilter('retail')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                            orderTypeFilter === 'retail'
                              ? 'bg-[#965215] text-white shadow-2xs'
                              : 'text-stone-600 hover:text-stone-900'
                          }`}
                        >
                          <span>🛍️ Retail</span>
                          <span>({retailOrdersCount})</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setOrderTypeFilter('wholesale')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                            orderTypeFilter === 'wholesale'
                              ? 'bg-amber-700 text-white shadow-2xs'
                              : 'text-stone-600 hover:text-stone-900'
                          }`}
                        >
                          <span>📦 Wholesale</span>
                          <span>({wholesaleOrdersCount})</span>
                        </button>
                      </div>
                    </div>

                    {filteredOrdersList.length === 0 ? (
                      <div className="py-12 text-center text-stone-500">
                        <p className="text-sm font-semibold">No orders found matching this filter.</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-stone-100">
                        {filteredOrdersList.map((order) => {
                          const isWholesaleOrder =
                            order.orderType === 'wholesale' || order.order_type === 'wholesale';
                          const customerPhone =
                            order.customerMobile ||
                            order.shippingAddress?.mobile ||
                            order.shippingAddress?.phone ||
                            order.customer?.phone ||
                            '';
                          const customerName =
                            order.customerName ||
                            order.shippingAddress?.fullName ||
                            order.customer?.fullName ||
                            'Valued Customer';
                          const customerCity =
                            order.shippingAddress?.city ||
                            order.customer?.city ||
                            'India';

                          const customerWhatsApp = `https://wa.me/91${customerPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                            `Namaste ${customerName}, this is VC MART regarding your ${isWholesaleOrder ? 'wholesale' : 'retail'} order #${order.orderNumber || order.id}.`
                          )}`;

                          return (
                            <div key={order.id} className="py-4 space-y-3">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-mono font-bold text-sm text-stone-900">
                                      #{order.orderNumber || order.id}
                                    </span>

                                    {/* Order Type Badge (Retail vs Wholesale) */}
                                    {isWholesaleOrder ? (
                                      <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                                        <span>📦 WHOLESALE ORDER</span>
                                      </span>
                                    ) : (
                                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 border border-stone-200">
                                        🛍️ RETAIL ORDER
                                      </span>
                                    )}

                                    {order.paymentMethod === 'razorpay' ? (
                                      <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${
                                        order.paymentStatus === 'Paid'
                                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                          : 'bg-amber-50 text-amber-800 border-amber-300'
                                      }`}>
                                        Razorpay Live ({order.paymentStatus || 'Paid'})
                                      </span>
                                    ) : (
                                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-stone-100 text-stone-700">
                                        {order.paymentMethod === 'cod' ? 'Cash on Delivery' : order.paymentMethod}
                                      </span>
                                    )}
                                    {order.razorpayPaymentId && (
                                      <span className="font-mono text-[10px] font-bold text-[#7A3F0E] bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full" title="Razorpay Payment ID">
                                        Pay ID: {order.razorpayPaymentId}
                                      </span>
                                    )}
                                    {order.razorpayOrderId && (
                                      <span className="font-mono text-[10px] text-stone-600 bg-stone-50 border border-stone-200 px-2 py-0.5 rounded-full" title="Razorpay Order ID">
                                        Rzp Order: {order.razorpayOrderId}
                                      </span>
                                    )}
                                    <span className="text-xs text-stone-400">
                                      {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                    </span>

                                    <span className="text-[10px] font-semibold text-emerald-700">Firebase</span>
                                  </div>
                                  <p className="text-xs font-semibold text-stone-700 mt-1">
                                    {customerName} &bull; +91 {customerPhone} &bull; {customerCity}
                                  </p>
                                </div>

                                <div className="flex items-center gap-2">
                                  {/* Status dropdown */}
                                  <select
                                    value={order.orderStatus}
                                    onChange={(e) => {
                                      void updateOrderStatus(order.id, e.target.value as any)
                                        .then(() => setFirebaseFeedback(`Order ${order.orderNumber || order.id} updated in Firebase.`))
                                        .catch((error) => setFirebaseFeedback(error instanceof Error ? error.message : 'Could not update order status.'));
                                    }}
                                    className="text-xs font-bold py-1.5 px-3 bg-stone-50 border border-stone-300 rounded-xl focus:border-[#965215] cursor-pointer"
                                  >
                                    <option value="pending">Pending</option>
                                    <option value="confirmed">Confirmed</option>
                                    <option value="processing">Processing</option>
                                    <option value="packed">Packed</option>
                                    <option value="shipped">Shipped</option>
                                    <option value="out_for_delivery">Out for Delivery</option>
                                    <option value="delivered">Delivered</option>
                                    <option value="cancelled">Cancelled</option>
                                    <option value="returned">Returned</option>
                                  </select>

                                  {/* WhatsApp Customer */}
                                  <a
                                    href={customerWhatsApp}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1.5 bg-[#25D366] text-white rounded-lg hover:bg-emerald-600 transition-colors"
                                    title="Message customer on WhatsApp"
                                  >
                                    <MessageCircle size={16} />
                                  </a>
                                </div>
                              </div>

                              {/* Items row */}
                              <div className="bg-[#FAF7F2] p-3 rounded-xl border border-[#E8DEC8] text-xs flex flex-wrap gap-4 items-center justify-between">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-bold text-stone-700">Items:</span>
                                  {order.items.map((it, idx) => {
                                    const isWsItem =
                                      isWholesaleOrder ||
                                      it.orderType === 'wholesale' ||
                                      it.order_type === 'wholesale' ||
                                      (it.numberOfSets && it.numberOfSets > 0);
                                    const setsCount = it.numberOfSets || it.number_of_sets || it.quantity;
                                    const setSize =
                                      it.setSize || it.set_size || it.product?.setSize || it.product?.set_size || 12;
                                    const totalPieces =
                                      it.totalPieces || it.total_pieces || (setsCount * setSize);

                                    return (
                                      <span
                                        key={idx}
                                        className="bg-white border border-stone-200 px-2.5 py-1 rounded-lg text-[11px] text-stone-800 flex items-center gap-1.5 flex-wrap shadow-2xs"
                                      >
                                        <span className="font-semibold">{it.name || it.product?.name}</span>
                                        {it.selectedColor && !isWsItem && (
                                          <span className="bg-stone-100 text-stone-800 font-bold text-[10px] px-2 py-0.5 rounded border border-stone-200">
                                            Color: {it.selectedColor}
                                          </span>
                                        )}
                                        {it.selectedSize && (
                                          <span className="bg-[#965215]/10 text-[#965215] font-extrabold text-[10px] px-2 py-0.5 rounded border border-[#965215]/30">
                                            Size: {it.selectedSize}
                                          </span>
                                        )}
                                        {isWsItem ? (
                                          <span className="bg-amber-100 text-amber-900 font-bold text-[10px] px-2 py-0.5 rounded border border-amber-200">
                                            MIX COLOR SET: {setsCount} {setsCount === 1 ? 'Set' : 'Sets'} ({totalPieces} Pieces • {setSize} pcs/set)
                                          </span>
                                        ) : (
                                          <span className="bg-stone-100 text-stone-700 font-bold text-[10px] px-1.5 py-0.5 rounded">
                                            x{it.quantity} Pcs
                                          </span>
                                        )}
                                      </span>
                                    );
                                  })}
                                </div>

                                <div className="font-bold text-stone-900">
                                  Total: <span className="text-[#7A3F0E] text-sm">₹{(order.totalAmount || order.total || 0).toLocaleString('en-IN')}</span>
                                </div>
                              </div>

                              <label className="flex max-w-md items-center gap-2 text-xs font-semibold text-stone-600">
                                Tracking ID
                                <input
                                  key={`${order.id}-${order.trackingNumber || ''}`}
                                  defaultValue={order.trackingNumber || ''}
                                  onBlur={(event) => {
                                    const nextTracking = event.target.value.trim();
                                    if (nextTracking !== (order.trackingNumber || '')) {
                                      void updateOrderStatus(order.id, order.orderStatus, nextTracking)
                                        .then(() => setFirebaseFeedback(`Tracking ID saved for ${order.orderNumber || order.id}.`))
                                        .catch((error) => setFirebaseFeedback(error instanceof Error ? error.message : 'Could not save tracking ID.'));
                                    }
                                  }}
                                  placeholder="Courier tracking number"
                                  className="min-w-0 flex-1 rounded-lg border border-stone-300 bg-white px-2 py-1.5 text-xs font-normal"
                                />
                              </label>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        )}

        {/* 4. SHOPS TAB */}
        {activeTab === 'shops' && (
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-[#E8DEC8] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base font-['Marcellus'] text-stone-900">
                  Business Divisions / Shops
                </h3>
                <p className="text-xs text-stone-500">
                  Manage existing business units or onboard a 4th retail division.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setEditingShop(null);
                  setShopForm({
                    name: '',
                    categoryName: '',
                    description: '',
                    phone: '+91 86849 33759',
                    email: 'vcmartshop@gmail.com',
                    isActive: true,
                    bannerImage: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1200&auto=format&fit=crop',
                    categories: ['General'],
                  });
                  setIsShopModalOpen(true);
                }}
                className="px-4 py-2 bg-[#965215] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Plus size={14} /> Add New Shop
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {shops.map((s) => {
                const isShopActive = s.status === 'active' || s.isActive !== false;
                return (
                  <div key={s.id} className="p-4 rounded-2xl border border-stone-200 bg-[#FAF7F2] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-sm text-stone-900">{s.name}</h4>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isShopActive
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-stone-200 text-stone-600'
                          }`}
                        >
                          {isShopActive ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                      <p className="text-xs text-[#965215] font-semibold">{s.categoryName}</p>
                      <p className="text-xs text-stone-600 mt-1 font-mono font-medium">📞 {s.phone || '8684933759'}</p>
                      <p className="text-xs text-stone-600 mt-2 line-clamp-2">{s.description}</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-stone-200 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() =>
                          updateShop({
                            ...s,
                            status: isShopActive ? 'inactive' : 'active',
                            isActive: !isShopActive,
                          })
                        }
                        className="text-xs font-bold text-stone-700 hover:text-stone-950 underline cursor-pointer"
                      >
                        {isShopActive ? 'Disable Shop' : 'Enable Shop'}
                      </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingShop(s);
                        setShopForm(s);
                        setIsShopModalOpen(true);
                      }}
                      className="text-xs font-bold text-[#965215] hover:underline cursor-pointer"
                    >
                      Edit Info &rarr;
                    </button>
                  </div>
                </div>
              );
            })}
            </div>
          </div>
        )}

        {/* 5. LOGO & BRANDING TAB */}
        {activeTab === 'branding' && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E8DEC8] shadow-xs">
            <LogoManager />
          </div>
        )}

        {/* Firebase deployment status */}
        {activeTab === 'settings' && (
          <section className="rounded-3xl border border-[#E8DEC8] bg-white p-6 sm:p-8 shadow-sm">
            <h2 className="font-['Marcellus'] text-xl font-bold text-stone-900">Store settings</h2>
            <p className="mt-2 text-sm text-stone-600">Delivery policy is saved in Firestore and updates across the storefront and checkout.</p>
            <form className="mt-5 grid gap-4 sm:grid-cols-2" onSubmit={async (event) => {
              event.preventDefault(); setSettingsSaving(true); setSettingsMessage(null);
              try {
                await saveStoreSettings({ freeDeliveryThreshold: Math.max(0, Math.floor(freeThresholdInput)), standardDeliveryFee: Math.max(0, Math.floor(deliveryFeeInput)), lowStockThreshold: Math.max(0, Math.floor(lowStockThresholdInput)) });
                setSettingsMessage('Delivery and inventory settings saved to Firebase.');
              } catch (error) { setSettingsMessage(error instanceof Error ? error.message : 'Could not save settings.'); }
              finally { setSettingsSaving(false); }
            }}>
              <label className="text-sm font-semibold text-stone-700">Free delivery threshold (₹)
                <input type="number" min="0" required value={freeThresholdInput} onChange={(event) => setFreeThresholdInput(Number(event.target.value))} className="mt-1 w-full rounded-xl border border-stone-300 bg-stone-50 px-3 py-2" />
              </label>
              <label className="text-sm font-semibold text-stone-700">Standard delivery fee (₹)
                <input type="number" min="0" required value={deliveryFeeInput} onChange={(event) => setDeliveryFeeInput(Number(event.target.value))} className="mt-1 w-full rounded-xl border border-stone-300 bg-stone-50 px-3 py-2" />
              </label>
              <label className="text-sm font-semibold text-stone-700">Low-stock threshold
                <input type="number" min="0" required value={lowStockThresholdInput} onChange={(event) => setLowStockThresholdInput(Number(event.target.value))} className="mt-1 w-full rounded-xl border border-stone-300 bg-stone-50 px-3 py-2" />
              </label>
              <div className="sm:col-span-2 flex items-center gap-3">
                <button disabled={settingsSaving} className="rounded-xl bg-[#965215] px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{settingsSaving ? 'Saving…' : 'Save delivery settings'}</button>
                {settingsMessage && <span role="status" className="text-sm text-stone-600">{settingsMessage}</span>}
              </div>
            </form>
            <div className="mt-5 rounded-2xl bg-[#FAF7F2] p-4 text-sm text-stone-700">
              <p><strong>Project:</strong> {FIREBASE_CONFIG.projectId}</p>
              <p className="mt-1"><strong>Products:</strong> Firestore <code>products</code></p>
              <p><strong>Images:</strong> Firebase Storage <code>{PRODUCT_STORAGE_PATH}</code></p>
              <p className="mt-1">Deploy Firestore rules, Storage rules and Cloud Functions with the Firebase CLI.</p>
            </div>
            <a className="mt-5 inline-flex rounded-xl bg-[#965215] px-4 py-2 text-sm font-bold text-white" href={FIREBASE_CONFIG.url} target="_blank" rel="noreferrer">Open Firebase Console</a>
          </section>
        )}
        {/* 6. COUPONS TAB */}
        {activeTab === 'coupons' && (
          <AdminCouponsManager />
        )}
      </div>

      {/* Add / Edit Product Modal */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <h3 className="font-bold text-base text-stone-900 font-['Marcellus']">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h3>
              <button onClick={() => setIsProductModalOpen(false)} className="text-stone-400 hover:text-stone-900 cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="py-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Target Shop Division *</label>
                <select
                  value={productForm.shopId}
                  onChange={(e) => setProductForm({ ...productForm, shopId: e.target.value as ShopId })}
                  className="w-full p-2 bg-stone-50 border border-stone-300 rounded-xl"
                >
                  {divisionOptions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.id === 'vinayak-collection' ? 'Vinayak Collection' : s.id === 'kinshuk-spare-parts' ? 'Kinshuk Spare Parts' : 'Khushi Communication'} ({s.categoryName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Product Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Slim Fit Cotton Formal Shirt"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  className="w-full p-2 bg-stone-50 border border-stone-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">SKU / Product Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. VC-TEST-001"
                  value={productForm.sku || ''}
                  onChange={(e) => setProductForm({ ...productForm, sku: e.target.value.toUpperCase() })}
                  className="w-full p-2 bg-stone-50 border border-stone-300 rounded-xl font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">MRP Price (₹) *</label>
                  <input
                    type="number"
                    required
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })}
                    className="w-full p-2 bg-stone-50 border border-stone-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Retail Price (₹) *</label>
                  <input
                    type="number"
                    required
                    value={productForm.salePrice}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        salePrice: Number(e.target.value),
                        retail_price: Number(e.target.value),
                        retailPrice: Number(e.target.value),
                      })
                    }
                    className="w-full p-2 bg-stone-50 border border-stone-300 rounded-xl font-bold text-[#7A3F0E]"
                  />
                  <span className="text-[10px] text-stone-400 mt-0.5 block">Customer price per piece in Retail Mode</span>
                </div>
              </div>

              {/* Category / Type field */}
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Category / Type *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Shirts / Oversize T-Shirt / Jeans / Kurta Set / Fog Lights"
                  value={productForm.categoryName}
                  onChange={(e) => setProductForm({ ...productForm, categoryName: e.target.value })}
                  className="w-full p-2 bg-stone-50 border border-stone-300 rounded-xl"
                />
                <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                  <span className="text-[10px] text-stone-400 font-semibold">Quick Types:</span>
                  {['T-Shirt', 'Shirt', 'Jeans', 'Kurta Set', 'Suit / Palazzo', 'Lower / Pants', 'Bike Fog Light', 'Mobile Cover'].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setProductForm({ ...productForm, categoryName: cat })}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-stone-100 hover:bg-amber-100 text-stone-600 hover:text-[#965215] border border-stone-200 transition-colors cursor-pointer"
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 rounded-xl border border-stone-200 bg-stone-50 p-3">
                <label className="text-xs font-semibold text-stone-700">
                  Catalog visibility
                  <select value={productForm.status || 'active'} onChange={(event) => setProductForm({ ...productForm, status: event.target.value as Product['status'] })} className="mt-1 w-full rounded-lg border border-stone-300 bg-white p-2 text-xs">
                    <option value="active">Published</option>
                    <option value="inactive">Unpublished</option>
                  </select>
                </label>
                <label className="mt-5 flex items-center gap-2 text-xs font-semibold text-stone-700">
                  <input type="checkbox" checked={Boolean(productForm.isFeatured)} onChange={(event) => setProductForm({ ...productForm, isFeatured: event.target.checked })} />
                  Featured product
                </label>
                <label className="flex items-center gap-2 text-xs font-semibold text-stone-700">
                  <input type="checkbox" checked={Boolean(productForm.isNew)} onChange={(event) => setProductForm({ ...productForm, isNew: event.target.checked })} />
                  Show as new arrival
                </label>
              </div>

              {/* AVAILABLE COLORS (RETAIL) Section (Immediately after category for clothing) */}
              {isClothingCategory(productForm.categoryName, productForm.shopId) && (
                <AdminProductColorManager
                  categoryName={productForm.categoryName || ''}
                  shopId={productForm.shopId || 'vinayak-collection'}
                  colors={(productForm.colors as string[]) || []}
                  onChangeColors={(newColors) => {
                    setProductForm((prev) => ({
                      ...prev,
                      colors: newColors,
                      color_variants: newColors.map((c, idx) => ({
                        name: c,
                        hex: getColorHex(c),
                        imageUrl: (prev.images && prev.images[idx % prev.images.length]) || prev.image || prev.image_url,
                      })),
                      colorVariants: newColors.map((c, idx) => ({
                        name: c,
                        hex: getColorHex(c),
                        imageUrl: (prev.images && prev.images[idx % prev.images.length]) || prev.image || prev.image_url,
                      })),
                      clothingDetails: {
                        ...(prev.clothingDetails || { sizes: [] }),
                        colors: newColors,
                      },
                    }));
                  }}
                />
              )}

              {/* SIZE & INVENTORY Section (Immediately after category for clothing) */}
              {isClothingCategory(productForm.categoryName, productForm.shopId) && (
                <AdminProductSizeManager
                  categoryName={productForm.categoryName || ''}
                  shopId={productForm.shopId || 'vinayak-collection'}
                  sizeVariants={productForm.size_variants || productForm.sizeVariants || []}
                  onChangeVariants={(variants) => {
                    const total = calculateTotalStockFromVariants(variants);
                    setProductForm((prev) => ({
                      ...prev,
                      size_variants: variants,
                      sizeVariants: variants,
                      sizes: variants.filter((v) => v.active !== false).map((v) => v.size),
                      has_sizes: variants.length > 0,
                      hasSizes: variants.length > 0,
                      stock: variants.length > 0 ? total : prev.stock,
                    }));
                  }}
                  sizeChart={productForm.size_chart || productForm.sizeChart}
                  onChangeSizeChart={(chart) => {
                    setProductForm((prev) => ({
                      ...prev,
                      size_chart: chart,
                      sizeChart: chart,
                    }));
                  }}
                  initialStock={productForm.stock || 20}
                  onTotalStockChange={(total) => {
                    setProductForm((prev) => ({
                      ...prev,
                      stock: total,
                    }));
                  }}
                />
              )}

              {/* Stock Quantity (Auto-calculated when sizes exist, manual otherwise) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-semibold text-stone-700">
                    Stock Quantity (Total pieces) *
                  </label>
                  {isClothingCategory(productForm.categoryName, productForm.shopId) && (productForm.size_variants?.length || 0) > 0 && (
                    <span className="text-[10px] font-bold text-[#965215] bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                      ⚡ Automatically calculated from sizes
                    </span>
                  )}
                </div>
                <input
                  type="number"
                  required
                  min="0"
                  readOnly={isClothingCategory(productForm.categoryName, productForm.shopId) && (productForm.size_variants?.length || 0) > 0}
                  value={productForm.stock}
                  onChange={(e) => setProductForm({ ...productForm, stock: Number(e.target.value) })}
                  className={`w-full p-2 rounded-xl border ${
                    isClothingCategory(productForm.categoryName, productForm.shopId) && (productForm.size_variants?.length || 0) > 0
                      ? 'bg-amber-50/50 border-amber-300 font-bold text-[#7A3F0E] cursor-not-allowed'
                      : 'bg-stone-50 border-stone-300'
                  }`}
                />
              </div>

              {/* Wholesale Pricing & Set Configuration Section */}
              <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">📦</span>
                    <div>
                      <h4 className="font-bold text-xs text-stone-900 uppercase tracking-wide">
                        Wholesale Set & Pricing Rules
                      </h4>
                      <p className="text-[11px] text-stone-500">
                        Independent wholesale pricing and set-based bulk ordering rules
                      </p>
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 rounded-xl border border-amber-200 text-xs font-bold text-stone-800 shadow-2xs">
                    <input
                      type="checkbox"
                      checked={productForm.wholesale_enabled ?? productForm.wholesaleEnabled ?? true}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          wholesale_enabled: e.target.checked,
                          wholesaleEnabled: e.target.checked,
                        })
                      }
                      className="rounded text-[#965215] focus:ring-[#965215]"
                    />
                    <span>Wholesale Enabled</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Wholesale Price (₹ / Set) *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={productForm.wholesale_price ?? productForm.wholesalePrice ?? 2400}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          wholesale_price: Number(e.target.value),
                          wholesalePrice: Number(e.target.value),
                        })
                      }
                      className="w-full p-2 bg-white border border-amber-300 rounded-xl text-xs font-bold text-[#7A3F0E]"
                    />
                    <span className="text-[10px] text-stone-400 mt-0.5 block">Price for 1 full set</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Set Size (Pieces in 1 Set) *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={productForm.set_size ?? productForm.setSize ?? 12}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          set_size: Math.max(1, Number(e.target.value)),
                          setSize: Math.max(1, Number(e.target.value)),
                        })
                      }
                      className="w-full p-2 bg-white border border-amber-300 rounded-xl text-xs font-bold text-stone-800"
                    />
                    <span className="text-[10px] text-stone-400 mt-0.5 block">e.g. 12 pieces/set</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Minimum Order (Sets) *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={productForm.wholesale_minimum_sets ?? productForm.wholesaleMinimumSets ?? 1}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          wholesale_minimum_sets: Math.max(1, Number(e.target.value)),
                          wholesaleMinimumSets: Math.max(1, Number(e.target.value)),
                        })
                      }
                      className="w-full p-2 bg-white border border-amber-300 rounded-xl text-xs font-bold text-stone-800"
                    />
                    <span className="text-[10px] text-stone-400 mt-0.5 block">Min 1 set</span>
                  </div>
                </div>

                {/* Wholesale Set Type & Set Colors */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-amber-200/60">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Wholesale Set Type
                    </label>
                    <select
                      value={productForm.wholesale_set_type || 'MIX COLOR SET'}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          wholesale_set_type: e.target.value,
                        })
                      }
                      className="w-full p-2 bg-white border border-amber-300 rounded-xl text-xs font-bold text-blue-900 cursor-pointer"
                    >
                      <option value="MIX COLOR SET">MIX COLOR SET (Pre-bundled mix colors)</option>
                      <option value="SINGLE COLOR PACK">SINGLE COLOR PACK</option>
                    </select>
                    <span className="text-[10px] text-stone-400 mt-0.5 block">Mix color set automatically packs 1 piece per color</span>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-stone-700">
                        Colors in 1 Set (Mix Colors)
                      </label>
                      <span className="text-[10px] font-bold text-blue-800 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                        {((productForm.wholesale_mix_colors || productForm.wholesaleMixColors) || ['Black', 'White', 'Blue', 'Red', 'Green', 'Maroon']).length} Colors
                      </span>
                    </div>
                    <input
                      type="text"
                      placeholder="e.g. Black, White, Blue, Red, Green, Maroon"
                      value={((productForm.wholesale_mix_colors || productForm.wholesaleMixColors) || ['Black', 'White', 'Blue', 'Red', 'Green', 'Maroon']).join(', ')}
                      onChange={(e) => {
                        const parsed = e.target.value
                          .split(',')
                          .map((c) => c.trim())
                          .filter(Boolean);
                        setProductForm({
                          ...productForm,
                          wholesale_mix_colors: parsed,
                          wholesaleMixColors: parsed,
                        });
                      }}
                      className="w-full p-2 bg-white border border-amber-300 rounded-xl text-xs font-semibold text-stone-800"
                    />
                    <span className="text-[10px] text-stone-400 mt-0.5 block">Separate color names by commas</span>
                  </div>
                </div>

                {/* Wholesale Available Sizes */}
                <div className="pt-2 border-t border-amber-200/60">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-stone-700">
                      Wholesale Available Sizes
                    </label>
                    <span className="text-[10px] text-stone-500 font-mono">
                      (e.g. M, L, XL, XXL)
                    </span>
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. M, L, XL, XXL"
                    value={((productForm.wholesale_available_sizes || productForm.wholesaleAvailableSizes) || productForm.sizes || ['M', 'L', 'XL', 'XXL']).join(', ')}
                    onChange={(e) => {
                      const parsed = e.target.value
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean);
                      setProductForm({
                        ...productForm,
                        wholesale_available_sizes: parsed,
                        wholesaleAvailableSizes: parsed,
                      });
                    }}
                    className="w-full p-2 bg-white border border-amber-300 rounded-xl text-xs font-bold text-blue-900 mb-2"
                  />
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-stone-400 font-semibold">Quick Sizes:</span>
                    {['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'].map((sz) => {
                      const current = (productForm.wholesale_available_sizes || productForm.wholesaleAvailableSizes) || productForm.sizes || ['M', 'L', 'XL', 'XXL'];
                      const isIncluded = current.includes(sz);
                      return (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => {
                            const next = isIncluded
                              ? current.filter((x) => x !== sz)
                              : [...current, sz];
                            setProductForm({
                              ...productForm,
                              wholesale_available_sizes: next,
                              wholesaleAvailableSizes: next,
                            });
                          }}
                          className={`text-[10px] px-2 py-0.5 rounded-md font-bold border transition-colors cursor-pointer ${
                            isIncluded
                              ? 'bg-blue-900 text-white border-blue-900'
                              : 'bg-white text-stone-600 border-stone-300 hover:border-blue-400'
                          }`}
                        >
                          {sz} {isIncluded ? '✓' : '+'}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Dynamic Wholesale Calculation Preview */}
                {(() => {
                  const setSize = Number(productForm.set_size || productForm.setSize || 12);
                  const wsPrice = Number(productForm.wholesale_price || productForm.wholesalePrice || 0);
                  const pieceRate = setSize > 0 ? Math.round(wsPrice / setSize) : 0;
                  const retailPiece = Number(productForm.salePrice || 0);
                  return (
                    <div className="bg-white/80 p-2.5 rounded-xl border border-amber-200 text-[11px] text-stone-600 flex items-center justify-between flex-wrap gap-2">
                      <div>
                        Calculated wholesale rate: <strong className="text-[#965215]">₹{pieceRate} / piece</strong>
                        {' '}(Retail: ₹{retailPiece} / piece)
                      </div>
                      <div className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Customer saves {retailPiece > pieceRate ? `₹${retailPiece - pieceRate}/pc (${Math.round(((retailPiece - pieceRate) / retailPiece) * 100)}%)` : 'bulk rates'}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Product Images Drag & Drop Direct Upload System */}
              <div className="pt-1 pb-1">
                <AdminProductImageUploader
                  key={productDraftId || editingProduct?.id || 'new-product'}
                  initialImages={productForm.images || []}
                  onChange={handleProductImageSlotsChange}
                  uploadImage={(file, onProgress) => uploadProductImage(file, productDraftId || editingProduct?.id || createProductDraftId(), onProgress)}
                  onUploadStatusChange={setImageUploadStatus}
                  onUploadError={setProductImageError}
                  uploadStatus={imageUploadStatus}
                />
                {productImageError && (
                  <p className="mt-2 text-xs font-bold text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200 animate-fadeIn">
                    ⚠️ {productImageError}
                  </p>
                )}
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Description *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Describe the product, material, fit, compatibility, or key features."
                  value={productForm.description || ''}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  className="w-full p-2 bg-stone-50 border border-stone-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Short Description</label>
                <textarea
                  rows={2}
                  value={productForm.shortDescription || ''}
                  onChange={(e) => setProductForm({ ...productForm, shortDescription: e.target.value })}
                  className="w-full p-2 bg-stone-50 border border-stone-300 rounded-xl"
                />
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  disabled={isProductSaving || imageUploadStatus.isUploading}
                  onClick={() => setIsProductModalOpen(false)}
                  className="flex-1 py-2.5 border border-stone-300 rounded-xl font-bold text-stone-700 cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProductSaving}
                  className="flex-1 py-2.5 bg-[#965215] hover:bg-[#7A3F0E] text-white rounded-xl font-bold cursor-pointer flex items-center justify-center gap-2 disabled:opacity-75 shadow-sm transition-all"
                >
                  {isProductSaving ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>{imageUploadStatus.isUploading ? 'Uploading Images...' : 'Saving Product...'}</span>
                    </>
                  ) : (
                    <span>Save Product</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Shop Modal */}
      {isShopModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <h3 className="font-bold text-base text-stone-900 font-['Marcellus']">
                {editingShop ? 'Edit Shop Division' : 'Add New Business Shop'}
              </h3>
              <button onClick={() => setIsShopModalOpen(false)} className="text-stone-400 hover:text-stone-900 cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveShop} className="py-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Shop Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vinayak Footwear"
                  value={shopForm.name}
                  onChange={(e) => setShopForm({ ...shopForm, name: e.target.value })}
                  className="w-full p-2 bg-stone-50 border border-stone-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Shoes & Footwear"
                  value={shopForm.categoryName}
                  onChange={(e) => setShopForm({ ...shopForm, categoryName: e.target.value })}
                  className="w-full p-2 bg-stone-50 border border-stone-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={shopForm.description}
                  onChange={(e) => setShopForm({ ...shopForm, description: e.target.value })}
                  className="w-full p-2 bg-stone-50 border border-stone-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Phone / WhatsApp Number</label>
                <input
                  type="text"
                  placeholder="e.g. +91 86849 33759"
                  value={shopForm.phone || ''}
                  onChange={(e) => setShopForm({ ...shopForm, phone: e.target.value, whatsapp: e.target.value })}
                  className="w-full p-2 bg-stone-50 border border-stone-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Shop Email</label>
                <input
                  type="email"
                  placeholder="e.g. vcmartshop@gmail.com"
                  value={shopForm.email || ''}
                  onChange={(e) => setShopForm({ ...shopForm, email: e.target.value })}
                  className="w-full p-2 bg-stone-50 border border-stone-300 rounded-xl"
                />
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsShopModalOpen(false)}
                  className="flex-1 py-2.5 border border-stone-300 rounded-xl font-bold text-stone-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#965215] text-white rounded-xl font-bold cursor-pointer"
                >
                  Save Division
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
