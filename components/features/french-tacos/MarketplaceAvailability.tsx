'use client';

import React, { useEffect, useState } from 'react';
import { Address } from 'viem';
import { useMarketplaceContract } from '@/hooks/useMarketplaceContracts';
import { getTokenAddress } from '@/utils/token';
import { Blockchain } from '@/enums/Blockchain';
import { getLogger } from '@/lib/logger';

const log = getLogger('french-tacos:availability');

const MarketplaceAvailability = () => {
  const [balance, setBalance] = useState<number | null>(null);
  const [hasError, setHasError] = useState(false);
  const { getMarketplaceBalance } = useMarketplaceContract();

  useEffect(() => {
    const fetchBalance = async () => {
      const tftTokenAddress = getTokenAddress('TFT_001', Blockchain.Base) as Address;
      try {
        const rawBalance = await getMarketplaceBalance(tftTokenAddress);
        setBalance(Number(rawBalance) / 10 ** 18);
      } catch (err) {
        log.error('balance fetch failed', err);
        setHasError(true);
        setBalance(null);
      }
    };

    fetchBalance();
  }, []);

  if (balance === null || hasError) return null;

  const soldOut = balance === 0;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
        soldOut ? 'bg-gray-100 text-gray-500' : 'bg-green-50 text-green-600'
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${soldOut ? 'bg-gray-400' : 'bg-color3'}`} />
      {soldOut ? 'Sold out' : `${balance.toFixed(2)} TFT on marketplace`}
    </span>
  );
};

export default MarketplaceAvailability;
