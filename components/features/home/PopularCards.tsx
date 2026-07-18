import React from 'react';
import PopularTFTCard from './PopularTFTCard';
import CommoditiesCard from '@/components/features/commodities/CommoditiesCard';
import TMCCard from '@/components/features/tmc/TMCCard';
import TSP500Card from '@/components/features/tsp500/TSP500Card';
import commoditiesData from '@/data/commoditiesData.json';

const PopularCards: React.FC = () => {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="mb-6">
        <span className="text-xs font-semibold uppercase tracking-[0.15em] text-color2">Popular</span>
        <h2 className="mt-1 font-titleSemibold text-2xl text-color4 sm:text-3xl">Our popular assets</h2>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 min-[1200px]:grid-cols-4">
        <PopularTFTCard />
        <CommoditiesCard commodity={commoditiesData[0]} />
        <TMCCard />
        <TSP500Card />
      </div>
    </section>
  );
};

export default PopularCards;
