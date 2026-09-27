import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  ShoppingCart,
  Heart,
  User,
  MessageCircle,
  Menu,
  X,
  Phone,
  Truck,
  ShieldCheck,
  ChevronDown,
  Sparkles,
  Layers,
  ArrowRight,
  Mail,
  Camera,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Logo } from './Logo';
import { LogoManager } from './LogoManager';
import { siteConfig } from '../config/siteConfig';

export const Header: React.FC = () => {
  const {
    cartCount,
    wishlist,
    setIsCartDrawerOpen,
    currentView,
    setCurrentView,
    setActiveShopId,
    filters,
    setFilters,
    searchQuery,
    setSearchQuery,
    products,
    openProductDetails,
    shops,
    currentUser,
    isAdminLoggedIn,
    shoppingMode,
    setShoppingMode,
    freeDeliveryThreshold,
    openAuthModal,
    isAccountDrawerOpen,
    setIsAccountDrawerOpen,
    logoutUser,
  } = useStore();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpenMobile, setIsSearchOpenMobile] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isLogoModalOpen, setIsLogoModalOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Close search suggestions on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Quick search preview results (first 5 matches)
  const searchSuggestions = searchQuery.trim()
    ? products
        .filter(
          (p) =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.categoryName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.brand.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .slice(0, 5)
    : [];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearchFocused(false);
    setIsSearchOpenMobile(false);
    setCurrentView('shop');
  };

  const handleNavClick = (view: 'home' | 'shop', shopId?: string, isNew?: boolean, isOffers?: boolean) => {
    setIsMobileMenuOpen(false);
    if (shopId) {
      setActiveShopId(shopId);
      setCurrentView('shop');
    } else if (isNew) {
      setFilters((prev) => ({ ...prev, shopId: 'all', sortBy: 'newest' }));
      setCurrentView('shop');
    } else if (isOffers) {
      setFilters((prev) => ({ ...prev, shopId: 'all', discountMin: 40, sortBy: 'discount' }));
      setCurrentView('shop');
    } else {
      if (view === 'home') {
        setActiveShopId('all');
      }
      setCurrentView(view);
    }
  };

  return (
    <header id="site-header" className="sticky top-0 z-40 bg-[#FAF7F2] shadow-sm border-b border-[#E8DEC8]">
      {/* 1. Top Announcement Bar */}
      <div className="bg-[#2A1810] text-[#EAD8C3] text-[11px] sm:text-xs py-1.5 px-2.5 sm:px-4 overflow-hidden">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-4 truncate">
            <span className="flex items-center gap-1 font-medium text-[#DFB062] truncate">
              <Truck size={13} className="shrink-0 text-[#DFB062]" />
              <span className="truncate">Free Delivery on Orders &gt; ₹{freeDeliveryThreshold}</span>
            </span>
            <span className="hidden md:inline-flex items-center gap-1 text-[#C8B29E]">
              <ShieldCheck size={13} className="text-emerald-400 shrink-0" /> 100% Genuine Products
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 shrink-0 text-[11px]">
            <button
              onClick={() => setCurrentView('track-order')}
              className="text-[#EAD8C3] hover:text-[#DFB062] font-medium transition-colors hidden sm:inline-block cursor-pointer"
            >
              Track Order
            </button>
            <span className="hidden sm:inline text-stone-600">|</span>
            <a
              href={`https://wa.me/${siteConfig.whatsappNumber.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[#DFB062] hover:underline"
            >
              <Phone size={11} className="shrink-0" />
              <span className="hidden min-[420px]:inline">WhatsApp:</span> {siteConfig.displayWhatsApp}
            </a>
          </div>
        </div>
      </div>

      {/* 2. Main Desktop & Mobile Header */}
      <div className="max-w-7xl mx-auto px-2.5 sm:px-6 py-2 sm:py-3.5 flex items-center justify-between gap-2 sm:gap-4 md:gap-8 w-full box-border">
        {/* Left: Mobile Menu Trigger + Logo */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <button
            id="mobile-menu-btn"
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-1.5 text-[#2A1810] hover:bg-[#F0E7DA] rounded-lg cursor-pointer transition-colors"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          <div onClick={() => handleNavClick('home')} className="cursor-pointer">
            <Logo size="md" />
          </div>
        </div>

        {/* Center: Large Desktop Search Bar */}
        <div ref={searchContainerRef} className="hidden md:flex flex-1 max-w-xl lg:max-w-2xl relative">
          <form onSubmit={handleSearchSubmit} className="w-full relative">
            <input
              id="desktop-search-input"
              type="text"
              placeholder="Search products, brands, parts and categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              className="w-full pl-10 pr-24 py-2.5 text-sm bg-white border-2 border-[#D8C7B5] focus:border-[#965215] focus:ring-2 focus:ring-[#B47226]/20 rounded-full transition-all text-[#2A1810] placeholder:text-[#8C7A6B] shadow-inner"
            />
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#965215]"
            />
            <button
              id="desktop-search-submit-btn"
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-[#965215] hover:bg-[#7A3F0E] text-white px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-colors cursor-pointer shadow-sm"
            >
              SEARCH
            </button>
          </form>

          {/* Search Dropdown / Live Suggestions */}
          {isSearchFocused && searchQuery.trim().length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-2xl shadow-xl border border-[#E8DEC8] overflow-hidden z-50">
              <div className="p-2 border-b border-stone-100 bg-[#FAF7F2] flex items-center justify-between text-xs text-stone-600">
                <span>Matching Results for &ldquo;{searchQuery}&rdquo;</span>
                <span className="text-[11px] text-[#965215] font-semibold">{searchSuggestions.length} found</span>
              </div>
              {searchSuggestions.length > 0 ? (
                <div className="divide-y divide-stone-100">
                  {searchSuggestions.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        openProductDetails(item);
                        setIsSearchFocused(false);
                      }}
                      className="p-2.5 flex items-center gap-3 hover:bg-[#FBF6EE] cursor-pointer transition-colors"
                    >
                      <img
                        src={item.images[0]}
                        alt={item.name}
                        className="w-11 h-11 object-cover rounded-lg border border-stone-200 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-stone-900 truncate">{item.name}</p>
                        <p className="text-[11px] text-[#965215] font-medium">{item.categoryName}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-[#965215]">₹{item.salePrice}</p>
                        <p className="text-[10px] text-stone-400 line-through">₹{item.price}</p>
                      </div>
                    </div>
                  ))}
                  <div
                    onClick={() => {
                      setIsSearchFocused(false);
                      setCurrentView('shop');
                    }}
                    className="p-2.5 text-center text-xs font-semibold text-[#965215] hover:bg-[#FAF7F2] cursor-pointer"
                  >
                    View all matching products &rarr;
                  </div>
                </div>
              ) : (
                <div className="p-4 text-center text-xs text-stone-500">
                  No direct products found for &ldquo;{searchQuery}&rdquo;. Try another term.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Actions (Desktop full controls, Mobile strictly prioritized Cart) */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 lg:gap-3 shrink-0">
          {/* Mode Switcher (Retail vs Wholesale Sets) - Desktop & Tablet */}
          <div
            className="hidden md:flex items-center p-0.5 bg-[#EAE0D0] rounded-full border border-[#D5C2AA] shadow-inner select-none"
            title="Switch shopping mode between Retail and Wholesale Sets"
          >
            <button
              type="button"
              id="mode-switch-retail-btn"
              onClick={() => setShoppingMode('retail')}
              className={`px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs font-bold rounded-full transition-all cursor-pointer ${
                shoppingMode === 'retail'
                  ? 'bg-[#965215] text-white shadow-sm'
                  : 'text-[#64422A] hover:text-[#2A1810]'
              }`}
            >
              Retail
            </button>
            <button
              type="button"
              id="mode-switch-wholesale-btn"
              onClick={() => setShoppingMode('wholesale')}
              className={`px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs font-bold rounded-full transition-all flex items-center gap-1 cursor-pointer ${
                shoppingMode === 'wholesale'
                  ? 'bg-[#1E3A8A] text-white shadow-sm ring-2 ring-blue-300'
                  : 'text-[#64422A] hover:text-[#2A1810]'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${shoppingMode === 'wholesale' ? 'bg-amber-400 animate-pulse' : 'bg-stone-400'}`} />
              <span>Wholesale</span>
            </button>
          </div>

          {/* WhatsApp Direct Chat - Desktop (xl+) */}
          <a
            id="header-whatsapp-link"
            href={`https://wa.me/${siteConfig.whatsappNumber.replace(/[^0-9]/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            title="Chat with us on WhatsApp"
            className="hidden xl:inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#25D366]/10 text-[#128C7E] hover:bg-[#25D366]/20 border border-[#25D366]/30 rounded-full text-xs font-semibold transition-all cursor-pointer"
          >
            <MessageCircle size={15} className="text-[#25D366] fill-[#25D366]/30" />
            <span>Help</span>
          </a>

          {/* Wishlist - Desktop (md+) */}
          <button
            id="header-wishlist-btn"
            type="button"
            onClick={() => {
              setCurrentView('shop');
            }}
            title="Wishlist"
            className="hidden md:flex relative p-2 text-[#2A1810] hover:text-[#965215] hover:bg-[#F0E7DA] rounded-full transition-colors cursor-pointer"
          >
            <Heart size={21} className={wishlist.length > 0 ? 'fill-red-500 text-red-500' : ''} />
            {wishlist.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-[#B91C1C] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow">
                {wishlist.length}
              </span>
            )}
          </button>

          {/* Cart with count badge - ALWAYS VISIBLE ON ALL SCREENS (320px, 360px, 375px, etc.) */}
          <button
            id="header-cart-btn"
            type="button"
            onClick={() => setIsCartDrawerOpen(true)}
            className="relative flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 bg-[#965215] hover:bg-[#7A3F0E] text-white rounded-full text-xs font-bold shadow-sm transition-all cursor-pointer shrink-0 active:scale-95"
            aria-label="Shopping Cart"
          >
            <ShoppingCart size={17} className="shrink-0" />
            <span className="font-bold text-[11px] sm:text-xs">Cart</span>
            <span className="bg-amber-100 text-[#7A3F0E] font-black text-[10px] sm:text-[11px] px-1.5 py-0.2 rounded-full min-w-[18px] text-center leading-tight">
              {cartCount}
            </span>
          </button>

          {/* Account / Admin Buttons - Desktop (md+) */}
          {isAdminLoggedIn ? (
            <div className="hidden md:flex items-center gap-2">
              <button
                id="header-admin-btn"
                type="button"
                onClick={() => setCurrentView('admin')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#2A1810] text-[#DFB062] border border-[#DFB062]/40 hover:bg-black transition-all text-xs font-bold shadow-xs cursor-pointer"
                title="Admin Control Room (Store Owner)"
              >
                <ShieldCheck size={14} className="text-[#DFB062]" />
                <span className="hidden sm:inline">Admin Portal</span>
              </button>

              <button
                type="button"
                onClick={() => setIsLogoModalOpen(true)}
                className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 text-[#965215] border border-amber-300 hover:bg-amber-100 transition-colors text-xs font-bold cursor-pointer"
                title="Change Store Logo"
              >
                <Camera size={14} />
                <span>Change Logo</span>
              </button>
            </div>
          ) : currentUser ? (
            <button
              id="header-account-btn"
              type="button"
              onClick={() => setIsAccountDrawerOpen(true)}
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-white border border-[#E8DEC8] hover:border-[#965215] text-stone-800 shadow-2xs transition-all cursor-pointer"
              title={`Logged in as ${currentUser.fullName || currentUser.email}`}
            >
              <div className="w-6 h-6 rounded-full bg-[#965215] text-white flex items-center justify-center text-[10px] font-bold">
                {currentUser.fullName ? currentUser.fullName.charAt(0).toUpperCase() : 'U'}
              </div>
              <span className="hidden lg:inline text-xs font-bold text-stone-700 truncate max-w-[90px]">
                {currentUser.fullName ? currentUser.fullName.split(' ')[0] : 'Account'}
              </span>
            </button>
          ) : (
            <button
              id="header-account-btn"
              type="button"
              onClick={() => openAuthModal()}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-stone-700 hover:bg-[#F0E7DA] transition-colors cursor-pointer border border-stone-300 hover:border-stone-400"
              title="Sign In or Register"
            >
              <User size={16} />
              <span className="hidden lg:inline">Sign In</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Search Bar (Collapsible) */}
      {isSearchOpenMobile && (
        <div className="md:hidden px-4 pb-3 pt-1 border-t border-[#E8DEC8] bg-[#FAF7F2]">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              placeholder="Search products, brands, categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-20 py-2 text-xs bg-white border border-[#D8C7B5] rounded-full focus:border-[#965215]"
              autoFocus
            />
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#965215]" />
            <button
              type="submit"
              className="absolute right-1 top-1/2 -translate-y-1/2 bg-[#965215] text-white px-3 py-1 rounded-full text-[10px] font-bold"
            >
              SEARCH
            </button>
          </form>
        </div>
      )}

      {/* 2.5 Wholesale Active Alert Bar */}
      {shoppingMode === 'wholesale' && (
        <div className="bg-gradient-to-r from-[#172554] via-[#1E3A8A] to-[#172554] text-white px-3 py-1.5 border-y border-blue-600/40 shadow-xs">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-amber-400 text-blue-950 font-black text-[10px] uppercase px-2 py-0.5 rounded tracking-wider shadow-2xs">
                WHOLESALE MODE
              </span>
              <span className="text-blue-100 font-medium text-[11px] sm:text-xs">
                All prices shown are <strong>Wholesale per Set</strong>. Minimum purchase: <strong>1 Complete Set</strong>.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShoppingMode('retail')}
              className="text-[11px] text-amber-300 hover:text-white font-semibold underline shrink-0 cursor-pointer"
            >
              Switch to Retail Mode
            </button>
          </div>
        </div>
      )}

      {/* 3. Category Navigation Bar (Desktop) */}
      <nav id="category-navigation-bar" className="hidden lg:block bg-white border-t border-[#E8DEC8]">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center space-x-1 py-1">
            {/* HOME */}
            <button
              id="nav-home"
              onClick={() => handleNavClick('home')}
              className={`px-3 py-2 text-xs font-bold tracking-wider uppercase transition-colors cursor-pointer rounded-md ${
                currentView === 'home'
                  ? 'text-[#965215] bg-[#FAF7F2]'
                  : 'text-stone-700 hover:text-[#965215] hover:bg-[#FAF7F2]'
              }`}
            >
              Home
            </button>

            {/* SHOP */}
            <button
              id="nav-shop"
              onClick={() => handleNavClick('shop')}
              className={`px-3 py-2 text-xs font-bold tracking-wider uppercase transition-colors cursor-pointer rounded-md ${
                currentView === 'shop' && filters.shopId === 'all'
                  ? 'text-[#965215] bg-[#FAF7F2]'
                  : 'text-stone-700 hover:text-[#965215] hover:bg-[#FAF7F2]'
              }`}
            >
              All Products
            </button>

            {/* FASHION (Vinayak Collection) */}
            <button
              id="nav-fashion"
              onClick={() => handleNavClick('shop', 'vinayak-collection')}
              className={`px-3 py-2 text-xs font-bold tracking-wider uppercase transition-colors cursor-pointer rounded-md flex items-center gap-1.5 ${
                filters.shopId === 'vinayak-collection'
                  ? 'text-[#965215] bg-amber-50 font-extrabold border-b-2 border-[#965215]'
                  : 'text-stone-700 hover:text-[#965215] hover:bg-[#FAF7F2]'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
              Fashion (Vinayak)
            </button>

            {/* BIKE ACCESSORIES (Kinshuk Spare Parts) */}
            <button
              id="nav-bike-parts"
              onClick={() => handleNavClick('shop', 'kinshuk-spare-parts')}
              className={`px-3 py-2 text-xs font-bold tracking-wider uppercase transition-colors cursor-pointer rounded-md flex items-center gap-1.5 ${
                filters.shopId === 'kinshuk-spare-parts'
                  ? 'text-slate-900 bg-slate-100 font-extrabold border-b-2 border-slate-900'
                  : 'text-stone-700 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
              Bike Spares (Kinshuk)
            </button>

            {/* MOBILE & ACCESSORIES (Khushi Communication) */}
            <button
              id="nav-mobile"
              onClick={() => handleNavClick('shop', 'khushi-communication')}
              className={`px-3 py-2 text-xs font-bold tracking-wider uppercase transition-colors cursor-pointer rounded-md flex items-center gap-1.5 ${
                filters.shopId === 'khushi-communication'
                  ? 'text-sky-900 bg-sky-50 font-extrabold border-b-2 border-sky-600'
                  : 'text-stone-700 hover:text-sky-700 hover:bg-sky-50'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-sky-600" />
              Mobiles (Khushi)
            </button>

            {/* NEW ARRIVALS */}
            <button
              id="nav-new-arrivals"
              onClick={() => handleNavClick('shop', undefined, true, false)}
              className="px-3 py-2 text-xs font-bold tracking-wider uppercase text-emerald-800 hover:text-emerald-950 transition-colors cursor-pointer rounded-md flex items-center gap-1"
            >
              <Sparkles size={13} className="text-emerald-600" />
              New Arrivals
            </button>

            {/* OFFERS */}
            <button
              id="nav-offers"
              onClick={() => handleNavClick('shop', undefined, false, true)}
              className="px-3 py-2 text-xs font-bold tracking-wider uppercase text-red-700 hover:text-red-900 transition-colors cursor-pointer rounded-md bg-red-50/60"
            >
              Deals & Offers
            </button>
          </div>

          <div className="flex items-center gap-3 text-xs text-stone-600">
            <button
              onClick={() => setCurrentView('track-order')}
              className="hover:text-[#965215] font-medium cursor-pointer"
            >
              Track Order
            </button>
            <span>&bull;</span>
            <span className="text-[#965215] font-semibold">3 Shops &bull; 1 Platform</span>
          </div>
        </div>
      </nav>

      {/* 4. Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex">
          <div className="w-4/5 max-w-sm bg-white h-full overflow-y-auto flex flex-col shadow-2xl animate-in slide-in-from-left">
            <div className="p-4 bg-[#2A1810] text-white flex items-center justify-between">
              <Logo size="sm" theme="dark" />
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 text-stone-300 hover:text-white rounded-lg cursor-pointer"
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>

            {/* Mobile Search inside Drawer */}
            <div className="p-3 bg-[#FAF7F2] border-b border-[#E8DEC8]">
              <form onSubmit={handleSearchSubmit} className="relative">
                <input
                  type="text"
                  placeholder="Search products, brands, parts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-16 py-2 text-xs bg-white border border-[#D8C7B5] rounded-full focus:border-[#965215] text-[#2A1810] placeholder:text-stone-400"
                />
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#965215]" />
                <button
                  type="submit"
                  className="absolute right-1 top-1/2 -translate-y-1/2 bg-[#965215] hover:bg-[#7A3F0E] text-white px-2.5 py-1 rounded-full text-[10px] font-bold"
                >
                  SEARCH
                </button>
              </form>
            </div>

            <div className="p-4 flex-1 divide-y divide-stone-100 overflow-y-auto">
              {/* Shopping Mode Selector (Retail / Wholesale) */}
              <div className="pb-3">
                <p className="text-[10px] uppercase font-bold tracking-widest text-stone-400 mb-2">
                  Shopping Mode
                </p>
                <div className="grid grid-cols-2 gap-2 p-1 bg-[#FAF7F2] border border-[#E8DEC8] rounded-xl">
                  <button
                    type="button"
                    onClick={() => {
                      setShoppingMode('retail');
                    }}
                    className={`py-2 px-3 text-xs font-bold rounded-lg text-center transition-all cursor-pointer ${
                      shoppingMode === 'retail'
                        ? 'bg-[#965215] text-white shadow-xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    🛍️ Retail Mode
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShoppingMode('wholesale');
                    }}
                    className={`py-2 px-3 text-xs font-bold rounded-lg text-center transition-all cursor-pointer ${
                      shoppingMode === 'wholesale'
                        ? 'bg-[#1E3A8A] text-white shadow-xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    📦 Wholesale (Sets)
                  </button>
                </div>
              </div>

              {/* Primary Navigation & Direct Cart/Wishlist access */}
              <div className="py-2 space-y-1">
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsCartDrawerOpen(true);
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-bold text-[#7A3F0E] flex items-center justify-between rounded-lg bg-amber-50/80 border border-amber-200"
                >
                  <span className="flex items-center gap-2">
                    <ShoppingCart size={15} /> View Cart
                  </span>
                  <span className="bg-[#965215] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {cartCount} {cartCount === 1 ? 'item' : 'items'}
                  </span>
                </button>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setFilters((prev) => ({ ...prev, shopId: 'all' }));
                    setCurrentView('shop');
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-stone-700 flex items-center justify-between rounded-lg hover:bg-[#FAF7F2]"
                >
                  <span className="flex items-center gap-2">
                    <Heart size={15} className={wishlist.length > 0 ? 'fill-red-500 text-red-500' : 'text-stone-500'} /> My Wishlist
                  </span>
                  {wishlist.length > 0 && (
                    <span className="bg-[#B91C1C] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {wishlist.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => handleNavClick('home')}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm font-bold text-stone-800 hover:bg-[#FAF7F2]"
                >
                  Home
                </button>
                <button
                  onClick={() => handleNavClick('shop')}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm font-bold text-stone-800 hover:bg-[#FAF7F2]"
                >
                  All Products
                </button>
              </div>

              {/* Three Shops Direct Access */}
              <div className="py-3">
                <p className="px-3 text-[10px] uppercase font-bold tracking-widest text-stone-400 mb-2">
                  Our 3 Flagship Shops
                </p>
                <button
                  onClick={() => handleNavClick('shop', 'vinayak-collection')}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-amber-50/70 border border-amber-200/60 mb-2 cursor-pointer"
                >
                  <div>
                    <span className="text-xs font-bold text-amber-900 block">Vinayak Collection</span>
                    <span className="text-[10px] text-amber-700">Clothing & Fashion</span>
                  </div>
                  <ArrowRight size={14} className="text-amber-800" />
                </button>

                <button
                  onClick={() => handleNavClick('shop', 'kinshuk-spare-parts')}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 mb-2 cursor-pointer"
                >
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Kinshuk Spare Parts</span>
                    <span className="text-[10px] text-slate-600">Bike Spares & Accessories</span>
                  </div>
                  <ArrowRight size={14} className="text-slate-800" />
                </button>

                <button
                  onClick={() => handleNavClick('shop', 'khushi-communication')}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-sky-50 border border-sky-200 cursor-pointer"
                >
                  <div>
                    <span className="text-xs font-bold text-sky-900 block">Khushi Communication</span>
                    <span className="text-[10px] text-sky-600">Mobiles & Accessories</span>
                  </div>
                  <ArrowRight size={14} className="text-sky-800" />
                </button>
              </div>

              {/* Special Sections */}
              <div className="py-2 space-y-1">
                <button
                  onClick={() => handleNavClick('shop', undefined, true, false)}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-emerald-800 flex items-center gap-2"
                >
                  <Sparkles size={14} /> New Arrivals
                </button>
                <button
                  onClick={() => handleNavClick('shop', undefined, false, true)}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-red-700 flex items-center gap-2"
                >
                  <span className="w-2 h-2 rounded-full bg-red-600" /> Today&apos;s Best Deals & Offers
                </button>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setCurrentView('track-order');
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-stone-700 flex items-center gap-2"
                >
                  <Truck size={14} /> Track Order
                </button>
              </div>

              {/* Account Section in Mobile Menu */}
              <div className="pt-3 space-y-2">
                {isAdminLoggedIn ? (
                  <>
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        setCurrentView('admin');
                      }}
                      className="w-full py-2.5 px-3 rounded-lg bg-[#2A1810] text-[#DFB062] text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <ShieldCheck size={15} /> Open Admin Portal
                    </button>
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        setIsLogoModalOpen(true);
                      }}
                      className="w-full py-2.5 px-3 rounded-lg bg-amber-100 text-[#965215] border border-[#965215]/30 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Camera size={15} /> Change Store Logo
                    </button>
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        logoutUser();
                      }}
                      className="w-full py-2 px-3 rounded-lg bg-stone-200 text-stone-700 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
                    >
                      Sign Out Admin
                    </button>
                  </>
                ) : currentUser ? (
                  <>
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        setIsAccountDrawerOpen(true);
                      }}
                      className="w-full py-2.5 px-3 rounded-lg bg-[#965215] text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <User size={15} /> My Account & Orders
                    </button>
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        logoutUser();
                      }}
                      className="w-full py-2 px-3 rounded-lg bg-stone-200 text-stone-700 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      openAuthModal();
                    }}
                    className="w-full py-2.5 px-3 rounded-lg bg-[#965215] text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                  >
                    <User size={15} /> Customer Sign In / Register
                  </button>
                )}
              </div>
            </div>

            {/* Mobile Footer Contact */}
            <div className="p-4 bg-[#FAF7F2] border-t border-stone-200 space-y-2">
              <a
                href={`https://wa.me/${siteConfig.whatsappNumber.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 bg-[#25D366] hover:bg-[#1EBE5D] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm"
              >
                <MessageCircle size={16} /> WhatsApp ({siteConfig.displayWhatsApp})
              </a>
              <a
                href={`mailto:${siteConfig.email}`}
                className="w-full py-2 text-stone-600 hover:text-stone-900 text-[11px] font-medium flex items-center justify-center gap-1.5"
              >
                <Mail size={12} /> {siteConfig.email}
              </a>
            </div>
          </div>
          <div className="flex-1" onClick={() => setIsMobileMenuOpen(false)} />
        </div>
      )}

      {/* Logo Manager Modal */}
      {isLogoModalOpen && (
        <LogoManager isModal onClose={() => setIsLogoModalOpen(false)} />
      )}
    </header>
  );
};
