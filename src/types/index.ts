export type ShopId = 'vinayak-collection' | 'kinshuk-spare-parts' | 'khushi-communication' | string;

export interface Shop {
  id: ShopId;
  name: string;
  slug: string;
  subtitle: string;
  categoryName: string;
  tagline: string;
  description: string;
  badgeColor: string;
  accentColor: string;
  bgLight: string;
  bannerImage: string;
  logoIcon: string;
  phone: string;
  whatsapp: string;
  address: string;
  email?: string;
  status: 'active' | 'inactive' | 'draft' | 'out_of_stock';
  isActive?: boolean;
  categories: string[];
}

export interface ProductColorItem {
  name: string;
  hex: string;
  imageUrl?: string;
}

export interface ProductSizeVariant {
  id: string;
  product_id?: string;
  productId?: string;
  size: string;
  color_name?: string;
  colorName?: string;
  color_hex?: string;
  colorHex?: string;
  color_image?: string;
  image_url?: string;
  stock_quantity: number;
  stock?: number;
  sku?: string;
  price_override?: number;
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface SizeChartRow {
  size: string;
  chest?: string | number;
  length?: string | number;
  shoulder?: string | number;
  waist?: string | number;
  hip?: string | number;
  [key: string]: any;
}

export interface ProductSizeChart {
  type: 'image' | 'table' | 'none';
  imageUrl?: string;
  columns?: string[];
  rows?: SizeChartRow[];
}

export interface VariantOption {
  type: 'size' | 'color' | 'bikeModel' | 'storage' | 'warranty';
  name: string;
  values: string[];
}

export interface ProductSpecification {
  label: string;
  value: string;
}

export interface ProductImageItem {
  url: string;
  position: number;
  is_primary: boolean;
  file?: File;
  previewUrl?: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  shopId: ShopId;
  categoryId: string;
  categoryName: string;
  subcategoryId: string;
  subcategoryName: string;
  brand: string;
  description: string;
  shortDescription?: string;
  images: string[];
  product_images?: ProductImageItem[];
  productImages?: ProductImageItem[];
  image?: string;
  image_url?: string;
  price: number; // Original MRP
  salePrice: number; // Discounted Selling Price
  retail_price?: number; // Retail Price (explicit)
  retailPrice?: number;
  wholesale_price?: number; // Wholesale Price per set (e.g. ₹2,400)
  wholesalePrice?: number;
  set_size?: number; // Pieces in 1 complete set (e.g. 12)
  setSize?: number;
  wholesale_minimum_sets?: number; // Minimum sets to purchase (default 1)
  wholesaleMinimumSets?: number;
  wholesale_enabled?: boolean; // Whether wholesale purchase is allowed
  wholesaleEnabled?: boolean;
  discount: number; // % OFF
  stock: number;
  rating: number;
  reviewsCount: number;
  variants?: VariantOption[];
  sizes?: string[];
  size_variants?: ProductSizeVariant[];
  sizeVariants?: ProductSizeVariant[];
  has_sizes?: boolean;
  hasSizes?: boolean;
  size_chart?: ProductSizeChart;
  sizeChart?: ProductSizeChart;
  features?: string[];
  specifications: ProductSpecification[];
  isFeatured?: boolean;
  isNew?: boolean;
  isBestSeller?: boolean;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
  // Product specific fields
  clothingDetails?: {
    sizes: string[];
    colors: string[];
    fabric?: string;
  };
  colors?: (string | ProductColorItem)[];
  color_variants?: ProductColorItem[];
  colorVariants?: ProductColorItem[];
  wholesale_mix_colors?: string[];
  wholesaleMixColors?: string[];
  wholesale_set_type?: string;
  wholesale_available_sizes?: string[];
  wholesaleAvailableSizes?: string[];
  bikeDetails?: {
    compatibleBrands: string[];
    compatibleModels: string[];
    material?: string;
  };
  mobileDetails?: {
    compatibleBrands: string[];
    warrantyMonths?: number;
    colors?: string[];
  };
}

export type ShoppingMode = 'retail' | 'wholesale';

export interface OfferSlide {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  description: string;
  imageUrl: string;
  ctaText: string;
  discountText: string;
  active: boolean;
  displayOrder: number;
  startDate: string;
  endDate: string;
  destinationType: 'product' | 'category' | 'shop' | 'collection' | 'offer' | 'search';
  destinationValue: string;
  shopId: string;
}

export interface CartItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number; // For retail: pieces. For wholesale: number of sets
  shoppingMode?: ShoppingMode;
  sets?: number;
  totalPieces?: number;
  unitPrice?: number; // Retail unit price or wholesale price per set
  selectedVariants: Record<string, string>;
  selectedSize?: string;
  selectedColor?: string;
  colorImageUrl?: string;
  wholesaleColors?: string[];
  sizeVariantId?: string;
  addedAt: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  shopId: ShopId;
  shopName: string;
  image: string;
  price: number;
  quantity: number;
  product?: Product;
  selectedSize?: string;
  selectedColor?: string;
  colorImageUrl?: string;
  wholesaleColors?: string[];
  sizeVariantId?: string;
  selectedVariants?: Record<string, string>;
  total: number;
  // Wholesale details
  orderType?: ShoppingMode;
  order_type?: ShoppingMode;
  shoppingMode?: ShoppingMode;
  unitPrice?: number;
  wholesale_price?: number;
  wholesalePrice?: number;
  set_size?: number;
  setSize?: number;
  number_of_sets?: number;
  numberOfSets?: number;
  total_pieces?: number;
  totalPieces?: number;
}

export interface ShopGroupOrder {
  shopId: ShopId;
  shopName: string;
  items: OrderItem[];
  subtotal: number;
}

export type OrderStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Packed'
  | 'Shipped'
  | 'Out for Delivery'
  | 'Delivered'
  | 'Cancelled'
  | 'Returned'
  | 'pending'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'processing'
  | 'packed'
  | 'out_for_delivery'
  | 'returned';

export type PaymentMethod = 'cod' | 'upi' | 'online' | 'card' | 'razorpay';
export type PaymentStatus = 'Pending' | 'Paid' | 'Refunded' | 'pending' | 'processing' | 'paid' | 'failed' | 'refunded' | 'cod_pending' | 'cod_confirmed';

export interface ShippingAddress {
  fullName: string;
  mobile: string;
  phone?: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
}

export type CustomerDetails = ShippingAddress;

export interface Order {
  id: string;
  orderNumber?: string;
  orderType?: ShoppingMode;
  order_type?: ShoppingMode;
  customerId: string;
  customerName: string;
  customerMobile: string;
  customerEmail: string;
  shippingAddress: ShippingAddress;
  customer?: ShippingAddress;
  items: OrderItem[];
  shopGroups: ShopGroupOrder[];
  subtotal: number;
  discount: number;
  couponCode?: string;
  deliveryCharge: number;
  deliveryFee?: number;
  shippingCharge?: number;
  numberOfSets?: number;
  currency?: 'INR';
  total: number;
  totalAmount?: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  paidAt?: string;
  fulfillmentReview?: boolean;
  orderStatus: OrderStatus;
  trackingNumber: string;
  createdAt: string;
  estimatedDelivery: string;
  notes?: string;
  firebaseSynced?: boolean;
  firebaseSyncedAt?: string;
}

export type DiscountType = 'percentage' | 'flat';
export type ApplicableShoppingType = 'retail' | 'wholesale' | 'both';

export interface Coupon {
  id: string;
  code: string;
  description?: string;
  type: DiscountType; // 'percentage' | 'flat'
  discount_type?: DiscountType;
  value: number; // e.g. 10% or 100 Rs
  discount_value?: number;
  minOrder: number;
  minimum_order_value?: number;
  maxDiscount?: number;
  maximum_discount?: number;
  startDate?: string;
  start_at?: string;
  expiryDate: string;
  expires_at?: string;
  shopId?: ShopId | 'all';
  applicable_shop?: ShopId | 'all';
  applicable_shopping_type?: ApplicableShoppingType;
  applicableShoppingType?: ApplicableShoppingType;
  applicable_products?: 'all' | string[]; // 'all' or product IDs
  applicableProducts?: 'all' | string[];
  usageLimit?: number;
  usage_limit?: number;
  usedCount: number;
  usage_count?: number;
  per_customer_limit?: number;
  perCustomerLimit?: number;
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CouponUsage {
  id: string;
  coupon_id: string;
  coupon_code: string;
  order_id: string;
  customer_id?: string;
  customer_email?: string;
  customer_mobile?: string;
  discount_amount: number;
  used_at: string;
}

export interface CustomerReview {
  id: string;
  productId: string;
  author: string;
  rating: number;
  date: string;
  title: string;
  comment: string;
  verifiedPurchase: boolean;
  userCity?: string;
}

export interface FilterState {
  shopId: ShopId | 'all';
  collection?: 'new-arrivals' | 'featured' | 'best-sellers';
  categoryId?: string;
  subcategoryId?: string;
  searchQuery?: string;
  minPrice: number;
  maxPrice: number;
  brand?: string;
  rating?: number;
  inStockOnly: boolean;
  discountMin?: number;
  sortBy: 'popular' | 'newest' | 'price-low' | 'price-high' | 'discount' | 'rating';
}

export type UserRole = 'admin' | 'customer';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  mobile: string;
  role: UserRole;
  shoppingMode?: ShoppingMode;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  createdAt: string;
}

// Strictly authorized administrator accounts
export const PRIMARY_ADMIN_EMAIL = 'vinayakcollection9355@gmail.com';
export const SECONDARY_ADMIN_EMAIL = 'vcmartshop@gmail.com';

export const isAuthorizedAdminEmail = (email?: string | null): boolean => {
  if (!email) return false;
  const clean = email.trim().toLowerCase();
  return clean === PRIMARY_ADMIN_EMAIL.toLowerCase() || clean === SECONDARY_ADMIN_EMAIL.toLowerCase();
};
