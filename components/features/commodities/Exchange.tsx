'use client';

import React, { useState } from 'react';
import Buy from '@/components/features/commodities/Buy';
import Sell from '@/components/features/commodities/Sell';
import Swap from '@/components/features/commodities/Swap';
import { useAllStablePrices } from '@/hooks/useStablePrice';

import { TOKENS } from '@/config/token';
import { ExchangeSection } from '@/enums/ExchangeSection';

interface ExchangeProps {
  // Receive the token symbol (a serializable string) rather than the full
  // TokenInfo object: the latter carries an `icon` React component (a function)
  // which cannot be passed from a Server Component to this Client Component.
  // We resolve the full token client-side here instead.
  tokenSymbol: string;
}

const Exchange: React.FC<ExchangeProps> = ({ tokenSymbol }) => {
  const [activeTab, setActiveTab] = useState<ExchangeSection>(ExchangeSection.Swap);

  const { data: stablePrices, isLoading, error } = useAllStablePrices();

  const token = TOKENS[tokenSymbol];

  return (
    <div className="flex flex-col items-center bg-gray-100 rounded-xl overflow-hidden w-[calc(100%-16px)] sm:w-11/12 mx-auto max-w-md sm:max-w-lg my-8 sm:my-16">
      <div className="flex w-full border-b border-gray-200">
        <button type="button"
          onClick={() => setActiveTab(ExchangeSection.Swap)}
          className={`flex-1 px-2 sm:px-4 py-2 sm:py-3 text-center text-sm sm:text-base ${
            activeTab === ExchangeSection.Swap ? 'border-b-2 border-color2 text-color2 font-medium' : 'text-color4'
          }`}
        >
          Swap
        </button>
        <button type="button"
          onClick={() => setActiveTab(ExchangeSection.Buy)}
          className={`flex-1 px-2 sm:px-4 py-2 sm:py-3 text-center text-sm sm:text-base ${
            activeTab === ExchangeSection.Buy ? 'border-b-2 border-color2 text-color2 font-medium' : 'text-color4'
          }`}
        >
          Buy
        </button>
        <button type="button"
          onClick={() => setActiveTab(ExchangeSection.Sell)}
          className={`flex-1 px-2 sm:px-4 py-2 sm:py-3 text-center text-sm sm:text-base ${
            activeTab === ExchangeSection.Sell ? 'border-b-2 border-color2 text-color2 font-medium' : 'text-color4'
          }`}
        >
          Sell
        </button>
      </div>

      <div className="p-2 sm:p-4 w-full">
        {isLoading || !token ? (
          <div className="text-center py-4 text-color4">Loading...</div>
        ) : (
          <>
            {activeTab === ExchangeSection.Swap && <Swap token={token} />}
            {activeTab === ExchangeSection.Buy && <Buy token={token} />}
            {activeTab === ExchangeSection.Sell && <Sell token={token} />}
          </>
        )}
      </div>
    </div>
  );
};

export default Exchange;
