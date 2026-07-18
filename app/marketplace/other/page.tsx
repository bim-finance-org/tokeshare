import React from 'react';
import TacosCard from '@/components/features/french-tacos/TacosCard';
import MarketplaceHero from '@/components/shared/MarketplaceHero';

const page = () => {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
      <MarketplaceHero eyebrow="Other" title="Invest in other assets">
        <p>With Tokeshare, discover a new way to access unique investment opportunities in Latin America.</p>
        <p>Thanks to tokenization, we offer you the opportunity to become a co-owner of a diverse range of assets.</p>
      </MarketplaceHero>

      <div className="mt-8 flex justify-center">
        <TacosCard />
      </div>
    </div>
  );
};

export default page;
