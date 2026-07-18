'use client';

import React from 'react';
import Exchange from '@/components/features/commodities/ExchangeLazy';
import AssetPageHeader from '@/components/shared/AssetPageHeader';
import TSP500Infos from '@/components/features/tsp500/TSP500Infos';
import { BASE_CONTRACTS } from '@/contracts/contracts';

const TSP500Page = () => {
  return (
    <div className="max-w-6xl mx-auto py-6 sm:py-8 px-4 sm:px-6">
      <div className="space-y-6">
        <AssetPageHeader
          symbol="TSP500"
          title="Tokeshare S&P500 (TSP500)"
          logoSrc="/images/image_TSP500.png"
          image="/images/image_TSP500.webp"
          imageAlt="Tokeshare S&P500"
          baseContract={BASE_CONTRACTS.TSP500}
        />

        {/* Swap */}
        <div className="[&>*]:!my-0">
          <Exchange tokenSymbol="TSP500" />
        </div>
      </div>

      {/* Info Section */}
      <div className="pt-6 sm:pt-8">
        <TSP500Infos />
      </div>
    </div>
  );
};

export default TSP500Page;
