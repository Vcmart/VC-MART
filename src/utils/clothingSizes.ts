import { Product, ProductColorItem, ProductSizeVariant, SizeChartRow, ProductSizeChart, CartItem, ShoppingMode } from '../types';

/**
 * Standard clothing size options as required by VC MART
 */
export const CLOTHING_ALPHABET_SIZES = [
  'XS',
  'S',
  'M',
  'L',
  'XL',
  'XXL',
  '3XL',
  '4XL',
  '5XL',
];

export const CLOTHING_NUMERIC_SIZES = [
  '28',
  '30',
  '32',
  '34',
  '36',
  '38',
  '40',
  '42',
  '44',
  '46',
];

export interface SizePresetCategory {
  id: string;
  name: string;
  description: string;
  sizes: string[];
}

export const SIZE_PRESET_CATEGORIES: SizePresetCategory[] = [
  {
    id: 't-shirt',
    name: 'T-Shirt / Oversize',
    description: 'XS, S, M, L, XL, XXL, 3XL, 4XL, 5XL',
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', '5XL'],
  },
  {
    id: 'shirt',
    name: 'Shirt (Casual / Formal)',
    description: 'S, M, L, XL, XXL, 3XL, 4XL, 5XL',
    sizes: ['S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', '5XL'],
  },
  {
    id: 'jeans-pants',
    name: 'Jeans / Lower / Pants',
    description: '28, 30, 32, 34, 36, 38, 40, 42, 44',
    sizes: ['28', '30', '32', '34', '36', '38', '40', '42', '44'],
  },
  {
    id: 'kurta-set',
    name: 'Kurta / Kurta Set',
    description: 'S, M, L, XL, XXL, 3XL, 4XL',
    sizes: ['S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL'],
  },
  {
    id: 'suit-palazzo',
    name: 'Suit / Palazzo',
    description: 'S, M, L, XL, XXL, 3XL',
    sizes: ['S', 'M', 'L', 'XL', 'XXL', '3XL'],
  },
  {
    id: 'numeric-all',
    name: 'Numeric Sizes (28–46)',
    description: '28, 30, 32, 34, 36, 38, 40, 42, 44, 46',
    sizes: ['28', '30', '32', '34', '36', '38', '40', '42', '44', '46'],
  },
  {
    id: 'regular-all',
    name: 'Standard Clothing (XS–5XL)',
    description: 'XS, S, M, L, XL, XXL, 3XL, 4XL, 5XL',
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', '5XL'],
  },
];

/**
 * Checks whether a given category and/or shop division is a clothing/apparel category.
 * Non-clothing products (Kinshuk Spare Parts, Khushi Communication, Mobile Accessories)
 * will strictly return false.
 */
export function isClothingCategory(categoryName?: string, shopId?: string): boolean {
  // Explicit non-clothing shops
  if (shopId === 'kinshuk-spare-parts' || shopId === 'khushi-communication') {
    return false;
  }

  const cat = (categoryName || '').toLowerCase().trim();

  // Explicit non-clothing keywords
  const nonClothingKeywords = [
    'spare part',
    'bike',
    'motorcycle',
    'helmet',
    'fog light',
    'mobile',
    'phone',
    'charger',
    'cover',
    'case',
    'tempered',
    'earbud',
    'earphone',
    'cable',
    'headphone',
    'adapter',
    'electronics',
    'hardware',
    'gadget',
  ];

  if (nonClothingKeywords.some((kw) => cat.includes(kw))) {
    return false;
  }

  // Explicit clothing keywords
  const clothingKeywords = [
    'cloth',
    'fashion',
    'shirt',
    't-shirt',
    'tee',
    'pant',
    'pants',
    'lower',
    'lowers',
    'jeans',
    'denim',
    'kurta',
    'kurti',
    'suit',
    'palazzo',
    'dress',
    'saree',
    'apparel',
    'hoodie',
    'jacket',
    'top',
    'tops',
    'trousers',
    'co-ord',
    'cordset',
    'wear',
    'ethnic',
    'cotton',
    'linen',
  ];

  if (clothingKeywords.some((kw) => cat.includes(kw))) {
    return true;
  }

  // If in vinayak-collection shop, default to true unless non-clothing
  if (shopId === 'vinayak-collection') {
    return true;
  }

  return false;
}

/**
 * Recommends the default preset sizes based on category string
 */
export function getRecommendedSizesForCategory(categoryName?: string): string[] {
  const cat = (categoryName || '').toLowerCase();

  if (cat.includes('jean') || cat.includes('pant') || cat.includes('lower') || cat.includes('trouser')) {
    return ['28', '30', '32', '34', '36', '38', '40', '42', '44'];
  }
  if (cat.includes('t-shirt') || cat.includes('tee') || cat.includes('oversize')) {
    return ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', '5XL'];
  }
  if (cat.includes('shirt')) {
    return ['S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', '5XL'];
  }
  if (cat.includes('kurta') || cat.includes('kurti')) {
    return ['S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL'];
  }
  if (cat.includes('suit') || cat.includes('palazzo')) {
    return ['S', 'M', 'L', 'XL', 'XXL', '3XL'];
  }

  // Default fallback for clothing
  return ['S', 'M', 'L', 'XL', 'XXL'];
}

/**
 * Standard measurement defaults for size chart (in inches)
 */
export const STANDARD_MEASUREMENTS: Record<string, { chest?: string; length?: string; shoulder?: string; waist?: string; hip?: string }> = {
  XS: { chest: '36', length: '26', shoulder: '16.5' },
  S: { chest: '38', length: '27', shoulder: '17' },
  M: { chest: '40', length: '28', shoulder: '18' },
  L: { chest: '42', length: '29', shoulder: '19' },
  XL: { chest: '44', length: '30', shoulder: '20' },
  XXL: { chest: '46', length: '31', shoulder: '21' },
  '3XL': { chest: '48', length: '32', shoulder: '22' },
  '4XL': { chest: '50', length: '33', shoulder: '22.5' },
  '5XL': { chest: '52', length: '34', shoulder: '23' },
  '28': { waist: '28', hip: '36', length: '38' },
  '30': { waist: '30', hip: '38', length: '39' },
  '32': { waist: '32', hip: '40', length: '40' },
  '34': { waist: '34', hip: '42', length: '41' },
  '36': { waist: '36', hip: '44', length: '41' },
  '38': { waist: '38', hip: '46', length: '42' },
  '40': { waist: '40', hip: '48', length: '42' },
  '42': { waist: '42', hip: '50', length: '43' },
  '44': { waist: '44', hip: '52', length: '43' },
  '46': { waist: '46', hip: '54', length: '44' },
};

/**
 * Build initial size chart measurement rows for given sizes
 */
export function buildDefaultSizeChartRows(sizes: string[]): SizeChartRow[] {
  const isNumeric = sizes.some((s) => !isNaN(Number(s)));

  return sizes.map((sz) => {
    const std = STANDARD_MEASUREMENTS[sz] || {};
    if (isNumeric) {
      return {
        size: sz,
        waist: std.waist || '',
        hip: std.hip || '',
        length: std.length || '',
      };
    }
    return {
      size: sz,
      chest: std.chest || '',
      length: std.length || '',
      shoulder: std.shoulder || '',
    };
  });
}

/**
 * Generates an empty or initialized ProductSizeVariant list
 */
export function createSizeVariantsFromSizes(
  sizes: string[],
  existingVariants: ProductSizeVariant[] = [],
  defaultStock = 10,
  productId = ''
): ProductSizeVariant[] {
  const existingMap = new Map<string, ProductSizeVariant>();
  existingVariants.forEach((v) => existingMap.set(v.size.toUpperCase(), v));

  return sizes.map((sz) => {
    const matched = existingMap.get(sz.toUpperCase());
    if (matched) {
      return {
        ...matched,
        size: sz,
        active: true,
      };
    }

    return {
      id: `var-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      productId,
      size: sz,
      stock_quantity: defaultStock,
      stock: defaultStock,
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  });
}

/**
 * Computes total stock by summing all active size variants
 */
export function calculateTotalStockFromVariants(variants: ProductSizeVariant[]): number {
  if (!variants || variants.length === 0) return 0;
  return variants.reduce((sum, v) => (v.active !== false ? sum + (Number(v.stock_quantity ?? v.stock ?? 0)) : sum), 0);
}

/**
 * Standard color hex values map for apparel & goods
 */
export const COLOR_HEX_MAP: Record<string, string> = {
  black: '#171717',
  'jet black': '#0A0A0A',
  white: '#FFFFFF',
  'pure white': '#F8FAFC',
  'ivory white': '#F5F5F0',
  blue: '#2563EB',
  'sky blue': '#38BDF8',
  'navy blue': '#1E3A8A',
  'deep navy': '#0F172A',
  red: '#DC2626',
  'crimson red': '#B91C1C',
  green: '#16A34A',
  'olive green': '#556B2F',
  'emerald green': '#059669',
  'sage green': '#789D82',
  maroon: '#800000',
  'deep maroon': '#581845',
  beige: '#D4C5B9',
  yellow: '#EAB308',
  'mustard yellow': '#CA8A04',
  'royal mustard yellow': '#B45309',
  pink: '#EC4899',
  'rani pink': '#BE185D',
  brown: '#78350F',
  'vintage brown': '#8D6E63',
  indigo: '#4338CA',
  grey: '#6B7280',
  'space grey': '#4B5563',
  charcoal: '#374151',
  'charcoal black': '#27272A',
  terracotta: '#C86446',
  'terracotta floral': '#C86446',
  'indigo boho print': '#3730A3',
  'olive geometry': '#4D5D38',
  'midnight blue': '#172554',
  'washed light blue': '#93C5FD',
  purple: '#9333EA',
  'royal purple': '#7E22CE',
  orange: '#EA580C',
  'rust orange': '#C2410C',
  lavender: '#C084FC',
  teal: '#0D9488',
  rust: '#C2410C',
  wine: '#722F37',
  coral: '#FB7185',
  peach: '#FDBA74',
  cyan: '#06B6D4',
  magenta: '#D946EF',
};

/**
 * Standard 14 selectable retail clothing colors requested for Retail Clothing product setup
 */
export const DEFAULT_RETAIL_COLORS = [
  'Black',
  'White',
  'Red',
  'Blue',
  'Navy Blue',
  'Green',
  'Yellow',
  'Pink',
  'Maroon',
  'Grey',
  'Beige',
  'Brown',
  'Purple',
  'Orange',
];

/**
 * Fallback color hex resolver
 */
export function getColorHex(colorName: string): string {
  if (!colorName) return '#78716C';
  const clean = colorName.trim().toLowerCase();
  if (COLOR_HEX_MAP[clean]) return COLOR_HEX_MAP[clean];
  for (const [key, hex] of Object.entries(COLOR_HEX_MAP)) {
    if (clean.includes(key) || key.includes(clean)) {
      return hex;
    }
  }
  return '#94A3B8';
}

/**
 * Resolves raw list of color names for a product in retail setup
 */
export function getProductRetailColorNames(product?: Partial<Product> | null): string[] {
  if (!product) return [];
  if (product.colors && Array.isArray(product.colors) && product.colors.length > 0) {
    return product.colors.map((c) => (typeof c === 'string' ? c : c.name));
  }
  const explicitVariants = product.color_variants || product.colorVariants;
  if (explicitVariants && explicitVariants.length > 0) {
    return explicitVariants.map((c) => c.name);
  }
  if (product.clothingDetails?.colors && product.clothingDetails.colors.length > 0) {
    return product.clothingDetails.colors;
  }
  if (isClothingCategory(product.categoryName, product.shopId)) {
    return ['Black', 'White', 'Blue', 'Red', 'Green', 'Maroon'];
  }
  return [];
}

/**
 * Default 6 colors for wholesale mix sets
 */
export const DEFAULT_WHOLESALE_MIX_COLORS = [
  'Black',
  'White',
  'Blue',
  'Red',
  'Green',
  'Maroon',
];

/**
 * Resolves available product colors as ProductColorItem[]
 * with proper name, hex, and associated preview image.
 */
export function getProductColors(product: Product): ProductColorItem[] {
  if (!product) return [];

  const productImages =
    product.images && product.images.length > 0
      ? product.images
      : (product.image || product.image_url)
      ? [product.image || product.image_url!]
      : [];

  const safeParse = (val: any): any => {
    if (typeof val === 'string') {
      try {
        return JSON.parse(val);
      } catch {
        return val;
      }
    }
    return val;
  };

  const rawData = (product as any).raw_data || {};

  // 1. Direct color_variants or colorVariants
  const rawExplicit = product.color_variants || product.colorVariants || rawData.color_variants || rawData.colorVariants;
  const explicitVariants = safeParse(rawExplicit);
  if (Array.isArray(explicitVariants) && explicitVariants.length > 0) {
    const list: ProductColorItem[] = [];
    const seen = new Set<string>();
    explicitVariants.forEach((item, idx) => {
      const name = typeof item === 'string' ? item : item.name;
      if (name && !seen.has(name.toLowerCase())) {
        seen.add(name.toLowerCase());
        list.push({
          name,
          hex: (typeof item === 'object' && item.hex) || getColorHex(name),
          imageUrl: (typeof item === 'object' && item.imageUrl) || productImages[idx % productImages.length] || productImages[0],
        });
      }
    });
    if (list.length > 0) return list;
  }

  // 2. Direct colors array (strings or items)
  const rawColors = product.colors || rawData.colors;
  const parsedColors = safeParse(rawColors);
  if (Array.isArray(parsedColors) && parsedColors.length > 0) {
    const list: ProductColorItem[] = [];
    const seen = new Set<string>();
    parsedColors.forEach((c, idx) => {
      const name = typeof c === 'string' ? c : c?.name;
      if (name && !seen.has(name.toLowerCase())) {
        seen.add(name.toLowerCase());
        list.push({
          name,
          hex: (typeof c === 'object' && c.hex) || getColorHex(name),
          imageUrl: (typeof c === 'object' && c.imageUrl) || productImages[idx % productImages.length] || productImages[0],
        });
      }
    });
    if (list.length > 0) return list;
  }

  // 3. From clothingDetails.colors
  const rawClothingColors = product.clothingDetails?.colors || rawData.clothingDetails?.colors;
  const parsedClothingColors = safeParse(rawClothingColors);
  if (Array.isArray(parsedClothingColors) && parsedClothingColors.length > 0) {
    const list: ProductColorItem[] = [];
    const seen = new Set<string>();
    parsedClothingColors.forEach((c: any, idx: number) => {
      const name = typeof c === 'string' ? c : c?.name;
      if (name && !seen.has(name.toLowerCase())) {
        seen.add(name.toLowerCase());
        list.push({
          name,
          hex: (typeof c === 'object' && c.hex) || getColorHex(name),
          imageUrl: (typeof c === 'object' && c.imageUrl) || productImages[idx % productImages.length] || productImages[0],
        });
      }
    });
    if (list.length > 0) return list;
  }

  // 4. From variants array
  const rawVariants = safeParse(product.variants || rawData.variants);
  if (Array.isArray(rawVariants)) {
    const colorVariantOption = rawVariants.find(
      (v: any) => v.type === 'color' || (v.name && v.name.toLowerCase() === 'color')
    );
    if (colorVariantOption && Array.isArray(colorVariantOption.values) && colorVariantOption.values.length > 0) {
      return colorVariantOption.values.map((c: string, idx: number) => ({
        name: c,
        hex: getColorHex(c),
        imageUrl: productImages[idx % productImages.length] || productImages[0],
      }));
    }
  }

  // 5. From mobileDetails.colors
  const rawMobileColors = product.mobileDetails?.colors || rawData.mobileDetails?.colors;
  const parsedMobileColors = safeParse(rawMobileColors);
  if (Array.isArray(parsedMobileColors) && parsedMobileColors.length > 0) {
    return parsedMobileColors.map((c: any, idx: number) => {
      const name = typeof c === 'string' ? c : c?.name;
      return {
        name,
        hex: (typeof c === 'object' && c.hex) || getColorHex(name),
        imageUrl: (typeof c === 'object' && c.imageUrl) || productImages[idx % productImages.length] || productImages[0],
      };
    });
  }

  // 6. From size_variants with color_name
  const rawSizeVariants = product.size_variants || product.sizeVariants || rawData.size_variants;
  const sizeVariants = safeParse(rawSizeVariants);
  if (Array.isArray(sizeVariants) && sizeVariants.length > 0) {
    const uniqueColors = new Map<string, ProductColorItem>();
    sizeVariants.forEach((sv: any) => {
      const cName = sv.color_name || sv.colorName;
      if (cName && !uniqueColors.has(cName.toLowerCase())) {
        uniqueColors.set(cName.toLowerCase(), {
          name: cName,
          hex: sv.color_hex || sv.colorHex || getColorHex(cName),
          imageUrl: sv.color_image || sv.image_url || productImages[uniqueColors.size % productImages.length],
        });
      }
    });
    if (uniqueColors.size > 0) {
      return Array.from(uniqueColors.values());
    }
  }

  // 7. If clothing item but no colors specified in database, provide standard defaults
  if (isClothingCategory(product.categoryName, product.shopId)) {
    return DEFAULT_WHOLESALE_MIX_COLORS.map((c, idx) => ({
      name: c,
      hex: getColorHex(c),
      imageUrl: productImages[idx % productImages.length] || productImages[0],
    }));
  }

  return [];
}

/**
 * Safely parses any array or string/JSON input into a string array
 */
export function safeStringArray(val: any): string[] {
  if (!val) return [];
  if (Array.isArray(val)) {
    return val.map((item) => (typeof item === 'string' ? item : item?.name || String(item))).filter(Boolean);
  }
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => (typeof item === 'string' ? item : item?.name || String(item))).filter(Boolean);
      }
    } catch {}
    return val.split(',').map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

/**
 * Returns the exact mix colors included in 1 wholesale set.
 */
export function getProductWholesaleColors(product: Product): string[] {
  if (!product) return DEFAULT_WHOLESALE_MIX_COLORS;

  const explicit = product.wholesale_mix_colors || product.wholesaleMixColors;
  const parsedExplicit = safeStringArray(explicit);
  if (parsedExplicit.length > 0) {
    return parsedExplicit;
  }

  const colors = getProductColors(product);
  if (colors && colors.length > 0) {
    return colors.map((c) => c.name);
  }

  return DEFAULT_WHOLESALE_MIX_COLORS;
}

/**
 * Calculates total pieces for a wholesale Mix Color Set.
 * Strict Formula: Total Pieces = Sets * Number of Colors
 */
export function calculateWholesalePieces(sets: number, numberOfColors: number): number {
  const safeSets = Math.max(0, Math.round(Number(sets) || 0));
  const safeColors = Math.max(1, Math.round(Number(numberOfColors) || 1));
  return safeSets * safeColors;
}

export interface WholesaleCartItemValidationParams {
  product: Product;
  sets: number;
  selectedSize?: string;
  selectedColor?: string;
  shoppingMode?: ShoppingMode;
  wholesaleColors?: string[];
  totalPieces?: number;
  unitPrice?: number;
}

export interface WholesaleCartItemValidationResult {
  isValid: boolean;
  errors: string[];
  sets: number;
  numberOfColors: number;
  totalPieces: number; // Sets * Number of Colors (strictly enforced)
  wholesaleMixColors: string[];
  unitPrice: number;
  totalPrice: number;
  selectedSize?: string;
  enforcedItem: CartItem;
}

/**
 * Validates a wholesale cart item structure, ensuring that the
 * 'MIX COLOR SET' calculation (Total Pieces = Sets * Number of Colors)
 * is strictly enforced during the add-to-cart action for wholesale-enabled products.
 */
export function validateWholesaleCartItem(
  paramsOrItem: WholesaleCartItemValidationParams | CartItem
): WholesaleCartItemValidationResult {
  if (!paramsOrItem) {
    return {
      isValid: false,
      errors: ['Invalid cart item or parameters'],
      sets: 1,
      numberOfColors: 6,
      totalPieces: 6,
      wholesaleMixColors: DEFAULT_WHOLESALE_MIX_COLORS,
      unitPrice: 0,
      totalPrice: 0,
      selectedSize: undefined,
      enforcedItem: null as any,
    };
  }

  const product: Product = ('product' in paramsOrItem && paramsOrItem.product) ? paramsOrItem.product : (paramsOrItem as any);
  if (!product || typeof product !== 'object') {
    return {
      isValid: false,
      errors: ['Product details unavailable'],
      sets: 1,
      numberOfColors: 6,
      totalPieces: 6,
      wholesaleMixColors: DEFAULT_WHOLESALE_MIX_COLORS,
      unitPrice: 0,
      totalPrice: 0,
      selectedSize: undefined,
      enforcedItem: null as any,
    };
  }

  const rawSets =
    'sets' in paramsOrItem && paramsOrItem.sets !== undefined
      ? paramsOrItem.sets
      : 'quantity' in paramsOrItem
      ? paramsOrItem.quantity
      : 1;
  const selectedSize = 'selectedSize' in paramsOrItem ? paramsOrItem.selectedSize : undefined;
  const selectedColor = 'selectedColor' in paramsOrItem ? paramsOrItem.selectedColor : undefined;
  const passedTotalPieces = 'totalPieces' in paramsOrItem ? paramsOrItem.totalPieces : undefined;

  const errors: string[] = [];

  // 1. Verify wholesale enabled
  const isWholesaleEnabled =
    product.wholesale_enabled !== false && product.wholesaleEnabled !== false;
  if (!isWholesaleEnabled) {
    errors.push(`"${product.name || 'Product'}" is not enabled for wholesale orders.`);
  }

  // 2. Resolve Wholesale Mix Colors and Number of Colors in 1 Set
  const wholesaleMixColors = getProductWholesaleColors(product);
  const numberOfColors = Math.max(
    1,
    Number(product.setSize || product.set_size || wholesaleMixColors.length || 6)
  );

  // 3. Minimum Sets & Enforced Sets
  const minSets = Math.max(
    1,
    Number(product.wholesale_minimum_sets || product.wholesaleMinimumSets || 1)
  );
  const requestedSets = Math.round(Number(rawSets) || 0);

  if (requestedSets < 1) {
    errors.push('Wholesale order requires at least 1 set.');
  } else if (requestedSets < minSets) {
    errors.push(
      `Minimum wholesale order for "${product.name || 'Product'}" is ${minSets} set${minSets > 1 ? 's' : ''}.`
    );
  }

  const sets = Math.max(minSets, requestedSets > 0 ? requestedSets : minSets);

  // 4. STRICT ENFORCEMENT: MIX COLOR SET calculation
  // Total Pieces = Sets * Number of Colors
  const totalPieces = calculateWholesalePieces(sets, numberOfColors);

  // Check if caller passed a mismatched totalPieces
  if (passedTotalPieces !== undefined && passedTotalPieces !== totalPieces) {
    console.warn(
      `[WholesaleValidation] Provided totalPieces (${passedTotalPieces}) does not match strict Mix Color Set calculation (Sets ${sets} × Colors ${numberOfColors} = ${totalPieces}). Correcting to ${totalPieces}.`
    );
  }

  // 5. Stock Validation (size-specific if selectedSize specified)
  const productStock = Number(product.stock ?? 0);
  let availableStock = productStock;
  if (selectedSize) {
    const rawVariants = product.size_variants || product.sizeVariants;
    const sizeVariants = Array.isArray(rawVariants)
      ? rawVariants
      : typeof rawVariants === 'string'
      ? safeStringArray(rawVariants)
      : [];
    if (Array.isArray(sizeVariants) && sizeVariants.length > 0) {
      const match = sizeVariants.find(
        (v: any) => String(v?.size || '').toLowerCase() === String(selectedSize || '').toLowerCase()
      );
      if (match && typeof match === 'object') {
        const variantStock = Number(match.stock_quantity ?? match.stock ?? 0);
        // Use variant stock if sufficient, otherwise fallback to warehouse product stock
        availableStock = variantStock > 0 ? variantStock : productStock;
      }
    }
  }

  if (availableStock <= 0 && productStock <= 0) {
    errors.push(
      selectedSize
        ? `Size "${selectedSize}" is currently out of stock.`
        : `Product "${product.name || 'Product'}" is currently out of stock.`
    );
  } else if (totalPieces > availableStock && totalPieces > productStock) {
    const maxAvailableSets = Math.floor(Math.max(availableStock, productStock) / numberOfColors);
    errors.push(
      `Insufficient warehouse stock: ${sets} set${sets > 1 ? 's' : ''} require ${totalPieces} pieces (${sets} sets × ${numberOfColors} colors), but only ${Math.max(availableStock, productStock)} pieces are available in stock${
        maxAvailableSets >= minSets
          ? ` (Maximum order: ${maxAvailableSets} sets)`
          : ` (Requires at least ${minSets * numberOfColors} pieces for 1 set)`
      }.`
    );
  }

  // 6. Wholesale Pricing
  const safeSalePrice = Number(product.salePrice ?? product.price ?? 0);
  const unitPrice =
    Number(product.wholesale_price || product.wholesalePrice) ||
    Math.round(safeSalePrice * 0.65 * numberOfColors) ||
    safeSalePrice ||
    99;
  const totalPrice = sets * unitPrice;

  const selectedVariants: Record<string, string> = {};
  if (selectedSize) {
    selectedVariants.Size = selectedSize;
  }
  if (selectedColor) {
    selectedVariants.Color = selectedColor;
  }

  const safeImages = Array.isArray(product.images) && product.images.length > 0
    ? product.images
    : [product.image || product.image_url || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=800&auto=format&fit=crop'];

  // 7. Strictly enforced CartItem structure
  const enforcedItem: CartItem = {
    id: `cart-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    productId: product.id,
    product: {
      ...product,
      images: safeImages,
      stock: Number(product.stock ?? 0),
      salePrice: safeSalePrice,
      wholesale_price: unitPrice,
      wholesalePrice: unitPrice,
    },
    quantity: sets,
    sets,
    shoppingMode: 'wholesale',
    totalPieces, // Strictly enforced: Sets * Number of Colors
    unitPrice,
    wholesaleColors: wholesaleMixColors,
    selectedSize: selectedSize || undefined,
    selectedColor: selectedColor || undefined,
    colorImageUrl: safeImages[0],
    selectedVariants,
    addedAt: new Date().toISOString(),
  };

  return {
    isValid: errors.length === 0,
    errors,
    sets,
    numberOfColors,
    totalPieces,
    wholesaleMixColors,
    unitPrice,
    totalPrice,
    selectedSize,
    enforcedItem,
  };
}

/**
 * Infer complete category and subcategory hierarchy from a category name and shop ID.
 * Ensures consistent categoryId, subcategoryId, categoryName, subcategoryName across Admin & Storefront.
 */
export function inferCategoryHierarchy(categoryName?: string, shopId?: string): {
  categoryId: string;
  categoryName: string;
  subcategoryId: string;
  subcategoryName: string;
} {
  const cat = (categoryName || '').trim();
  const lower = cat.toLowerCase();
  const shop = shopId || 'vinayak-collection';

  if (shop === 'vinayak-collection' || (!shopId && isClothingCategory(cat, shop))) {
    // Check Shirts first (handle 'shirt', 'shirts', 'casual shirt', 'formal shirt', but NOT 't-shirt')
    if (lower.includes('shirt') && !lower.includes('t-shirt') && !lower.includes('tshirt') && !lower.includes('tee')) {
      return {
        categoryId: 'shirts',
        categoryName: 'Shirts',
        subcategoryId: 'mens-shirts',
        subcategoryName: "Men's Casual Shirts",
      };
    }
    if (lower.includes('t-shirt') || lower.includes('tshirt') || lower.includes('tee')) {
      return {
        categoryId: 't-shirts',
        categoryName: 'T-Shirts',
        subcategoryId: 'oversize-tshirts',
        subcategoryName: 'Oversize T-Shirts',
      };
    }
    if (lower.includes('kurti') || lower.includes('kurta') || lower.includes('suit') || lower.includes('palazzo') || lower.includes('ethnic')) {
      return {
        categoryId: 'kurtis',
        categoryName: 'Kurtis & Sets',
        subcategoryId: 'kurta-sets',
        subcategoryName: 'Kurta Sets',
      };
    }
    if (lower.includes('jean') || lower.includes('denim')) {
      return {
        categoryId: 'jeans',
        categoryName: 'Jeans & Denim',
        subcategoryId: 'mens-jeans',
        subcategoryName: "Men's Jeans",
      };
    }
    if (lower.includes('lower') || lower.includes('pant') || lower.includes('jogger') || lower.includes('track')) {
      return {
        categoryId: 'lowers',
        categoryName: 'Lowers & Joggers',
        subcategoryId: 'track-pants',
        subcategoryName: 'Track Pants',
      };
    }
    if (lower.includes('cordset') || lower.includes('co-ord')) {
      return {
        categoryId: 'cordsets',
        categoryName: 'Cordsets & Western',
        subcategoryId: 'cordsets',
        subcategoryName: 'Cordsets',
      };
    }
    if (lower.includes('top') || lower.includes('women')) {
      return {
        categoryId: 'womens-wear',
        categoryName: "Women's Wear",
        subcategoryId: 'tops',
        subcategoryName: 'Tops',
      };
    }
    const slug = lower.replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'fashion';
    return {
      categoryId: slug,
      categoryName: cat || 'Fashion & Clothing',
      subcategoryId: slug,
      subcategoryName: cat || 'Clothing',
    };
  }

  if (shop === 'kinshuk-spare-parts') {
    if (lower.includes('holder') || lower.includes('mount')) {
      return {
        categoryId: 'mobile-holders',
        categoryName: 'Mobile Holders',
        subcategoryId: 'bike-accessories',
        subcategoryName: 'Handlebar Mounts',
      };
    }
    if (lower.includes('light') || lower.includes('fog') || lower.includes('led')) {
      return {
        categoryId: 'lights',
        categoryName: 'Lights & Indicators',
        subcategoryId: 'fog-lights',
        subcategoryName: 'LED Fog Lights',
      };
    }
    if (lower.includes('mirror')) {
      return {
        categoryId: 'mirrors',
        categoryName: 'Mirrors & Styling',
        subcategoryId: 'mirrors',
        subcategoryName: 'Rear View Mirrors',
      };
    }
    if (lower.includes('seat')) {
      return {
        categoryId: 'seat-covers',
        categoryName: 'Bike Styling & Safety',
        subcategoryId: 'seat-covers',
        subcategoryName: 'Seat Covers',
      };
    }
    if (lower.includes('horn')) {
      return {
        categoryId: 'horns',
        categoryName: 'Horns & Safety',
        subcategoryId: 'horns',
        subcategoryName: 'Electric Horns',
      };
    }
    if (lower.includes('indicator')) {
      return {
        categoryId: 'indicators',
        categoryName: 'Lights & Indicators',
        subcategoryId: 'indicators',
        subcategoryName: 'Indicators',
      };
    }
    const slug = lower.replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'bike-accessories';
    return {
      categoryId: slug,
      categoryName: cat || 'Bike Accessories',
      subcategoryId: slug,
      subcategoryName: cat || 'Accessories',
    };
  }

  if (shop === 'khushi-communication') {
    if (lower.includes('charger') || lower.includes('adapter')) {
      return {
        categoryId: 'chargers',
        categoryName: 'Chargers & Adapters',
        subcategoryId: 'fast-chargers',
        subcategoryName: 'Fast Chargers',
      };
    }
    if (lower.includes('power') || lower.includes('bank')) {
      return {
        categoryId: 'power-banks',
        categoryName: 'Power Banks',
        subcategoryId: 'power-banks',
        subcategoryName: 'High Capacity Power Banks',
      };
    }
    if (lower.includes('ear') || lower.includes('tws') || lower.includes('audio') || lower.includes('headphone')) {
      return {
        categoryId: 'earphones',
        categoryName: 'Earphones & Audio',
        subcategoryId: 'tws-earbuds',
        subcategoryName: 'TWS Earbuds',
      };
    }
    if (lower.includes('cable') || lower.includes('cord')) {
      return {
        categoryId: 'cables',
        categoryName: 'Cables & Data',
        subcategoryId: 'cables',
        subcategoryName: 'Type-C Cables',
      };
    }
    if (lower.includes('cover') || lower.includes('case')) {
      return {
        categoryId: 'mobile-covers',
        categoryName: 'Mobile Covers & Protection',
        subcategoryId: 'mobile-covers',
        subcategoryName: 'Armor Cases',
      };
    }
    if (lower.includes('glass') || lower.includes('screen') || lower.includes('temper')) {
      return {
        categoryId: 'screen-protectors',
        categoryName: 'Mobile Covers & Protection',
        subcategoryId: 'screen-protectors',
        subcategoryName: 'Tempered Glass',
      };
    }
    const slug = lower.replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'mobile-accessories';
    return {
      categoryId: slug,
      categoryName: cat || 'Mobile Accessories',
      subcategoryId: slug,
      subcategoryName: cat || 'Accessories',
    };
  }

  const slug = lower.replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'general';
  return {
    categoryId: slug,
    categoryName: cat || 'General',
    subcategoryId: slug,
    subcategoryName: cat || 'General',
  };
}

/**
 * Bulletproof search matcher that handles:
 * - Undefined/null fields safely without throwing TypeError
 * - Singular vs plural matching (e.g. query "Shirts" matches "Shirt", query "Shirt" matches "Shirts")
 * - Multi-word tokens
 * - Shop name, Category name, Subcategory name, Brand, SKU, Title, and Description
 */
export function safeSearchMatch(p: Product, rawQuery: string, shopName?: string): boolean {
  if (!rawQuery) return true;
  const q = rawQuery.trim().toLowerCase();
  if (!q) return true;

  const tokens = q.split(/\s+/).filter(Boolean);

  const searchableFields = [
    p.name || '',
    p.description || '',
    p.shortDescription || '',
    p.categoryName || '',
    p.categoryId || '',
    p.subcategoryName || '',
    p.subcategoryId || '',
    p.brand || '',
    p.sku || '',
    shopName || '',
  ].map((f) => f.toLowerCase());

  return tokens.every((token) => {
    // 1. Direct substring match in any field
    if (searchableFields.some((field) => field.includes(token))) {
      return true;
    }
    // 2. Plural to singular (e.g. query "shirts" matches field "shirt")
    if (token.endsWith('s') && token.length > 2) {
      const singular = token.slice(0, -1);
      if (searchableFields.some((field) => field.includes(singular))) {
        return true;
      }
    }
    // 3. Singular to plural (e.g. query "shirt" matches field "shirts")
    const plural = token + 's';
    if (searchableFields.some((field) => field.includes(plural))) {
      return true;
    }
    return false;
  });
}

/**
 * Normalizes any raw product input (from Admin, LocalStorage, or Firebase DB)
 * to guarantee every single required field exists and is valid.
 */
export function normalizeProductFields(raw: any): Product {
  const shopId = raw.shopId || raw.shop_id || 'vinayak-collection';
  const categoryName = raw.categoryName || raw.category_name || (shopId === 'vinayak-collection' ? 'Shirts' : 'General');
  const catHierarchy = inferCategoryHierarchy(categoryName, shopId);

  const rawImages = raw.images || raw.image_urls || [];
  let safeImages: string[] = [];
  if (Array.isArray(rawImages)) {
    safeImages = rawImages.filter(Boolean).map(String);
  } else if (typeof rawImages === 'string') {
    try {
      const parsed = JSON.parse(rawImages);
      safeImages = Array.isArray(parsed) ? parsed.filter(Boolean).map(String) : [rawImages];
    } catch {
      safeImages = rawImages.split(',').map((s) => s.trim()).filter(Boolean);
    }
  }
  if (safeImages.length === 0 && (raw.image || raw.image_url)) {
    safeImages = [raw.image || raw.image_url];
  }
  if (safeImages.length === 0) {
    safeImages = ['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=800&auto=format&fit=crop'];
  }

  const retailPrice = Number(raw.salePrice ?? raw.sale_price ?? raw.retail_price ?? raw.retailPrice ?? raw.price ?? 499);
  const mrpPrice = Math.max(retailPrice, Number(raw.price || Math.round(retailPrice * 1.5)));
  const discount = Number(raw.discount ?? (mrpPrice > retailPrice ? Math.round(((mrpPrice - retailPrice) / mrpPrice) * 100) : 0));
  const setSize = Math.max(1, Number(raw.set_size ?? raw.setSize ?? 12));
  const wholesalePrice = Number(raw.wholesale_price ?? raw.wholesalePrice ?? Math.round(retailPrice * 0.65 * setSize));
  const wholesaleMinSets = Math.max(1, Number(raw.wholesale_minimum_sets ?? raw.wholesaleMinimumSets ?? 1));
  const wholesaleEnabled = raw.wholesale_enabled ?? raw.wholesaleEnabled ?? true;

  const id = raw.id || `prod-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
  const sku = raw.sku || (shopId === 'vinayak-collection' ? `VC-${catHierarchy.categoryId.toUpperCase().slice(0, 3)}-${id.slice(-4)}` : `SKU-${id.slice(-6)}`);
  const brand = raw.brand || (shopId === 'vinayak-collection' ? 'Vinayak Originals' : shopId === 'kinshuk-spare-parts' ? 'Kinshuk Genuine Spares' : 'Khushi Certified Gadgets');
  const description = raw.description || `High quality ${catHierarchy.categoryName} from ${shopId}. Guaranteed authenticity, premium finish, and verified stock.`;

  const status = (raw.status || 'active').toLowerCase() === 'inactive' ? 'inactive' : 'active';

  return {
    ...raw,
    id,
    sku,
    name: raw.name || `${catHierarchy.categoryName} Item`,
    shopId,
    categoryId: raw.categoryId || raw.category_id || catHierarchy.categoryId,
    categoryName: raw.categoryName || raw.category_name || catHierarchy.categoryName,
    subcategoryId: raw.subcategoryId || raw.subcategory_id || catHierarchy.subcategoryId,
    subcategoryName: raw.subcategoryName || raw.subcategory_name || catHierarchy.subcategoryName,
    brand,
    description,
    shortDescription: raw.shortDescription || raw.short_description || description.slice(0, 80),
    images: safeImages,
    image: safeImages[0],
    image_url: safeImages[0],
    price: mrpPrice,
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
    discount,
    stock: Math.max(0, Number(raw.stock ?? 30)),
    rating: Number(raw.rating ?? 4.8),
    reviewsCount: Number(raw.reviewsCount ?? raw.reviews_count ?? 12),
    specifications: Array.isArray(raw.specifications) ? raw.specifications : [],
    variants: Array.isArray(raw.variants) ? raw.variants : [],
    status,
    isNew: raw.isNew ?? true,
    isFeatured: raw.isFeatured ?? false,
    isBestSeller: raw.isBestSeller ?? false,
    createdAt: raw.createdAt || raw.created_at || new Date().toISOString(),
    updatedAt: raw.updatedAt || raw.updated_at || new Date().toISOString(),
  };
}

/**
 * Exported alias to match explicit function naming
 */
export const validateWholesaleCartItemStructure = validateWholesaleCartItem;


