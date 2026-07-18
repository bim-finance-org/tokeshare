'use client';

import React from 'react';
import Exchange from '@/components/features/commodities/ExchangeLazy';
import Contracts from '@/components/shared/Contracts';
import TSP500Infos from '@/components/features/tsp500/TSP500Infos';
import { BASE_CONTRACTS } from '@/contracts/contracts';

const TSP500Page = () => {
  return (
    <div className="max-w-6xl mx-auto py-6 sm:py-8 md:py-12 px-4 sm:px-6">
      <div className="space-y-6 sm:space-y-8">
        {/* Header Section */}
        <div className="bg-white/5 rounded-2xl p-4 sm:p-6 backdrop-blur-sm">
          <div className="flex flex-col items-center justify-between md:flex-row gap-4">
            <h1 className="text-2xl sm:text-3xl text-color4 font-semibold text-center md:text-left">
              Tokeshare S&amp;P500 (TSP500)
            </h1>
            <Contracts baseContract={BASE_CONTRACTS.TSP500} />
          </div>
        </div>

        {/* Trading Section */}
        <div className="bg-white/5 rounded-2xl backdrop-blur-sm p-4 sm:p-6">
          <Exchange tokenSymbol="TSP500" />
        </div>
      </div>

      {/* Info Section */}
      <div className="pt-6 sm:pt-8 md:pt-12">
        <TSP500Infos />
      </div>
    </div>
  );
};

export default TSP500Page;
