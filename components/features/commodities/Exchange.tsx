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
    <div className="flex flex-col bg-white rounded-3xl overflow-hidden w-[calc(100%-16px)] sm:w-11/12 mx-auto max-w-md sm:max-w-lg my-8 sm:my-16 ring-1 ring-black/5 shadow-[0_24px_60px_-24px_rgba(20,20,45,0.28)]">
      <div className="flex items-center justify-between px-4 sm:px-6 pt-4 sm:pt-5 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-base sm:text-lg font-titleSemibold text-color4">Swap</span>
          <span className="h-1.5 w-1.5 rounded-full bg-color2" />
        </div>
        <span className="text-[11px] sm:text-xs font-medium tracking-wide text-gray-400">Instant · On-chain</span>
      </div>

      {isLoading || !token ? (
        <SwapFormSkeleton />
      ) : (
        <div className="p-1 sm:p-2 w-full">
          <Swap token={token} />
        </div>
      )}
    </div>
  );
};

export default Exchange;
