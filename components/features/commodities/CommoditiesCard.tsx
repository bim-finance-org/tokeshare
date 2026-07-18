'use client';

import React from 'react';
import AssetCard from '@/components/shared/AssetCard';
import { Commodity } from '@/interfaces/Commodity';
import { calculateTGGPrice, calculateTSGPrice } from '@/utils/priceUtils';
import { useCommodityData } from '@/hooks/useCommodityData';

interface CommoditiesCardProps {
  commodity: Commodity;
}

const TRADABLE: Record<string, string> = { Gold: 'TGG', Silver: 'TSG' };

const CommoditiesCard: React.FC<CommoditiesCardProps> = ({ commodity }) => {
  const { name, image } = commodity;
  const { price, perf1d, perf1y, isLoading } = useCommodityData(name);

  const symbol = TRADABLE[name];

  // The underlying spot (PAXG for gold, XAGM for silver) is per troy ounce; both
  // convert to a per-gram token price via the same 31.1034768 divisor.
  const toGramPrice = name === 'Silver' ? calculateTSGPrice : calculateTGGPrice;

  return (
    <AssetCard
      name={name}
      image={image}
      price={price != null ? `$${toGramPrice(price).toFixed(2)}` : null}
      isLoading={isLoading}
      perfs={[
        { label: '24h', value: perf1d?.perf1d },
        { label: '1 year', value: perf1y?.perf1y },
      ]}
      href={symbol ? `/marketplace/commodities/${name}` : undefined}
      ctaSymbol={symbol}
    />
  );
};

export default CommoditiesCard;
