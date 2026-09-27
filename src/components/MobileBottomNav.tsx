import React from 'react';
import { Home, LayoutGrid, Search, Heart, ShoppingCart } from 'lucide-react';
import { useStore } from '../context/StoreContext';

interface MobileBottomNavProps {
  onOpenSearch?: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ onOpenSearch }) => {
  const {
    currentView,
    setCurrentView,
    setActiveShopId,
    wishlist,
    cartCount,
    setIsCartDrawerOpen,
    isCartDrawerOpen,
    setFilters,
  } = useStore();

  const handleHomeClick = () => {
    setActiveShopId('all');
    setCurrentView('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCategoriesClick = () => {
    setCurrentView('shop');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearchClick = () => {
    if (onOpenSearch) {
      onOpenSearch();
    } else {
      setCurrentView('shop');
    }
  };

  const handleWishlistClick = () => {
    setFilters((prev) => ({ ...prev, shopId: 'all' }));
    setCurrentView('shop');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCartClick = () => {
    setIsCartDrawerOpen(true);
  };

  return (
    <nav
      id="mobile-bottom-nav"
      aria-label="Mobile Bottom Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FAF7F2]/95 backdrop-blur-md border-t border-[#E8DEC8] px-2 py-1 shadow-[0_-3px_12px_rgba(0,0,0,0.08)]"
      style={{ paddingBottom: 'calc(0.25rem + env(safe-area-inset-bottom, 0px))' }}
    >
      <div className="grid grid-cols-5 items-center max-w-md mx-auto">
        {/* 1. Home */}
        <button
          type="button"
          id="mobile-nav-home"
          onClick={handleHomeClick}
          className={`flex flex-col items-center justify-center py-1 transition-colors cursor-pointer ${
            currentView === 'home' && !isCartDrawerOpen
              ? 'text-[#965215] font-bold'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <Home size={19} className={currentView === 'home' && !isCartDrawerOpen ? 'stroke-[2.5]' : ''} />
          <span className="text-[10px] mt-0.5 tracking-tight font-medium">Home</span>
        </button>

        {/* 2. Categories / Shop */}
        <button
          type="button"
          id="mobile-nav-categories"
          onClick={handleCategoriesClick}
          className={`flex flex-col items-center justify-center py-1 transition-colors cursor-pointer ${
            currentView === 'shop' && !isCartDrawerOpen
              ? 'text-[#965215] font-bold'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <LayoutGrid size={19} className={currentView === 'shop' && !isCartDrawerOpen ? 'stroke-[2.5]' : ''} />
          <span className="text-[10px] mt-0.5 tracking-tight font-medium">Shop</span>
        </button>

        {/* 3. Search */}
        <button
          type="button"
          id="mobile-nav-search"
          onClick={handleSearchClick}
          className="flex flex-col items-center justify-center py-1 text-stone-600 hover:text-stone-900 transition-colors cursor-pointer"
        >
          <Search size={19} />
          <span className="text-[10px] mt-0.5 tracking-tight font-medium">Search</span>
        </button>

        {/* 4. Wishlist */}
        <button
          type="button"
          id="mobile-nav-wishlist"
          onClick={handleWishlistClick}
          className="relative flex flex-col items-center justify-center py-1 text-stone-600 hover:text-stone-900 transition-colors cursor-pointer"
        >
          <Heart size={19} className={wishlist.length > 0 ? 'fill-red-500 text-red-500' : ''} />
          {wishlist.length > 0 && (
            <span className="absolute top-0 right-3.5 bg-[#B91C1C] text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
              {wishlist.length}
            </span>
          )}
          <span className="text-[10px] mt-0.5 tracking-tight font-medium">Wishlist</span>
        </button>

        {/* 5. Cart */}
        <button
          type="button"
          id="mobile-nav-cart"
          onClick={handleCartClick}
          className={`relative flex flex-col items-center justify-center py-1 transition-colors cursor-pointer ${
            isCartDrawerOpen ? 'text-[#965215] font-bold' : 'text-stone-700 hover:text-[#965215]'
          }`}
        >
          <ShoppingCart size={19} className={cartCount > 0 ? 'text-[#965215] stroke-[2.2]' : ''} />
          {cartCount > 0 && (
            <span className="absolute top-0 right-3 bg-[#965215] text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-xs animate-in zoom-in-50">
              {cartCount}
            </span>
          )}
          <span className="text-[10px] mt-0.5 tracking-tight font-bold text-[#965215]">
            Cart{cartCount > 0 ? ` (${cartCount})` : ''}
          </span>
        </button>
      </div>
    </nav>
  );
};
