'use client';

import React, { useEffect, useState } from 'react';
import { Address } from 'viem';
import { useMarketplaceContract } from '@/hooks/useMarketplaceContracts';
import { getTokenAddress } from '@/utils/token';
import { Blockchain } from '@/enums/Blockchain';
import { getLogger } from '@/lib/logger';
import type { MarketplaceTokenSymbol } from '@/config/token';

const log = getLogger('marketplace:availability');

interface MarketplaceAvailabilityProps {
  /** Token whose Marketplace stock is shown; defaults to TFT for the historical call site. */
  symbol?: MarketplaceTokenSymbol;
  /** Short ticker shown next to the balance (e.g. "TFT"). */
  ticker?: string;
}

const MarketplaceAvailability = ({ symbol = 'TFT_001', ticker = 'TFT' }: MarketplaceAvailabilityProps) => {
  const [balance, setBalance] = useState<number | null>(null);
  const [hasError, setHasError] = useState(false);
  const { getMarketplaceBalance } = useMarketplaceContract(symbol);

  useEffect(() => {
    const fetchBalance = async () => {
      const tokenAddress = getTokenAddress(symbol, Blockchain.Base) as Address;
      try {
        const rawBalance = await getMarketplaceBalance(tokenAddress);
        setBalance(Number(rawBalance) / 10 ** 18);
      } catch (err) {
        log.error('balance fetch failed', err);
        setHasError(true);
        setBalance(null);
      }
    };

    fetchBalance();
  }, [symbol]);

  if (balance === null || hasError) return null;

  const soldOut = balance === 0;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
        soldOut ? 'bg-gray-100 text-gray-500' : 'bg-green-50 text-green-600'
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${soldOut ? 'bg-gray-400' : 'bg-color3'}`} />
      {soldOut ? 'Sold out' : `${balance.toFixed(2)} ${ticker} on marketplace`}
    </span>
  );
};

export default MarketplaceAvailability;
