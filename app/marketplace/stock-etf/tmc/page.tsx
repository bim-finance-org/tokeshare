'use client';

import React from 'react';
import Exchange from '@/components/features/commodities/ExchangeLazy';
import AssetPageHeader from '@/components/shared/AssetPageHeader';
import TMCInfos from '@/components/features/tmc/TMCInfos';
import { BASE_CONTRACTS } from '@/contracts/contracts';

const TMCPage = () => {
  return (
    <div className="max-w-6xl mx-auto py-6 sm:py-8 px-4 sm:px-6">
      <div className="space-y-6">
        <AssetPageHeader
          symbol="TMC"
          title="Tokeshare MarketCap 20 Index (TMC)"
          logoSrc="/images/currencies/tmc.png"
          image="/images/tmc/tmc.webp"
          imageAlt="Tokeshare MarketCap 20"
          imagePriority
          baseContract={BASE_CONTRACTS.TMC}
        />

        {/* Swap */}
        <div className="[&>*]:!my-0">
          <Exchange tokenSymbol="TMC" />
        </div>
      </div>

      {/* Info Section */}
      <div className="pt-6 sm:pt-8">
        <TMCInfos />
      </div>
    </div>
  );
};

export default TMCPage;
