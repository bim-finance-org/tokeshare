import React from 'react';
import CommoditiesCard from '@/components/features/commodities/CommoditiesCard';
import MarketplaceHero from '@/components/shared/MarketplaceHero';
import commoditiesData from '@/data/commoditiesData.json';

const Page = () => {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
      <MarketplaceHero eyebrow="Commodities" title="Invest in Commodities">
        <p>
          With Tokeshare, discover a new way to access the commodities market. Through tokenization, we offer you the
          opportunity to invest in assets like gold, silver, cocoa, or sugarcane in a simple, secure, and management
          fee-free way.
        </p>
      </MarketplaceHero>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
        {commoditiesData.map((commodity, index) => (
          <CommoditiesCard key={index} commodity={commodity} />
        ))}
      </div>
    </div>
  );
};

export default Page;
