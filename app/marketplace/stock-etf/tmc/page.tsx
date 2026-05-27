'use client';

import React from 'react';
import Exchange from '@/components/features/commodities/ExchangeLazy';
import Contracts from '@/components/shared/Contracts';
import TMCInfos from '@/components/features/tmc/TMCInfos';
import { BASE_CONTRACTS } from '@/contracts/contracts';

const TMCPage = () => {
  return (
    <div className="max-w-6xl mx-auto py-6 sm:py-8 md:py-12 px-4 sm:px-6">
      <div className="space-y-6 sm:space-y-8">
        {/* Header Section */}
        <div className="bg-white/5 rounded-2xl p-4 sm:p-6 backdrop-blur-sm">
          <div className="flex flex-col items-center justify-between md:flex-row gap-4">
            <h1 className="text-2xl sm:text-3xl text-color4 font-semibold text-center md:text-left">
              Tokeshare MarketCap 20 Index (TMC)
            </h1>
            <Contracts baseContract={BASE_CONTRACTS.TMC} />
          </div>
        </div>

        {/* Trading Section */}
        <div className="bg-white/5 rounded-2xl backdrop-blur-sm p-4 sm:p-6">
          <h2 className="text-center text-2xl sm:text-3xl text-color4 font-semibold mb-4 sm:mb-8">
            Trade TMC
            <span className="block text-base sm:text-lg text-color4/80 mt-2 font-normal">
              Buy, Sell, or Swap Tokeshare MarketCap 20 Index
            </span>
          </h2>
          <Exchange tokenSymbol="TMC" />
        </div>
      </div>

      {/* Info Section */}
      <div className="pt-6 sm:pt-8 md:pt-12">
        <TMCInfos />
      </div>
    </div>
  );
};

export default TMCPage;
