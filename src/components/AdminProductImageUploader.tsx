import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  X,
  GripVertical,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Star,
  RefreshCw,
} from 'lucide-react';
import {
  MAX_PRODUCT_IMAGES,
  validateImageFile,
  optimizeImageFile,
} from '../utils/imageOptimizer';
import { ProductImageItem } from '../types';

export interface ImageSlot {
  id: string;
  file?: File;
  url?: string;
  previewUrl: string;
}

interface AdminProductImageUploaderProps {
  initialImages?: string[];
  onChange: (slots: ImageSlot[]) => void;
  uploadImage?: (file: File, onProgress?: (progress: number) => void) => Promise<string>;
  onUploadStatusChange?: (status: {
    isUploading: boolean;
    current: number;
    total: number;
    isSuccess: boolean;
    message?: string;
  }) => void;
  onUploadError?: (message: string) => void;
  uploadStatus?: {
    isUploading: boolean;
    current: number;
    total: number;
    isSuccess: boolean;
    message?: string;
  };
}

export const AdminProductImageUploader: React.FC<AdminProductImageUploaderProps> = ({
  initialImages = [],
  onChange,
  uploadImage,
  onUploadStatusChange,
  onUploadError,
  uploadStatus,
}) => {
  const [imageSlots, setImageSlots] = useState<ImageSlot[]>(() => {
    return initialImages
      .filter((u) => Boolean(u && u.trim()))
      .slice(0, MAX_PRODUCT_IMAGES)
      .map((url, idx) => ({
        id: `init-${idx}-${Math.random().toString(36).substr(2, 6)}`,
        url,
        previewUrl: url,
      }));
  });

  const [validationError, setValidationError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [replaceTargetIndex, setReplaceTargetIndex] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);

  // Sync state upward whenever imageSlots change
  useEffect(() => {
    onChange(imageSlots);
  }, [imageSlots, onChange]);

  const uploadSlots = async (slots: ImageSlot[]) => {
    if (!uploadImage || slots.length === 0) return;

    let completed = 0;
    const failures: string[] = [];
    onUploadStatusChange?.({ isUploading: true, current: 0, total: slots.length, isSuccess: false });

    for (const slot of slots) {
      if (!slot.file) continue;
      try {
        const url = await uploadImage(slot.file);
        setImageSlots((current) => current.map((item) => {
          if (item.id !== slot.id) return item;
          if (item.previewUrl.startsWith('blob:')) URL.revokeObjectURL(item.previewUrl);
          return { ...item, file: undefined, url, previewUrl: url };
        }));
        completed += 1;
        onUploadStatusChange?.({ isUploading: true, current: completed, total: slots.length, isSuccess: false });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        failures.push(`${slot.file.name}: ${message}`);
      }
    }

    if (failures.length) {
      const message = `Firebase Storage upload failed. ${failures.join(' ')}`;
      setValidationError(message);
      onUploadError?.(message);
      onUploadStatusChange?.({ isUploading: false, current: completed, total: slots.length, isSuccess: false, message });
      return;
    }

    onUploadStatusChange?.({ isUploading: false, current: completed, total: slots.length, isSuccess: true });
  };

  // Process files selected or dropped
  const processFiles = async (files: FileList | File[]) => {
    setValidationError(null);
    const fileArray = Array.from(files);

    if (fileArray.length === 0) return;

    // Check maximum limit
    const availableSlots = MAX_PRODUCT_IMAGES - imageSlots.length;
    if (availableSlots <= 0) {
      setValidationError('Maximum 7 images allowed per product.');
      return;
    }

    if (fileArray.length > availableSlots) {
      setValidationError(`Maximum 7 images allowed per product. Only the first ${availableSlots} were added.`);
    }

    const filesToProcess = fileArray.slice(0, availableSlots);
    const validOptimizedSlots: ImageSlot[] = [];

    for (const file of filesToProcess) {
      const validation = validateImageFile(file);
      if (!validation.valid) {
        setValidationError(validation.error || 'Invalid image file.');
        return;
      }

      try {
        // Optimize in background
        const optimized = await optimizeImageFile(file, 1600, 0.85);
        const previewUrl = URL.createObjectURL(optimized);

        validOptimizedSlots.push({
          id: `slot-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          file: optimized,
          previewUrl,
        });
      } catch {
        // Fallback to original
        const previewUrl = URL.createObjectURL(file);
        validOptimizedSlots.push({
          id: `slot-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          file,
          previewUrl,
        });
      }
    }

    if (validOptimizedSlots.length > 0) {
      setImageSlots((prev) => [...prev, ...validOptimizedSlots]);
      void uploadSlots(validOptimizedSlots);
    }
  };

  // Replace single image
  const handleReplaceFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || replaceTargetIndex === null) {
      setReplaceTargetIndex(null);
      return;
    }

    const file = e.target.files[0];
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setValidationError(validation.error || 'Invalid image file.');
      setReplaceTargetIndex(null);
      return;
    }

    try {
      const optimized = await optimizeImageFile(file, 1600, 0.85);
      const previewUrl = URL.createObjectURL(optimized);

      const replacement: ImageSlot = {
        id: `slot-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        file: optimized,
        previewUrl,
      };
      setImageSlots((prev) => {
        const next = [...prev];
        if (next[replaceTargetIndex]) {
          next[replaceTargetIndex] = replacement;
        }
        return next;
      });
      void uploadSlots([replacement]);
    } catch {
      const previewUrl = URL.createObjectURL(file);
      const replacement: ImageSlot = {
        id: `slot-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        file,
        previewUrl,
      };
      setImageSlots((prev) => {
        const next = [...prev];
        if (next[replaceTargetIndex]) {
          next[replaceTargetIndex] = replacement;
        }
        return next;
      });
      void uploadSlots([replacement]);
    }

    setReplaceTargetIndex(null);
    if (replaceInputRef.current) {
      replaceInputRef.current.value = '';
    }
  };

  // Remove thumbnail
  const handleRemove = (index: number) => {
    setValidationError(null);
    setImageSlots((prev) => {
      const removed = prev[index];
      // Revoke object URL if created locally
      if (removed && removed.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(removed.previewUrl);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  // Move thumbnail left / right
  const handleMove = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= imageSlots.length) return;
    setImageSlots((prev) => {
      const next = [...prev];
      const [item] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, item);
      return next;
    });
  };

  // Set as primary image (move to index 0)
  const handleMakePrimary = (index: number) => {
    if (index === 0) return;
    handleMove(index, 0);
  };

  // Drag-and-drop reordering
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.setData('text/plain', `${index}`);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOverItem = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDropOnItem = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      return;
    }
    handleMove(draggedIndex, targetIndex);
    setDraggedIndex(null);
  };

  // Drag over upload box
  const handleBoxDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleBoxDragLeave = () => {
    setIsDragOver(false);
  };

  const handleBoxDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const canAddMore = imageSlots.length < MAX_PRODUCT_IMAGES;

  return (
    <div className="space-y-3">
      {/* Header with counter */}
      <div className="flex items-center justify-between">
        <div>
          <label className="block text-xs font-bold text-stone-800 uppercase tracking-wide">
            Product Images <span className="text-amber-800 font-normal">({imageSlots.length}/{MAX_PRODUCT_IMAGES})</span>
          </label>
          <p className="text-[11px] text-stone-500">
            Upload 5–7 product images (JPG, PNG, WEBP up to 10 MB). 1st image is the Primary cover photo.
          </p>
        </div>

        {imageSlots.length > 0 && (
          <span
            className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
              imageSlots.length >= 5 && imageSlots.length <= 7
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-800 border-amber-200'
            }`}
          >
            {imageSlots.length >= 5 ? '✓ Ideal (5–7 images)' : `${imageSlots.length}/7 images`}
          </span>
        )}
      </div>

      {/* Validation Error banner */}
      {validationError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-start justify-between gap-2 animate-fadeIn">
          <div className="flex items-center gap-2">
            <AlertCircle size={15} className="text-red-600 shrink-0" />
            <span>{validationError}</span>
          </div>
          <button
            type="button"
            onClick={() => setValidationError(null)}
            className="text-red-500 hover:text-red-800 cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Upload Progress Status Banner */}
      {uploadStatus?.isUploading && (
        <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-amber-900">
            <span className="flex items-center gap-2">
              <Loader2 size={15} className="animate-spin text-[#965215]" />
              Uploading {uploadStatus.current} of {uploadStatus.total} images...
            </span>
            <span>
              {Math.round((uploadStatus.current / (uploadStatus.total || 1)) * 100)}%
            </span>
          </div>
          <div className="w-full h-2 bg-amber-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#965215] transition-all duration-300 rounded-full"
              style={{
                width: `${Math.round((uploadStatus.current / (uploadStatus.total || 1)) * 100)}%`,
              }}
            />
          </div>
          <p className="text-[10px] text-amber-800">
            Uploading optimized images to Firebase Storage
          </p>
        </div>
      )}

      {uploadStatus?.isSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-bold flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-600" />
          <span>✓ Images uploaded successfully to Firebase Storage</span>
        </div>
      )}

      {/* Drag & Drop Upload Box */}
      {canAddMore ? (
        <div
          onDragOver={handleBoxDragOver}
          onDragLeave={handleBoxDragLeave}
          onDrop={handleBoxDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-2 ${
            isDragOver
              ? 'border-[#965215] bg-amber-50/80 scale-[1.01]'
              : 'border-stone-300 hover:border-[#965215] bg-[#FAF7F2] hover:bg-amber-50/40'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/jpg"
            onChange={(e) => {
              if (e.target.files) {
                void processFiles(e.target.files);
              }
              e.target.value = '';
            }}
            className="hidden"
          />

          <div className="w-12 h-12 rounded-2xl bg-white shadow-xs border border-stone-200 text-[#965215] flex items-center justify-center text-2xl mb-1">
            📸
          </div>

          <div className="space-y-0.5">
            <p className="font-bold text-sm text-stone-800 font-['Marcellus']">
              📸 Drag &amp; Drop Product Images Here
            </p>
            <p className="text-xs text-stone-500">
              or <span className="font-bold text-[#965215] underline cursor-pointer">Browse Images</span>
            </p>
          </div>

          <div className="mt-1 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-stone-200 text-[11px] text-stone-600 font-medium">
            <span>Upload 5–7 product images</span>
            <span className="text-stone-300">&bull;</span>
            <span className="text-stone-500">Max 7 images (up to 10 MB each)</span>
          </div>
        </div>
      ) : (
        <div className="p-3 bg-stone-100 border border-stone-200 rounded-xl text-center text-xs text-stone-600 font-medium">
          Maximum 7 images reached. Remove an image to upload a different one.
        </div>
      )}

      {/* Hidden file input for Replace action */}
      <input
        ref={replaceInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/jpg"
        onChange={handleReplaceFile}
        className="hidden"
      />

      {/* Thumbnail Previews & Reordering List */}
      {imageSlots.length > 0 && (
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-xs text-stone-500">
            <span className="font-semibold text-stone-700">
              Image Gallery Previews ({imageSlots.length})
            </span>
            <span className="text-[11px] text-stone-400">
              Drag thumbnails or use arrows to reorder. 1st image is Primary.
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
            {imageSlots.map((slot, index) => {
              const isPrimary = index === 0;
              const isBeingDragged = draggedIndex === index;

              return (
                <div
                  key={slot.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={handleDragOverItem}
                  onDrop={(e) => handleDropOnItem(e, index)}
                  className={`group relative aspect-square rounded-xl overflow-hidden border-2 bg-stone-100 transition-all cursor-grab active:cursor-grabbing shadow-xs ${
                    isPrimary
                      ? 'border-[#965215] ring-2 ring-[#965215]/20 shadow-md'
                      : 'border-stone-200 hover:border-stone-400'
                  } ${isBeingDragged ? 'opacity-40 scale-95' : 'opacity-100'}`}
                >
                  {/* Image Preview */}
                  <img
                    src={slot.previewUrl}
                    alt={`Product preview ${index + 1}`}
                    className="w-full h-full object-cover select-none"
                    loading="lazy"
                  />

                  {/* Primary / Number Badge */}
                  <div className="absolute top-1.5 left-1.5 z-10">
                    {isPrimary ? (
                      <span className="inline-flex items-center gap-1 bg-[#965215] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md shadow-sm">
                        <Star size={10} className="fill-white" />
                        <span>1 Primary</span>
                      </span>
                    ) : (
                      <span className="bg-black/70 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md backdrop-blur-xs shadow-sm">
                        {index + 1}
                      </span>
                    )}
                  </div>

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(index);
                    }}
                    title="Remove image"
                    className="absolute top-1.5 right-1.5 z-10 w-6 h-6 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-md cursor-pointer transition-transform hover:scale-110"
                  >
                    <X size={12} />
                  </button>

                  {slot.file && !uploadStatus?.isUploading && uploadImage && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        void uploadSlots([slot]);
                      }}
                      title="Retry Firebase Storage upload"
                      className="absolute top-1.5 right-9 z-10 w-6 h-6 rounded-full bg-white text-[#965215] flex items-center justify-center shadow-md cursor-pointer"
                    >
                      <RefreshCw size={12} />
                    </button>
                  )}

                  {/* Bottom Action Bar on Hover/Focus */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-1 pt-3 flex items-center justify-between text-white text-[10px] opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    {/* Move Left */}
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMove(index, index - 1);
                      }}
                      title="Move left"
                      className="p-1 hover:bg-white/20 rounded disabled:opacity-20 cursor-pointer"
                    >
                      <ChevronLeft size={13} />
                    </button>

                    {/* Replace Image Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setReplaceTargetIndex(index);
                        replaceInputRef.current?.click();
                      }}
                      title="Replace image"
                      className="p-1 hover:bg-white/20 rounded cursor-pointer"
                    >
                      <RefreshCw size={11} />
                    </button>

                    {/* Drag Handle Icon Indicator */}
                    <span title="Drag to reorder" className="cursor-grab">
                      <GripVertical size={13} className="text-stone-300" />
                    </span>

                    {/* Move Right */}
                    <button
                      type="button"
                      disabled={index === imageSlots.length - 1}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMove(index, index + 1);
                      }}
                      title="Move right"
                      className="p-1 hover:bg-white/20 rounded disabled:opacity-20 cursor-pointer"
                    >
                      <ChevronRight size={13} />
                    </button>
                  </div>

                  {/* Quick Make Primary Button (if not primary) */}
                  {!isPrimary && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMakePrimary(index);
                      }}
                      className="absolute inset-x-1 bottom-8 bg-white/95 hover:bg-white text-[#965215] text-[9px] font-bold py-1 rounded shadow-xs opacity-0 group-hover:opacity-100 transition-opacity text-center cursor-pointer border border-amber-300"
                    >
                      Make Primary
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
