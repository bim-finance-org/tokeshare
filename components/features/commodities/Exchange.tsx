'use client';

import React from 'react';
import Swap from '@/components/features/commodities/Swap';
import SwapFormSkeleton from '@/components/features/commodities/SwapFormSkeleton';
import { useAllStablePrices } from '@/hooks/useStablePrice';

import { TOKENS } from '@/config/token';

interface ExchangeProps {
  // Receive the token symbol (a serializable string) rather than the full
  // TokenInfo object: the latter carries an `icon` React component (a function)
  // which cannot be passed from a Server Component to this Client Component.
  // We resolve the full token client-side here instead.
  tokenSymbol: string;
}

const Exchange: React.FC<ExchangeProps> = ({ tokenSymbol }) => {
  const { isLoading } = useAllStablePrices();

  const token = TOKENS[tokenSymbol];

  return (
    <div className="flex flex-col items-center bg-gray-100 rounded-xl overflow-hidden w-[calc(100%-16px)] sm:w-11/12 mx-auto max-w-md sm:max-w-lg my-8 sm:my-16">
      <div className="flex w-full border-b border-gray-200">
        <div className="flex-1 px-2 sm:px-4 py-2 sm:py-3 text-center text-sm sm:text-base border-b-2 border-color2 text-color2 font-medium">
          Swap
        </div>
      </div>

      {isLoading || !token ? (
        <SwapFormSkeleton />
      ) : (
        <div className="p-2 sm:p-4 w-full">
          <Swap token={token} />
        </div>
      )}
    </div>
  );
};

export default Exchange;
