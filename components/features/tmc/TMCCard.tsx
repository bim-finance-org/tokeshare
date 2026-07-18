'use client';

import React from 'react';
import AssetCard from '@/components/shared/AssetCard';
import { useTMCData } from '@/hooks/useTMCData';

const TMCCard = () => {
  const { price, perf1d, perf30d, isLoading } = useTMCData();

  return (
    <AssetCard
      name="Tokeshare MarketCap 20"
      image="/images/tmc/tmc.webp"
      price={price != null ? `$${price.toFixed(2)}` : null}
      isLoading={isLoading}
      perfs={[
        { label: '24h', value: perf1d },
        { label: '30d', value: perf30d },
      ]}
      href="/marketplace/stock-etf/tmc"
      ctaSymbol="TMC"
      imagePriority
    />
  );
};

export default TMCCard;
