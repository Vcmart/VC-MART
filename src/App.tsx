import React, { lazy, Suspense } from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { AuthModal } from './components/AuthModal';
import { MobileBottomNav } from './components/MobileBottomNav';
import { ErrorBoundary } from './components/ErrorBoundary';
import { MessageCircle } from 'lucide-react';
import { siteConfig } from './config/siteConfig';

const HomeView = lazy(() => import('./views/HomeView').then((module) => ({ default: module.HomeView })));
const ShopView = lazy(() => import('./views/ShopView').then((module) => ({ default: module.ShopView })));
const CheckoutView = lazy(() => import('./views/CheckoutView').then((module) => ({ default: module.CheckoutView })));
const TrackOrderView = lazy(() => import('./views/TrackOrderView').then((module) => ({ default: module.TrackOrderView })));
const AdminView = lazy(() => import('./views/AdminView').then((module) => ({ default: module.AdminView })));
const CartDrawer = lazy(() => import('./components/CartDrawer').then((module) => ({ default: module.CartDrawer })));
const ProductDetailsModal = lazy(() => import('./components/ProductDetailsModal').then((module) => ({ default: module.ProductDetailsModal })));
const CustomerAccountDrawer = lazy(() => import('./components/CustomerAccountDrawer').then((module) => ({ default: module.CustomerAccountDrawer })));

const MainContent: React.FC = () => {
  const { currentView, firebaseStatus } = useStore();

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2] text-[#2A1810] selection:bg-[#B47226]/30 selection:text-[#2A1810] w-full max-w-full overflow-x-hidden">
      {/* Sticky Header */}
      <Header />

      {/* Main Dynamic View */}
      <main className="flex-1 pb-16 md:pb-0 w-full max-w-full">
        {firebaseStatus.connected === false && (
          <div role="alert" className="mx-auto mt-4 max-w-7xl px-4">
            <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
              <strong>Store data is temporarily unavailable.</strong> {firebaseStatus.message || 'Check your connection and Firebase configuration.'}
            </div>
          </div>
        )}
        <ErrorBoundary fallbackTitle="View Error">
          <Suspense fallback={<div className="mx-auto max-w-7xl px-4 py-16 text-center text-sm text-stone-600">Loading VC MART…</div>}>
          {currentView === 'home' && <HomeView />}
          {currentView === 'shop' && <ShopView />}
          {currentView === 'checkout' && <CheckoutView />}
          {currentView === 'track-order' && <TrackOrderView />}
          {currentView === 'admin' && <AdminView />}
          </Suspense>
        </ErrorBoundary>
      </main>

      {/* Persistent Footer */}
      <Footer />

      {/* Persistent Compact Mobile Bottom Navigation */}
      <MobileBottomNav />

      {/* Overlays & Drawers */}
      <Suspense fallback={null}>
        <ErrorBoundary fallbackTitle="Cart Drawer Issue"><CartDrawer /></ErrorBoundary>
        <ErrorBoundary fallbackTitle="Product Details Issue"><ProductDetailsModal /></ErrorBoundary>
        <CustomerAccountDrawer />
      </Suspense>
      <AuthModal />

      {/* Floating WhatsApp Helpline Button (positioned above bottom nav on mobile to prevent overlap) */}
      <aside aria-label="WhatsApp Support">
        <a
          id="floating-whatsapp-btn"
          href={`https://wa.me/${siteConfig.whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
            'Namaste VC MART, I would like to inquire about products and orders.'
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-20 right-3.5 sm:bottom-6 sm:right-6 z-30 bg-[#25D366] hover:bg-[#1EBE5D] text-white p-2.5 sm:px-4 sm:py-3 rounded-full shadow-2xl flex items-center gap-2 transition-all transform hover:scale-105 active:scale-95 group cursor-pointer"
          title="Chat with us on WhatsApp"
        >
          <MessageCircle size={20} className="fill-white shrink-0 sm:w-[22px] sm:h-[22px]" />
          <span className="hidden sm:inline text-xs font-bold tracking-wide">
            WhatsApp Support
          </span>
        </a>
      </aside>
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary fallbackTitle="VC Mart Store Error">
      <StoreProvider>
        <MainContent />
      </StoreProvider>
    </ErrorBoundary>
  );
}
