import React from 'react';
import { X, Ruler, HelpCircle, Check } from 'lucide-react';
import { ProductSizeChart, SizeChartRow } from '../types';

interface SizeChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  productName: string;
  categoryName?: string;
  sizeChart?: ProductSizeChart;
  availableSizes?: string[];
}

export const SizeChartModal: React.FC<SizeChartModalProps> = ({
  isOpen,
  onClose,
  productName,
  categoryName = 'Clothing',
  sizeChart,
  availableSizes = ['S', 'M', 'L', 'XL', 'XXL'],
}) => {
  if (!isOpen) return null;

  const isNumeric = availableSizes.some((s) => !isNaN(Number(s)));

  // Fallback measurement rows if sizeChart table isn't customized
  const defaultRows: SizeChartRow[] = isNumeric
    ? [
        { size: '28', waist: '28', hip: '36', length: '38' },
        { size: '30', waist: '30', hip: '38', length: '39' },
        { size: '32', waist: '32', hip: '40', length: '40' },
        { size: '34', waist: '34', hip: '42', length: '41' },
        { size: '36', waist: '36', hip: '44', length: '41' },
        { size: '38', waist: '38', hip: '46', length: '42' },
        { size: '40', waist: '40', hip: '48', length: '42' },
        { size: '42', waist: '42', hip: '50', length: '43' },
        { size: '44', waist: '44', hip: '52', length: '43' },
      ]
    : [
        { size: 'XS', chest: '36', length: '26', shoulder: '16.5' },
        { size: 'S', chest: '38', length: '27', shoulder: '17' },
        { size: 'M', chest: '40', length: '28', shoulder: '18' },
        { size: 'L', chest: '42', length: '29', shoulder: '19' },
        { size: 'XL', chest: '44', length: '30', shoulder: '20' },
        { size: 'XXL', chest: '46', length: '31', shoulder: '21' },
        { size: '3XL', chest: '48', length: '32', shoulder: '22' },
        { size: '4XL', chest: '50', length: '33', shoulder: '22.5' },
        { size: '5XL', chest: '52', length: '34', shoulder: '23' },
      ];

  const rows =
    sizeChart?.rows && sizeChart.rows.length > 0
      ? sizeChart.rows
      : defaultRows.filter(
          (r) =>
            availableSizes.length === 0 ||
            availableSizes.some((s) => s.toUpperCase() === r.size.toUpperCase())
        );

  return (
    <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="relative bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-[#E8DEC8] my-auto animate-fadeIn">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 flex items-center justify-between bg-[#FAF7F2]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#965215] text-white flex items-center justify-center shadow-xs">
              <Ruler size={16} />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-stone-900 font-['Marcellus']">
                Size & Measurement Guide
              </h3>
              <p className="text-[11px] text-stone-500 truncate max-w-xs sm:max-w-md">
                {productName} &bull; {categoryName}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white hover:bg-stone-200 text-stone-700 flex items-center justify-center cursor-pointer shadow-xs transition-colors"
            aria-label="Close size chart"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4">
          {/* If Custom Size Chart Image was uploaded by Admin */}
          {sizeChart?.type === 'image' && sizeChart.imageUrl ? (
            <div className="space-y-3">
              <div className="rounded-2xl overflow-hidden border border-stone-200 bg-stone-50 flex justify-center">
                <img
                  src={sizeChart.imageUrl}
                  alt={`Size Chart for ${productName}`}
                  className="max-h-96 w-auto object-contain"
                />
              </div>
              <p className="text-center text-xs text-stone-500">
                Official sizing specifications provided by VC MART.
              </p>
            </div>
          ) : (
            <>
              {/* Measurement Table */}
              <div className="overflow-x-auto rounded-2xl border border-stone-200 shadow-2xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#FAF7F2] text-stone-700 text-[11px] font-bold uppercase tracking-wider border-b border-stone-200">
                      <th className="py-3 px-3.5">Size</th>
                      {isNumeric ? (
                        <>
                          <th className="py-3 px-3.5">Waist (in)</th>
                          <th className="py-3 px-3.5">Hip (in)</th>
                          <th className="py-3 px-3.5">Length (in)</th>
                        </>
                      ) : (
                        <>
                          <th className="py-3 px-3.5">Chest (in)</th>
                          <th className="py-3 px-3.5">Length (in)</th>
                          <th className="py-3 px-3.5">Shoulder (in)</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {rows.map((r, idx) => (
                      <tr
                        key={r.size || idx}
                        className="hover:bg-amber-50/50 transition-colors"
                      >
                        <td className="py-2.5 px-3.5 font-black text-stone-900 font-mono text-xs">
                          <span className="inline-block px-2 py-0.5 rounded bg-stone-100 border border-stone-200">
                            {r.size}
                          </span>
                        </td>
                        {isNumeric ? (
                          <>
                            <td className="py-2.5 px-3.5 text-stone-700 font-medium">
                              {r.waist || '-'}
                            </td>
                            <td className="py-2.5 px-3.5 text-stone-700 font-medium">
                              {r.hip || '-'}
                            </td>
                            <td className="py-2.5 px-3.5 text-stone-700 font-medium">
                              {r.length || '-'}
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="py-2.5 px-3.5 text-stone-700 font-medium">
                              {r.chest || '-'}
                            </td>
                            <td className="py-2.5 px-3.5 text-stone-700 font-medium">
                              {r.length || '-'}
                            </td>
                            <td className="py-2.5 px-3.5 text-stone-700 font-medium">
                              {r.shoulder || '-'}
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Measuring Guidelines */}
              <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 text-xs text-stone-700 space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-amber-950 uppercase tracking-wide text-[11px]">
                  <HelpCircle size={14} className="text-[#965215]" />
                  <span>How to Measure Your Perfect Fit:</span>
                </div>
                <ul className="space-y-1.5 text-[11px] text-stone-600 pl-4 list-disc">
                  <li>
                    <strong>Chest:</strong> Measure around the fullest part of your chest, keeping the measuring tape horizontal under your arms.
                  </li>
                  <li>
                    <strong>Length:</strong> Measure vertically from the highest point of your shoulder down to the bottom hemline.
                  </li>
                  <li>
                    <strong>Shoulder:</strong> Measure horizontally across your upper back from the tip of one shoulder seam to the other.
                  </li>
                  {isNumeric && (
                    <li>
                      <strong>Waist:</strong> Measure around your natural waistline where your trousers normally sit.
                    </li>
                  )}
                </ul>
              </div>
            </>
          )}

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-2.5 bg-[#965215] hover:bg-[#7A3F0E] text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-sm"
            >
              Got it, Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
