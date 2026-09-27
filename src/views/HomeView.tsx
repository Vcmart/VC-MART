import React from 'react';
import { HeroBanner } from '../components/HeroBanner';
import { ShopCategoryCards } from '../components/ShopCategoryCards';
import { TrendingProducts } from '../components/TrendingProducts';
import { SpecialOffers } from '../components/SpecialOffers';
import { NewArrivals } from '../components/NewArrivals';
import { ShopSpecificSections } from '../components/ShopSpecificSections';
import { TrustSection } from '../components/TrustSection';

export const HomeView: React.FC = () => {
  return (
    <div id="home-view" className="flex flex-col">
      {/* 1. Hero Banner */}
      <HeroBanner />

      {/* 2. Shop By Category (3 flagship cards) */}
      <ShopCategoryCards />

      {/* 3. Trending Products */}
      <TrendingProducts />

      {/* 4. Special Offers & Deals with Countdown Timer */}
      <SpecialOffers />

      {/* 5. New Arrivals */}
      <NewArrivals />

      {/* 6. Shop-Specific Promotional Sections */}
      <ShopSpecificSections />

      {/* 7. Why Shop With Us Trust Section */}
      <TrustSection />
    </div>
  );
};
