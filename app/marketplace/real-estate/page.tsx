import React from 'react';
import HouseCard from '@/components/features/real-estate/HouseCard';
import MarketplaceHero from '@/components/shared/MarketplaceHero';
import housesData from '@/data/housesData.json';

const page = () => {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
      <MarketplaceHero
        eyebrow="Real Estate"
        title="Invest in real estate"
        action={
          <a
            href="#properties"
            className="inline-flex items-center rounded-xl bg-white px-5 py-2.5 text-sm font-titleSemibold text-color4 transition-colors hover:bg-color2 hover:text-white"
          >
            View properties
          </a>
        }
      >
        <p>With Tokeshare, discover a new way to access the real estate market in Latin America.</p>
        <p>
          Thanks to tokenization, we offer you the opportunity to become a co-owner of real estate, in a simple, secure
          and compliant way.
        </p>
      </MarketplaceHero>

      {/* Responsive grid */}
      <div id="properties" className="mt-8 grid gap-6 scroll-mt-24 sm:grid-cols-2 lg:gap-8">
        {housesData.map((house, index) => (
          <HouseCard key={index} house={house} />
        ))}
      </div>
    </div>
  );
};

export default page;
