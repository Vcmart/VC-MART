import React, { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Table,
  Image as ImageIcon,
  Check,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Layers,
  Upload,
} from 'lucide-react';
import { ProductSizeVariant, ProductSizeChart, SizeChartRow } from '../types';
import {
  CLOTHING_ALPHABET_SIZES,
  CLOTHING_NUMERIC_SIZES,
  SIZE_PRESET_CATEGORIES,
  buildDefaultSizeChartRows,
  calculateTotalStockFromVariants,
  createSizeVariantsFromSizes,
  getRecommendedSizesForCategory,
} from '../utils/clothingSizes';
import { uploadProductImage } from '../lib/firebaseRepository';

interface AdminProductSizeManagerProps {
  categoryName: string;
  shopId: string;
  sizeVariants: ProductSizeVariant[];
  onChangeVariants: (variants: ProductSizeVariant[]) => void;
  sizeChart?: ProductSizeChart;
  onChangeSizeChart: (chart: ProductSizeChart) => void;
  onTotalStockChange?: (total: number) => void;
  initialStock?: number;
}

export const AdminProductSizeManager: React.FC<AdminProductSizeManagerProps> = ({
  categoryName,
  shopId,
  sizeVariants,
  onChangeVariants,
  sizeChart,
  onChangeSizeChart,
  onTotalStockChange,
  initialStock = 20,
}) => {
  const [customSizeInput, setCustomSizeInput] = useState('');
  const [customSizeError, setCustomSizeError] = useState<string | null>(null);
  const [sizeChartMode, setSizeChartMode] = useState<'none' | 'table' | 'image'>(
    sizeChart?.type || 'none'
  );
  const [isUploadingChartImage, setIsUploadingChartImage] = useState(false);
  const [chartImageError, setChartImageError] = useState<string | null>(null);

  // Active selected size strings
  const activeSizes = sizeVariants.filter((v) => v.active !== false).map((v) => v.size);

  // Sync total stock calculation whenever sizeVariants change
  useEffect(() => {
    if (sizeVariants.length > 0 && onTotalStockChange) {
      const total = calculateTotalStockFromVariants(sizeVariants);
      onTotalStockChange(total);
    }
  }, [sizeVariants]);

  // Handle toggling a size
  const toggleSize = (sz: string) => {
    const trimmed = sz.trim();
    const existingIndex = sizeVariants.findIndex(
      (v) => v.size.toUpperCase() === trimmed.toUpperCase()
    );

    let updated: ProductSizeVariant[];
    if (existingIndex > -1) {
      // Toggle active status or remove
      const current = sizeVariants[existingIndex];
      if (current.active) {
        // Deactivate or remove
        updated = sizeVariants.filter((_, idx) => idx !== existingIndex);
      } else {
        updated = sizeVariants.map((v, idx) =>
          idx === existingIndex ? { ...v, active: true } : v
        );
      }
    } else {
      // Add new size with default stock
      const newVariant: ProductSizeVariant = {
        id: `var-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        size: trimmed,
        stock_quantity: Math.max(1, Math.round(initialStock / Math.max(1, activeSizes.length + 1))),
        stock: Math.max(1, Math.round(initialStock / Math.max(1, activeSizes.length + 1))),
        active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      updated = [...sizeVariants, newVariant];
    }

    onChangeVariants(updated);
  };

  // Add custom size
  const handleAddCustomSize = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = customSizeInput.trim();
    if (!trimmed) {
      setCustomSizeError('Please enter a size (e.g. 48, Free Size, 6-7 Years).');
      return;
    }

    const alreadyExists = sizeVariants.some(
      (v) => v.size.toUpperCase() === trimmed.toUpperCase()
    );
    if (alreadyExists) {
      setCustomSizeError(`Size "${trimmed}" is already added.`);
      return;
    }

    setCustomSizeError(null);
    const newVariant: ProductSizeVariant = {
      id: `var-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      size: trimmed,
      stock_quantity: 10,
      stock: 10,
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    onChangeVariants([...sizeVariants, newVariant]);
    setCustomSizeInput('');
  };

  // Select all sizes in a preset
  const handleApplyPreset = (presetSizes: string[]) => {
    const updated = createSizeVariantsFromSizes(
      presetSizes,
      sizeVariants,
      Math.max(5, Math.round(initialStock / Math.max(1, presetSizes.length)))
    );
    onChangeVariants(updated);
  };

  // Update specific variant stock
  const handleUpdateStock = (size: string, quantity: number) => {
    const safeQty = Math.max(0, Math.round(quantity));
    const updated = sizeVariants.map((v) =>
      v.size.toUpperCase() === size.toUpperCase()
        ? {
            ...v,
            stock_quantity: safeQty,
            stock: safeQty,
            updated_at: new Date().toISOString(),
          }
        : v
    );
    onChangeVariants(updated);
  };

  // Update specific variant SKU
  const handleUpdateSku = (size: string, sku: string) => {
    const updated = sizeVariants.map((v) =>
      v.size.toUpperCase() === size.toUpperCase() ? { ...v, sku } : v
    );
    onChangeVariants(updated);
  };

  // Update specific variant price override
  const handleUpdatePriceOverride = (size: string, priceOverride?: number) => {
    const updated = sizeVariants.map((v) =>
      v.size.toUpperCase() === size.toUpperCase()
        ? { ...v, price_override: priceOverride && priceOverride > 0 ? priceOverride : undefined }
        : v
    );
    onChangeVariants(updated);
  };

  // Set all sizes to specific quantity
  const handleSetAllStock = (qty: number) => {
    const updated = sizeVariants.map((v) => ({
      ...v,
      stock_quantity: qty,
      stock: qty,
      updated_at: new Date().toISOString(),
    }));
    onChangeVariants(updated);
  };

  // Distribute total stock evenly
  const handleDistributeStock = () => {
    if (sizeVariants.length === 0) return;
    const perSize = Math.max(1, Math.floor(initialStock / sizeVariants.length));
    const remainder = initialStock % sizeVariants.length;

    const updated = sizeVariants.map((v, idx) => {
      const allocated = idx === 0 ? perSize + remainder : perSize;
      return {
        ...v,
        stock_quantity: allocated,
        stock: allocated,
        updated_at: new Date().toISOString(),
      };
    });
    onChangeVariants(updated);
  };

  // Handle Size Chart Image Upload
  const handleChartImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(file.type)) {
      setChartImageError('Please upload a JPG, PNG or WEBP image.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setChartImageError('Image must be smaller than 10 MB.');
      return;
    }

    setIsUploadingChartImage(true);
    setChartImageError(null);

    const res = await uploadProductImage(file, 'size-charts');
    setIsUploadingChartImage(false);

    if (res) {
      onChangeSizeChart({
        type: 'image',
        imageUrl: res,
      });
      setSizeChartMode('image');
    }
  };

  // Update Size Chart measurement cell
  const handleUpdateMeasurement = (
    sizeIndex: number,
    field: string,
    value: string
  ) => {
    const currentRows = sizeChart?.rows || buildDefaultSizeChartRows(activeSizes);
    const updatedRows = currentRows.map((r, idx) =>
      idx === sizeIndex ? { ...r, [field]: value } : r
    );
    onChangeSizeChart({
      type: 'table',
      rows: updatedRows,
      imageUrl: sizeChart?.imageUrl,
    });
  };

  // Initialize measurement table if mode changed to table
  const enableMeasurementTable = () => {
    setSizeChartMode('table');
    const rows =
      sizeChart?.rows && sizeChart.rows.length > 0
        ? sizeChart.rows
        : buildDefaultSizeChartRows(activeSizes.length > 0 ? activeSizes : ['S', 'M', 'L', 'XL', 'XXL']);
    onChangeSizeChart({
      type: 'table',
      rows,
      imageUrl: sizeChart?.imageUrl,
    });
  };

  const totalCalculatedStock = calculateTotalStockFromVariants(sizeVariants);

  return (
    <div className="p-4 sm:p-5 bg-gradient-to-br from-amber-50/70 via-stone-50 to-orange-50/40 border border-amber-200 rounded-2xl space-y-4">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-amber-200/70">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#965215] text-white flex items-center justify-center font-bold text-sm shadow-xs">
            <Layers size={16} />
          </div>
          <div>
            <h4 className="font-bold text-sm text-stone-900 tracking-wide uppercase flex items-center gap-2">
              <span>SIZE & INVENTORY</span>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                Clothing Active
              </span>
            </h4>
            <p className="text-[11px] text-stone-500">
              Select available sizes, set individual warehouse stock per size, and add optional size chart
            </p>
          </div>
        </div>

        {/* Total Stock Indicator Badge */}
        <div className="bg-white px-3 py-1.5 rounded-xl border border-amber-200 text-xs shadow-2xs flex items-center gap-2 shrink-0">
          <span className="text-stone-500 font-medium">Total Calculated Stock:</span>
          <span className="font-black text-sm text-[#965215] font-mono">
            {totalCalculatedStock} {totalCalculatedStock === 1 ? 'piece' : 'pieces'}
          </span>
        </div>
      </div>

      {/* 2. Category-Specific Intelligent Recommendation & Quick Presets */}
      <div className="space-y-2">
        {categoryName && (
          <div className="p-2.5 bg-amber-100/60 border border-amber-300 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <Sparkles size={15} className="text-[#965215] shrink-0" />
              <div>
                <span className="font-bold text-stone-900">
                  Recommended for &quot;{categoryName}&quot;:
                </span>
                <span className="ml-1 text-stone-700 font-mono">
                  {getRecommendedSizesForCategory(categoryName).join(', ')}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleApplyPreset(getRecommendedSizesForCategory(categoryName))}
              className="px-3 py-1 bg-[#965215] hover:bg-[#7A3F0E] text-white rounded-lg font-bold text-[11px] flex items-center justify-center gap-1 shadow-2xs cursor-pointer transition-colors shrink-0"
            >
              <span>⚡ Apply {categoryName} Sizes</span>
            </button>
          </div>
        )}

        <div>
          <span className="text-[11px] font-bold text-stone-600 block mb-1.5 uppercase tracking-wider">
            ⚡ Quick Category Presets:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {SIZE_PRESET_CATEGORIES.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleApplyPreset(preset.sizes)}
                className="text-[11px] font-semibold px-2.5 py-1 rounded-lg border bg-white hover:bg-amber-100/60 border-stone-200 hover:border-amber-300 text-stone-700 hover:text-stone-950 transition-colors cursor-pointer shadow-2xs"
                title={preset.description}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Available Sizes Checkbox / Pill Group */}
      <div className="bg-white/80 p-3.5 rounded-xl border border-amber-200/80 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-800 flex items-center gap-1.5">
            <span>Available Sizes</span>
            <span className="text-[10px] font-semibold text-stone-500">
              ({activeSizes.length} selected)
            </span>
          </span>
          {activeSizes.length > 0 && (
            <button
              type="button"
              onClick={() => onChangeVariants([])}
              className="text-[10px] text-red-600 hover:underline font-semibold cursor-pointer"
            >
              Clear All Sizes
            </button>
          )}
        </div>

        {/* Regular Clothing Sizing (XS - 5XL) */}
        <div>
          <span className="text-[10px] font-bold uppercase text-stone-400 block mb-1">
            Regular Clothing:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {CLOTHING_ALPHABET_SIZES.map((sz) => {
              const isSelected = activeSizes.includes(sz);
              return (
                <button
                  key={sz}
                  type="button"
                  onClick={() => toggleSize(sz)}
                  className={`min-w-10 h-8 px-2.5 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                    isSelected
                      ? 'bg-[#965215] text-white border-[#965215] shadow-xs scale-102'
                      : 'bg-white text-stone-700 border-stone-300 hover:border-stone-500 hover:bg-stone-50'
                  }`}
                >
                  <span>{isSelected ? '☑' : '☐'}</span>
                  <span>{sz}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Numeric Sizing (28 - 46 for Jeans, Lowers, Pants) */}
        <div className="pt-2 border-t border-stone-100">
          <span className="text-[10px] font-bold uppercase text-stone-400 block mb-1">
            Numeric Sizes (Jeans / Lower / Pants):
          </span>
          <div className="flex flex-wrap gap-1.5">
            {CLOTHING_NUMERIC_SIZES.map((sz) => {
              const isSelected = activeSizes.includes(sz);
              return (
                <button
                  key={sz}
                  type="button"
                  onClick={() => toggleSize(sz)}
                  className={`min-w-10 h-8 px-2.5 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                    isSelected
                      ? 'bg-[#965215] text-white border-[#965215] shadow-xs scale-102'
                      : 'bg-white text-stone-700 border-stone-300 hover:border-stone-500 hover:bg-stone-50'
                  }`}
                >
                  <span>{isSelected ? '☑' : '☐'}</span>
                  <span>{sz}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Sizes Added by Admin */}
        {sizeVariants.some(
          (v) =>
            !CLOTHING_ALPHABET_SIZES.includes(v.size) &&
            !CLOTHING_NUMERIC_SIZES.includes(v.size)
        ) && (
          <div className="pt-2 border-t border-stone-100">
            <span className="text-[10px] font-bold uppercase text-stone-400 block mb-1">
              Custom Added Sizes:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {sizeVariants
                .filter(
                  (v) =>
                    !CLOTHING_ALPHABET_SIZES.includes(v.size) &&
                    !CLOTHING_NUMERIC_SIZES.includes(v.size)
                )
                .map((v) => (
                  <button
                    key={v.size}
                    type="button"
                    onClick={() => toggleSize(v.size)}
                    className="min-w-10 h-8 px-2.5 rounded-lg text-xs font-bold border bg-[#965215] text-white border-[#965215] flex items-center gap-1 cursor-pointer"
                  >
                    <span>☑</span>
                    <span>{v.size}</span>
                  </button>
                ))}
            </div>
          </div>
        )}

        {/* 4. Add Custom Size Input Form */}
        <div className="pt-2 border-t border-stone-100">
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="+ Add Custom Size (e.g. 48, Free Size, 6-7 Years)"
              value={customSizeInput}
              onChange={(e) => {
                setCustomSizeInput(e.target.value);
                setCustomSizeError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddCustomSize();
                }
              }}
              className="flex-1 p-2 bg-stone-50 border border-stone-300 rounded-xl text-xs placeholder:text-stone-400 focus:bg-white focus:border-[#965215]"
            />
            <button
              type="button"
              onClick={() => handleAddCustomSize()}
              className="px-3.5 py-2 bg-stone-800 hover:bg-black text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer shadow-2xs transition-colors shrink-0"
            >
              <Plus size={14} />
              <span>Add Custom Size</span>
            </button>
          </div>
          {customSizeError && (
            <p className="text-[11px] font-semibold text-red-600 mt-1">
              {customSizeError}
            </p>
          )}
        </div>
      </div>

      {/* 5. Size Stock & Inventory Table */}
      {sizeVariants.length > 0 ? (
        <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-xs">
          <div className="p-3 bg-stone-100/70 border-b border-stone-200 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div>
              <span className="font-bold text-stone-800 uppercase tracking-wide">
                Size &bull; Stock Quantity
              </span>
              <p className="text-[10px] text-stone-500">
                Edit stock quantity for each individual size
              </p>
            </div>

            {/* Quick Bulk Stock Actions */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => handleSetAllStock(10)}
                className="px-2 py-1 bg-white hover:bg-stone-50 border border-stone-300 rounded-md text-[10px] font-bold text-stone-700 cursor-pointer shadow-2xs"
              >
                All = 10 pcs
              </button>
              <button
                type="button"
                onClick={() => handleSetAllStock(25)}
                className="px-2 py-1 bg-white hover:bg-stone-50 border border-stone-300 rounded-md text-[10px] font-bold text-stone-700 cursor-pointer shadow-2xs"
              >
                All = 25 pcs
              </button>
              <button
                type="button"
                onClick={handleDistributeStock}
                className="px-2 py-1 bg-[#965215]/10 hover:bg-[#965215]/20 border border-[#965215]/30 rounded-md text-[10px] font-bold text-[#965215] cursor-pointer"
                title="Distribute overall product stock evenly across active sizes"
              >
                Distribute Evenly
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-stone-50 text-stone-600 border-b border-stone-200 text-[11px] uppercase">
                  <th className="py-2.5 px-3 font-bold">Size</th>
                  <th className="py-2.5 px-3 font-bold">Stock Quantity (Pieces)</th>
                  <th className="py-2.5 px-3 font-bold">SKU (Optional)</th>
                  <th className="py-2.5 px-3 font-bold">Price Override (₹ Optional)</th>
                  <th className="py-2.5 px-3 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {sizeVariants.map((variant) => {
                  const currentQty = variant.stock_quantity ?? variant.stock ?? 0;
                  return (
                    <tr
                      key={variant.size}
                      className="hover:bg-amber-50/40 transition-colors"
                    >
                      {/* Size Badge */}
                      <td className="py-2 px-3">
                        <span className="inline-block px-2.5 py-1 rounded-md bg-[#FAF7F2] border border-[#E8DEC8] text-xs font-bold text-[#7A3F0E] font-mono">
                          {variant.size}
                        </span>
                      </td>

                      {/* Stock Quantity */}
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-1.5 max-w-[140px]">
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateStock(variant.size, currentQty - 1)
                            }
                            className="w-7 h-7 rounded-lg bg-stone-100 hover:bg-stone-200 font-bold text-stone-700 flex items-center justify-center cursor-pointer"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="0"
                            value={currentQty}
                            onChange={(e) =>
                              handleUpdateStock(variant.size, Number(e.target.value))
                            }
                            className="w-16 p-1.5 text-center bg-white border border-stone-300 rounded-lg text-xs font-bold text-stone-900 focus:border-[#965215]"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateStock(variant.size, currentQty + 1)
                            }
                            className="w-7 h-7 rounded-lg bg-stone-100 hover:bg-stone-200 font-bold text-stone-700 flex items-center justify-center cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </td>

                      {/* SKU */}
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          placeholder={`SKU-${variant.size}`}
                          value={variant.sku || ''}
                          onChange={(e) => handleUpdateSku(variant.size, e.target.value)}
                          className="w-28 p-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs font-mono"
                        />
                      </td>

                      {/* Price Override */}
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          min="0"
                          placeholder="Default"
                          value={variant.price_override || ''}
                          onChange={(e) => handleUpdatePriceOverride(variant.size, e.target.value ? Number(e.target.value) : undefined)}
                          className="w-24 p-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs font-mono"
                        />
                      </td>

                      {/* Remove Button */}
                      <td className="py-2 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => toggleSize(variant.size)}
                          className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Remove size"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-3 bg-[#FAF7F2] border-t border-[#E8DEC8] flex items-center justify-between text-xs text-stone-700">
            <span>
              Total of <strong>{sizeVariants.length} sizes</strong> defined.
            </span>
            <span className="font-bold text-[#7A3F0E]">
              Total Stock: {totalCalculatedStock} pieces
            </span>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-amber-100/50 border border-amber-300 rounded-xl text-center text-xs text-amber-900">
          <p className="font-bold">No sizes selected yet.</p>
          <p className="text-[11px] text-stone-600 mt-0.5">
            Click on the sizes above or pick a quick category preset to enable individual size stock.
          </p>
        </div>
      )}

      {/* 6. Optional Size Chart Section */}
      <div className="bg-white/90 p-4 rounded-xl border border-stone-200 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h5 className="font-bold text-xs text-stone-900 uppercase tracking-wide flex items-center gap-1.5">
              <Table size={14} className="text-[#965215]" />
              <span>Optional Size Chart</span>
            </h5>
            <p className="text-[11px] text-stone-500">
              Provide measurements (Chest, Length, Shoulder) or upload a size chart photo
            </p>
          </div>

          {/* Mode Selector */}
          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setSizeChartMode('none');
                onChangeSizeChart({ type: 'none' });
              }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                sizeChartMode === 'none'
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              None
            </button>
            <button
              type="button"
              onClick={enableMeasurementTable}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                sizeChartMode === 'table'
                  ? 'bg-[#965215] text-white shadow-2xs'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              <Table size={12} />
              <span>Measurement Table</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setSizeChartMode('image');
                onChangeSizeChart({
                  type: 'image',
                  imageUrl: sizeChart?.imageUrl,
                });
              }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                sizeChartMode === 'image'
                  ? 'bg-[#965215] text-white shadow-2xs'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              <ImageIcon size={12} />
              <span>Upload Chart Image</span>
            </button>
          </div>
        </div>

        {/* Size Chart Mode: Table */}
        {sizeChartMode === 'table' && (
          <div className="space-y-2 pt-2 border-t border-stone-100">
            <div className="overflow-x-auto rounded-lg border border-stone-200">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-stone-50 text-stone-700 text-[11px] uppercase border-b border-stone-200">
                    <th className="p-2 font-bold">Size</th>
                    <th className="p-2 font-bold">Chest (inches)</th>
                    <th className="p-2 font-bold">Length (inches)</th>
                    <th className="p-2 font-bold">Shoulder (inches)</th>
                    <th className="p-2 font-bold">Waist (inches)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {(sizeChart?.rows || buildDefaultSizeChartRows(activeSizes)).map(
                    (row, idx) => (
                      <tr key={row.size || idx}>
                        <td className="p-2 font-bold text-stone-900 font-mono">
                          {row.size}
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={row.chest || ''}
                            onChange={(e) =>
                              handleUpdateMeasurement(idx, 'chest', e.target.value)
                            }
                            placeholder="38"
                            className="w-16 p-1 bg-stone-50 border border-stone-200 rounded text-xs"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={row.length || ''}
                            onChange={(e) =>
                              handleUpdateMeasurement(idx, 'length', e.target.value)
                            }
                            placeholder="28"
                            className="w-16 p-1 bg-stone-50 border border-stone-200 rounded text-xs"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={row.shoulder || ''}
                            onChange={(e) =>
                              handleUpdateMeasurement(idx, 'shoulder', e.target.value)
                            }
                            placeholder="18"
                            className="w-16 p-1 bg-stone-50 border border-stone-200 rounded text-xs"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={row.waist || ''}
                            onChange={(e) =>
                              handleUpdateMeasurement(idx, 'waist', e.target.value)
                            }
                            placeholder="32"
                            className="w-16 p-1 bg-stone-50 border border-stone-200 rounded text-xs"
                          />
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
            <p className="text-[10px] text-stone-500">
              💡 Customers will be able to click &quot;Size Chart&quot; on the product page to see these exact measurements.
            </p>
          </div>
        )}

        {/* Size Chart Mode: Image Upload */}
        {sizeChartMode === 'image' && (
          <div className="space-y-3 pt-2 border-t border-stone-100">
            {sizeChart?.imageUrl ? (
              <div className="flex items-center gap-4 bg-stone-50 p-3 rounded-xl border border-stone-200">
                <img
                  src={sizeChart.imageUrl}
                  alt="Size Chart"
                  className="w-24 h-24 object-cover rounded-lg border border-stone-300 bg-white"
                />
                <div className="space-y-1">
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    ✓ Size Chart Image Attached
                  </span>
                  <p className="text-[11px] text-stone-500">
                    This image will appear in the customer Size Chart popup.
                  </p>
                  <label className="inline-block text-xs font-bold text-[#965215] hover:underline cursor-pointer">
                    <span>Change Image</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleChartImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            ) : (
              <label className="border-2 border-dashed border-stone-300 hover:border-[#965215] bg-[#FAF7F2] hover:bg-[#F5EFE6] rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer transition-colors text-center block">
                <Upload size={22} className="text-[#965215] mb-2" />
                <span className="text-xs font-bold text-stone-800">
                  {isUploadingChartImage ? 'Uploading image...' : 'Click to Upload Size Chart Image'}
                </span>
                <span className="text-[10px] text-stone-500 mt-1">
                  JPG, PNG or WEBP (Max 10 MB)
                </span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleChartImageUpload}
                  disabled={isUploadingChartImage}
                  className="hidden"
                />
              </label>
            )}

            {chartImageError && (
              <p className="text-xs font-semibold text-red-600 bg-red-50 p-2 rounded-lg">
                ⚠️ {chartImageError}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
