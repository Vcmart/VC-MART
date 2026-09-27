import React from 'react';
import {
  Phone,
  Mail,
  MapPin,
  MessageCircle,
  Instagram,
  ShieldCheck,
  CreditCard,
  Truck,
  ArrowUp,
} from 'lucide-react';
import { Logo } from './Logo';
import { siteConfig } from '../config/siteConfig';
import { useStore } from '../context/StoreContext';

export const Footer: React.FC = () => {
  const { setCurrentView, setActiveShopId, setFilters } = useStore();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNav = (shopId?: string, isNew?: boolean, isOffers?: boolean) => {
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
      setCurrentView('shop');
    }
    scrollToTop();
  };

  return (
    <footer id="site-footer" className="bg-[#1F140E] text-[#E8DEC8] border-t-4 border-[#965215]">
      {/* 1. Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-10">
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <Logo size="lg" theme="dark" />
            <p className="text-xs text-[#C8B29E] leading-relaxed max-w-sm">
              VC MART is India&apos;s trusted unified online shopping destination with the motto &quot;Your Trust. Our Quality&quot; — offering premium fashion from Vinayak Collection, high-performance motorcycle spares from Kinshuk Spare Parts, and certified tech accessories from Khushi Communication.
            </p>
            <div className="pt-2">
              <p className="text-xs font-semibold text-[#DFB062] mb-2 uppercase tracking-wider">Follow Us</p>
              <div className="flex items-center gap-3">
                <a
                  href={siteConfig.socialLinks.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-[#3E2519] hover:bg-[#B47226] text-white flex items-center justify-center transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram size={16} />
                </a>
                <a
                  href={`https://wa.me/${siteConfig.whatsappNumber.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-[#25D366] text-white flex items-center justify-center transition-colors"
                  aria-label="WhatsApp"
                >
                  <MessageCircle size={16} />
                </a>
              </div>
            </div>
          </div>

          {/* SHOP */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-[#DFB062] mb-4">
              Shop Categories
            </h4>
            <ul className="space-y-2 text-xs text-[#C8B29E]">
              <li>
                <button
                  type="button"
                  onClick={() => handleNav('vinayak-collection')}
                  className="hover:text-[#DFB062] transition-colors cursor-pointer"
                >
                  Fashion & Ethnic Wear
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleNav('kinshuk-spare-parts')}
                  className="hover:text-[#DFB062] transition-colors cursor-pointer"
                >
                  Bike Accessories & Spares
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleNav('khushi-communication')}
                  className="hover:text-[#DFB062] transition-colors cursor-pointer"
                >
                  Mobile & Tech Accessories
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleNav(undefined, true, false)}
                  className="hover:text-[#DFB062] transition-colors cursor-pointer"
                >
                  New Arrivals
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleNav(undefined, false, true)}
                  className="hover:text-[#DFB062] transition-colors cursor-pointer text-red-300 font-semibold"
                >
                  Offers & Hot Deals
                </button>
              </li>
            </ul>
          </div>

          {/* OUR SHOPS & DIRECT CONTACTS */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-[#DFB062] mb-4">
              Our 3 Shops
            </h4>
            <ul className="space-y-2 text-xs text-[#C8B29E]">
              <li className="p-2 rounded-lg bg-[#2A1810]/60 border border-[#3E2519]">
                <button
                  type="button"
                  onClick={() => handleNav('vinayak-collection')}
                  className="hover:text-[#DFB062] text-left cursor-pointer w-full block"
                >
                  <span className="font-semibold text-white block">Vinayak Collection</span>
                  <span className="text-[10px] text-[#A68F7B] block">Clothes & Fashion</span>
                </button>
                <div className="mt-1 flex items-center gap-2 text-[11px] text-[#DFB062]">
                  <Phone size={11} className="shrink-0" />
                  <a href="tel:+918684933759" className="hover:underline font-mono">8684933759</a>
                </div>
              </li>
              <li className="p-2 rounded-lg bg-[#2A1810]/60 border border-[#3E2519]">
                <button
                  type="button"
                  onClick={() => handleNav('kinshuk-spare-parts')}
                  className="hover:text-[#DFB062] text-left cursor-pointer w-full block"
                >
                  <span className="font-semibold text-white block">Kinshuk Spare Parts</span>
                  <span className="text-[10px] text-[#A68F7B] block">Bike Parts & Accessories</span>
                </button>
                <div className="mt-1 flex items-center gap-2 text-[11px] text-[#DFB062]">
                  <Phone size={11} className="shrink-0" />
                  <a href="tel:+918295403529" className="hover:underline font-mono">8295403529</a>
                </div>
              </li>
              <li className="p-2 rounded-lg bg-[#2A1810]/60 border border-[#3E2519]">
                <button
                  type="button"
                  onClick={() => handleNav('khushi-communication')}
                  className="hover:text-[#DFB062] text-left cursor-pointer w-full block"
                >
                  <span className="font-semibold text-white block">Khushi Communication</span>
                  <span className="text-[10px] text-[#A68F7B] block">Mobiles & Accessories</span>
                </button>
                <div className="mt-1 flex items-center gap-2 text-[11px] text-[#DFB062]">
                  <Phone size={11} className="shrink-0" />
                  <a href="tel:+918396831521" className="hover:underline font-mono">8396831521</a>
                </div>
              </li>
              <li className="pt-2 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentView('track-order');
                    scrollToTop();
                  }}
                  className="hover:text-[#DFB062] font-semibold text-white cursor-pointer"
                >
                  Track Order & Shipment
                </button>
              </li>
            </ul>
          </div>

          {/* CONTACT */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-[#DFB062] mb-4">
              Get in Touch
            </h4>
            <ul className="space-y-3 text-xs text-[#C8B29E]">
              <li className="flex items-start gap-2.5">
                <Phone size={14} className="text-[#DFB062] shrink-0 mt-0.5" />
                <div>
                  <span className="block text-[10px] uppercase text-[#A68F7B] font-semibold">General Enquiry & Orders</span>
                  <a href="tel:+918684933759" className="font-medium hover:text-white transition-colors">{siteConfig.contactPhone}</a>
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <MessageCircle size={14} className="text-[#25D366] shrink-0 mt-0.5" />
                <div>
                  <span className="block text-[10px] uppercase text-[#A68F7B] font-semibold">Instant WhatsApp Chat</span>
                  <a
                    href={`https://wa.me/${siteConfig.whatsappNumber.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline text-emerald-400 font-medium"
                  >
                    {siteConfig.displayWhatsApp}
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <Mail size={14} className="text-[#DFB062] shrink-0 mt-0.5" />
                <div>
                  <span className="block text-[10px] uppercase text-[#A68F7B] font-semibold">Email Requirements</span>
                  <a href={`mailto:${siteConfig.email}`} className="break-all hover:text-white underline text-amber-200">
                    {siteConfig.email}
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin size={14} className="text-[#DFB062] shrink-0 mt-0.5" />
                <span className="leading-snug">{siteConfig.address}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Policies row */}
        <div className="mt-12 pt-6 border-t border-[#3E2519] flex flex-wrap items-center justify-between gap-4 text-[11px] text-[#A68F7B]">
          <div className="flex flex-wrap gap-4 sm:gap-6">
            <span>Shipping Policy</span>
            <span>&bull;</span>
            <span>7-Day Return Policy</span>
            <span>&bull;</span>
            <span>Refund Policy</span>
            <span>&bull;</span>
            <span>Privacy Policy</span>
            <span>&bull;</span>
            <span>Terms & Conditions</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[#DFB062]">Payments Accepted:</span>
            <span className="px-2 py-0.5 rounded bg-[#3E2519] text-[10px] font-bold text-white">COD</span>
            <span className="px-2 py-0.5 rounded bg-[#3E2519] text-[10px] font-bold text-white">UPI</span>
            <span className="px-2 py-0.5 rounded bg-[#3E2519] text-[10px] font-bold text-white">Cards / NetBanking</span>
          </div>
        </div>
      </div>

      {/* Bottom Copyright & Back to Top */}
      <div className="bg-[#140C08] py-4 px-4 border-t border-stone-900 text-center text-xs text-[#8C7563]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>
            &copy; {new Date().getFullYear()} {siteConfig.websiteName}. All Rights Reserved. Built with pride for Indian Retail.
          </p>
          <button
            type="button"
            onClick={scrollToTop}
            className="text-xs text-[#DFB062] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Back to top</span>
            <ArrowUp size={13} />
          </button>
        </div>
      </div>
    </footer>
  );
};
