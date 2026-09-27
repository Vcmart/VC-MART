import React, { useState } from 'react';
import { Palette, Plus, AlertCircle, Sparkles } from 'lucide-react';
import {
  DEFAULT_RETAIL_COLORS,
  getColorHex,
} from '../utils/clothingSizes';

interface AdminProductColorManagerProps {
  categoryName?: string;
  shopId?: string;
  colors: string[];
  onChangeColors: (colors: string[]) => void;
}

export const AdminProductColorManager: React.FC<AdminProductColorManagerProps> = ({
  categoryName = 'Clothing',
  shopId = 'vinayak-collection',
  colors = [],
  onChangeColors,
}) => {
  const [customColorInput, setCustomColorInput] = useState('');
  const [customColorError, setCustomColorError] = useState<string | null>(null);

  // Normalize selected colors
  const selectedColors = colors || [];

  // Identify custom colors (colors not in DEFAULT_RETAIL_COLORS)
  const customColors = selectedColors.filter(
    (c) => !DEFAULT_RETAIL_COLORS.some((def) => def.toLowerCase() === c.toLowerCase())
  );

  // Toggle a color selection
  const toggleColor = (colorName: string) => {
    const trimmed = colorName.trim();
    if (!trimmed) return;

    const exists = selectedColors.some(
      (c) => c.toLowerCase() === trimmed.toLowerCase()
    );

    if (exists) {
      // Remove
      onChangeColors(selectedColors.filter((c) => c.toLowerCase() !== trimmed.toLowerCase()));
    } else {
      // Add
      onChangeColors([...selectedColors, trimmed]);
    }
  };

  // Add custom color
  const handleAddCustomColor = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = customColorInput.trim();
    if (!trimmed) {
      setCustomColorError('Please enter a color name (e.g. Lavender, Teal, Olive Green, Wine).');
      return;
    }

    const alreadySelected = selectedColors.some(
      (c) => c.toLowerCase() === trimmed.toLowerCase()
    );
    if (alreadySelected) {
      setCustomColorError(`Color "${trimmed}" is already selected.`);
      return;
    }

    setCustomColorError(null);
    onChangeColors([...selectedColors, trimmed]);
    setCustomColorInput('');
  };

  // Preset Palettes
  const applyPreset = (presetColors: string[]) => {
    onChangeColors(Array.from(new Set(presetColors)));
  };

  return (
    <div className="p-4 sm:p-5 bg-gradient-to-br from-amber-50/70 via-stone-50 to-orange-50/40 border border-amber-200 rounded-2xl space-y-4">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-amber-200/70">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#965215] text-white flex items-center justify-center font-bold text-sm shadow-xs">
            <Palette size={16} />
          </div>
          <div>
            <h4 className="font-bold text-sm text-stone-900 tracking-wide uppercase flex items-center gap-2">
              <span>AVAILABLE COLORS</span>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                Retail Clothing
              </span>
            </h4>
            <p className="text-[11px] text-stone-500">
              Select available colors for customer retail selection (customers can choose color + size on product page)
            </p>
          </div>
        </div>

        {/* Selected Count Indicator Badge */}
        <div className="bg-white px-3 py-1.5 rounded-xl border border-amber-200 text-xs shadow-2xs flex items-center gap-2 shrink-0">
          <span className="text-stone-500 font-medium">Selected Colors:</span>
          <span className="font-black text-sm text-[#965215] font-mono">
            {selectedColors.length} {selectedColors.length === 1 ? 'color' : 'colors'}
          </span>
        </div>
      </div>

      {/* 2. Quick Presets */}
      <div>
        <span className="text-[11px] font-bold text-stone-600 block mb-1.5 uppercase tracking-wider">
          ⚡ Quick Color Presets:
        </span>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => applyPreset(['Black', 'White', 'Navy Blue', 'Grey', 'Maroon', 'Beige'])}
            className="text-[11px] font-semibold px-2.5 py-1 rounded-lg border bg-white hover:bg-amber-100/60 border-stone-200 hover:border-amber-300 text-stone-700 hover:text-stone-950 transition-colors cursor-pointer shadow-2xs"
          >
            Popular Neutrals
          </button>
          <button
            type="button"
            onClick={() => applyPreset(['Red', 'Blue', 'Green', 'Yellow', 'Pink', 'Purple', 'Orange'])}
            className="text-[11px] font-semibold px-2.5 py-1 rounded-lg border bg-white hover:bg-amber-100/60 border-stone-200 hover:border-amber-300 text-stone-700 hover:text-stone-950 transition-colors cursor-pointer shadow-2xs"
          >
            Vibrant Colors
          </button>
          <button
            type="button"
            onClick={() => applyPreset(DEFAULT_RETAIL_COLORS)}
            className="text-[11px] font-semibold px-2.5 py-1 rounded-lg border bg-white hover:bg-amber-100/60 border-stone-200 hover:border-amber-300 text-stone-700 hover:text-stone-950 transition-colors cursor-pointer shadow-2xs"
          >
            Select All 14 Colors
          </button>
        </div>
      </div>

      {/* 3. Available Colors Checkbox / Pill Group */}
      <div className="bg-white/80 p-3.5 rounded-xl border border-amber-200/80 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-800 flex items-center gap-1.5">
            <span>Available Colors</span>
            <span className="text-[10px] font-semibold text-stone-500">
              ({selectedColors.length} selected)
            </span>
          </span>
          {selectedColors.length > 0 && (
            <button
              type="button"
              onClick={() => onChangeColors([])}
              className="text-[10px] text-red-600 hover:underline font-semibold cursor-pointer"
            >
              Clear All Colors
            </button>
          )}
        </div>

        {/* Standard Selectable Color Buttons */}
        <div>
          <span className="text-[10px] font-bold uppercase text-stone-400 block mb-1">
            Standard Clothing Colors:
          </span>
          <div className="flex flex-wrap gap-2">
            {DEFAULT_RETAIL_COLORS.map((col) => {
              const isSelected = selectedColors.some(
                (c) => c.toLowerCase() === col.toLowerCase()
              );
              const hex = getColorHex(col);

              return (
                <button
                  key={col}
                  type="button"
                  onClick={() => toggleColor(col)}
                  className={`min-h-9 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    isSelected
                      ? 'bg-[#965215] text-white border-[#965215] shadow-xs scale-102'
                      : 'bg-white text-stone-700 border-stone-300 hover:border-stone-500 hover:bg-stone-50'
                  }`}
                  title={`${isSelected ? 'Selected' : 'Select'} ${col}`}
                >
                  <span className="text-xs font-mono">{isSelected ? '☑' : '☐'}</span>
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-black/20 shrink-0 shadow-2xs"
                    style={{ backgroundColor: hex }}
                  />
                  <span>{col}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Added Colors */}
        {customColors.length > 0 && (
          <div className="pt-2 border-t border-stone-100">
            <span className="text-[10px] font-bold uppercase text-stone-400 block mb-1">
              Custom Added Colors:
            </span>
            <div className="flex flex-wrap gap-2">
              {customColors.map((col) => {
                const hex = getColorHex(col);
                return (
                  <button
                    key={col}
                    type="button"
                    onClick={() => toggleColor(col)}
                    className="min-h-9 px-3 rounded-lg text-xs font-bold border bg-[#965215] text-white border-[#965215] flex items-center gap-2 cursor-pointer shadow-xs"
                    title={`Click to remove ${col}`}
                  >
                    <span className="text-xs font-mono">☑</span>
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-white/40 shrink-0 shadow-2xs"
                      style={{ backgroundColor: hex }}
                    />
                    <span>{col}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 4. Add Custom Color Input Form */}
        <div className="pt-2 border-t border-stone-100">
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="+ Add Custom Color (e.g. Lavender, Teal, Rust, Wine)"
              value={customColorInput}
              onChange={(e) => {
                setCustomColorInput(e.target.value);
                setCustomColorError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddCustomColor();
                }
              }}
              className="flex-1 p-2 bg-stone-50 border border-stone-300 rounded-lg text-xs focus:bg-white focus:border-[#965215] focus:outline-hidden"
            />
            <button
              type="button"
              onClick={() => handleAddCustomColor()}
              className="px-3 py-2 bg-[#965215] hover:bg-[#7A3F0E] text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs shrink-0"
            >
              <Plus size={14} />
              <span>Add Color</span>
            </button>
          </div>
          {customColorError && (
            <p className="text-[11px] text-red-600 font-semibold mt-1 flex items-center gap-1">
              <AlertCircle size={12} />
              {customColorError}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
