import React from 'react';
import { useStore } from '../context/StoreContext';
import { getInitialLogoSync } from '../utils/branding';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  variant?: 'full' | 'emblem' | 'horizontal' | 'image-only';
  theme?: 'light' | 'dark' | 'gold';
}

export const Logo: React.FC<LogoProps> = ({
  className = '',
  size = 'md',
  showSubtitle = true,
  variant = 'full',
  theme = 'light',
}) => {
  // Retrieve global Admin-selected logo as the single source of truth
  let activeLogoSrc = '';
  try {
    const store = useStore();
    activeLogoSrc = store.customLogo || store.activeLogo || getInitialLogoSync();
  } catch {
    activeLogoSrc = getInitialLogoSync();
  }

  const getDimensions = () => {
    switch (size) {
      case 'sm':
        return {
          containerClass: 'w-7 h-7 sm:w-9 sm:h-9 rounded-lg',
          titleSize: 'text-xs sm:text-sm',
          subSize: 'text-[8px] sm:text-[9px]',
        };
      case 'lg':
        return {
          containerClass: 'w-14 h-14 sm:w-20 sm:h-20 rounded-2xl',
          titleSize: 'text-lg sm:text-2xl',
          subSize: 'text-xs',
        };
      case 'xl':
        return {
          containerClass: 'w-20 h-20 sm:w-28 sm:h-28 rounded-2xl',
          titleSize: 'text-2xl sm:text-3xl',
          subSize: 'text-sm',
        };
      case 'md':
      default:
        return {
          containerClass: 'w-8 h-8 min-[380px]:w-9 min-[380px]:h-9 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-lg sm:rounded-xl',
          titleSize: 'text-sm min-[380px]:text-base sm:text-lg md:text-xl',
          subSize: 'text-[9px] sm:text-[10px]',
        };
    }
  };

  const { containerClass, titleSize, subSize } = getDimensions();

  // Official logo image element with guaranteed aspect ratio & crisp rendering
  const logoImageElement = (
    <div
      className={`relative shrink-0 overflow-hidden select-none transition-all duration-300 ${
        theme === 'dark'
          ? 'bg-[#FAF8F5] p-1 border border-[#DFB062]/40 shadow-md'
          : 'bg-[#FAF8F5] p-0.5 border border-[#E8DEC8] shadow-2xs'
      } ${containerClass}`}
    >
      <img
        src={activeLogoSrc}
        alt="VC MART Official Logo"
        referrerPolicy="no-referrer"
        className="w-full h-full aspect-square object-contain transition-transform duration-300 group-hover:scale-105"
      />
    </div>
  );

  if (variant === 'emblem' || variant === 'image-only') {
    return (
      <div className={`inline-flex items-center justify-center ${className}`}>
        {logoImageElement}
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-2.5 sm:gap-3 group cursor-pointer select-none ${className}`}
    >
      {logoImageElement}

      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <span
            className={`font-['Marcellus'] font-bold tracking-wider leading-none ${titleSize} ${
              theme === 'dark'
                ? 'text-amber-100'
                : 'text-[#3E1D0C] group-hover:text-[#965215]'
            } transition-colors`}
          >
            VC MART
          </span>
          <span className="hidden min-[380px]:inline-block text-[8px] sm:text-[9px] uppercase font-bold tracking-widest px-1 sm:px-1.5 py-0.5 rounded bg-[#965215]/10 text-[#965215] border border-[#965215]/20">
            OFFICIAL
          </span>
        </div>

        {showSubtitle && (
          <div className="hidden sm:flex items-center gap-1 mt-0.5">
            <span className="h-px w-2 sm:w-3 bg-[#B47226]/40" />
            <span
              className={`uppercase tracking-[0.16em] font-semibold ${
                theme === 'dark' ? 'text-[#D89B47]' : 'text-[#8B4513]/80'
              } ${subSize}`}
            >
              YOUR TRUST &bull; OUR QUALITY
            </span>
            <span className="h-px w-2 sm:w-3 bg-[#B47226]/40" />
          </div>
        )}
      </div>
    </div>
  );
};
