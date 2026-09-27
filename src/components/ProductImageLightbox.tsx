import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface ProductImageLightboxProps {
  images: string[];
  initialIndex: number;
  productName: string;
  onClose: () => void;
}

export const ProductImageLightbox: React.FC<ProductImageLightboxProps> = ({ images, initialIndex, productName, onClose }) => {
  const [index, setIndex] = useState(initialIndex);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowLeft' && images.length > 1) setIndex((current) => (current - 1 + images.length) % images.length);
      if (event.key === 'ArrowRight' && images.length > 1) setIndex((current) => (current + 1) % images.length);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [images.length, onClose]);

  if (!images.length) return null;

  return createPortal((
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${productName} images`}
      className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-4"
      onClick={(event) => { event.stopPropagation(); onClose(); }}
    >
      <button type="button" aria-label="Close image viewer" onClick={onClose} className="absolute top-4 right-4 z-10 rounded-full bg-white/15 hover:bg-white/25 text-white p-2 cursor-pointer">
        <X size={24} />
      </button>
      <div className="text-white text-sm font-semibold mb-3" aria-live="polite">{index + 1} / {images.length}</div>
      <div className="relative flex items-center justify-center w-full max-w-6xl min-h-0 flex-1">
        {images.length > 1 && (
          <button type="button" aria-label="Previous image" onClick={(event) => { event.stopPropagation(); setIndex((current) => (current - 1 + images.length) % images.length); }} className="absolute left-0 z-10 rounded-full bg-white/15 hover:bg-white/25 text-white p-2 cursor-pointer">
            <ChevronLeft size={26} />
          </button>
        )}
        <img src={images[index]} alt={`${productName} — image ${index + 1}`} onClick={(event) => event.stopPropagation()} className="max-w-full max-h-full w-auto h-auto object-contain select-none" />
        {images.length > 1 && (
          <button type="button" aria-label="Next image" onClick={(event) => { event.stopPropagation(); setIndex((current) => (current + 1) % images.length); }} className="absolute right-0 z-10 rounded-full bg-white/15 hover:bg-white/25 text-white p-2 cursor-pointer">
            <ChevronRight size={26} />
          </button>
        )}
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 max-w-full overflow-x-auto py-3" onClick={(event) => event.stopPropagation()}>
          {images.map((url, imageIndex) => (
            <button key={`${url}-${imageIndex}`} type="button" aria-label={`View image ${imageIndex + 1}`} onClick={() => setIndex(imageIndex)} className={`w-12 h-12 shrink-0 overflow-hidden rounded-lg border-2 cursor-pointer ${index === imageIndex ? 'border-[#B47226]' : 'border-white/30'}`}>
              <img src={url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  ), document.body);
};
