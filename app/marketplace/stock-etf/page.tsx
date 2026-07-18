import React from 'react';
import TMCCard from '@/components/features/tmc/TMCCard';
import TSP500Card from '@/components/features/tsp500/TSP500Card';
import MarketplaceHero from '@/components/shared/MarketplaceHero';

const page = () => {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
      <MarketplaceHero eyebrow="Stock & ETF" title="Invest in ETF">
        <p>Gain diversified exposure to the cryptocurrency market through tokenized index funds on Tokeshare.</p>
        <p>
          Our ETF tokens allow you to track the performance of multiple top cryptocurrencies with a single investment,
          simplifying your portfolio management.
        </p>
      </MarketplaceHero>

      <div className="mx-auto mt-8 grid max-w-4xl gap-6 sm:grid-cols-2 lg:gap-8">
        <TMCCard />
        <TSP500Card />
      </div>
    </div>
  );
};

export default page;
