'use client';

import React from 'react';
import AssetCard from '@/components/shared/AssetCard';
import { useTSP500Data } from '@/hooks/useTSP500Data';

const TSP500Card = () => {
  const { price, perf1d, perf30d, isLoading } = useTSP500Data();

  return (
    <AssetCard
      name="Tokeshare S&P500"
      image="/images/image_TSP500.webp"
      price={price != null ? `$${price.toFixed(2)}` : null}
      isLoading={isLoading}
      perfs={[
        { label: '24h', value: perf1d },
        { label: '30d', value: perf30d },
      ]}
      href="/marketplace/stock-etf/tsp500"
      ctaSymbol="TSP500"
      imagePriority
    />
  );
};

export default TSP500Card;
