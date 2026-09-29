import React from 'react';
import {
  ShieldCheck,
  BadgeIndianRupee,
  Layers,
  Lock,
  Truck,
  Headphones,
  SearchCheck,
  CheckCircle2,
} from 'lucide-react';
import { Logo } from './Logo';

export const TrustSection: React.FC = () => {
  const trustPoints = [
    {
      icon: ShieldCheck,
      title: 'Quality Products',
      desc: '100% genuine guaranteed textiles, bike parts & certified tech.',
    },
    {
      icon: BadgeIndianRupee,
      title: 'Competitive Prices',
      desc: 'Direct wholesale value prices without middleman markups.',
    },
    {
      icon: Layers,
      title: 'Multiple Categories',
      desc: 'Fashion, motorcycle parts & smart electronics in one cart.',
    },
    {
      icon: Lock,
      title: 'Secure Payments',
      desc: 'Pay online through Razorpay or choose Cash on Delivery for eligible orders.',
    },
    {
      icon: Truck,
      title: 'Fast Delivery',
      desc: 'Dispatched in 24-48 hours across every corner of India.',
    },
    {
      icon: Headphones,
      title: 'Customer Support',
      desc: 'Friendly WhatsApp & phone support 7 days a week.',
    },
    {
      icon: SearchCheck,
      title: 'Easy Order Tracking',
      desc: 'Real-time order status updates via SMS, email & portal.',
    },
  ];

  return (
    <section id="trust-section" className="py-12 sm:py-16 bg-white border-b border-[#E8DEC8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10 flex flex-col items-center">
          <div className="mb-3">
            <Logo size="sm" variant="emblem" />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#965215] bg-[#FAF7F2] border border-[#E8DEC8] px-3 py-1 rounded-full">
            The VC MART Advantage
          </span>
          <h2 className="text-2xl sm:text-3xl font-['Marcellus'] font-bold text-[#2A1810] mt-2">
            Why Shop With Us?
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Built on a decade of retail trust, reliable inventory, and customer delight across India.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 sm:gap-6">
          {trustPoints.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="bg-[#FAF7F2] p-4 rounded-2xl border border-[#E8DEC8]/80 text-center flex flex-col items-center justify-start hover:shadow-md transition-shadow group"
              >
                <div className="w-10 h-10 rounded-full bg-white shadow-2xs text-[#965215] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Icon size={20} />
                </div>
                <div className="flex items-center gap-1 text-emerald-700 mb-1">
                  <CheckCircle2 size={12} className="fill-emerald-100" />
                  <h4 className="text-xs font-bold text-[#2A1810]">{item.title}</h4>
                </div>
                <p className="text-[11px] text-stone-500 leading-tight mt-1">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
