'use client'

import React from "react";
import Exchange from '@/app/marketplace/commodities/components/Exchange'
import commoditiesData from '@/app/data/commoditiesData.json'
import Contracts from '@/app/components/Contracts'
import Image from 'next/image'
import CommoditiesInfos from "../components/CommoditiesInfos";
import { use } from "react";

interface PageProps {
  params: Promise<{ name: string }>; // params is now a Promise
}

const CommodityPage = ({ params }: PageProps) => {
  const { name } = use(params); // Unwrapping params using React.use()
  const commodity = commoditiesData.find(c => c.name.toLowerCase() === name.toLowerCase());

  if (!commodity) {
    return <div>Commodity not found</div>;
  }

  const { image } = commodity;

  return (
    <div className="max-w-6xl mx-auto py-12 px-4">
      <div>
        {/* Header Section */}
        <div className="bg-white/5 rounded-2xl p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl text-color4 font-semibold">Tokeshare Gold Gram (TGG)</h1>
            <Contracts polygonContract={"null"} baseContract={"null"} />
          </div>
          
          <div className="flex items-center justify-center gap-12 p-6">
            <div className="relative">
              <Image 
                src="/images/currencies/tgg.png" 
                alt="TGG Logo" 
                width={120} 
                height={120} 
              />
            </div>
            <div className="relative">
              <Image 
                src={image} 
                alt={name} 
                width={200} 
                height={200}
                className="rounded-xl"
              />
            </div>
          </div>
        </div>

        {/* Trading Section */}
        <div className="bg-white/5 rounded-2xl backdrop-blur-sm">
          <h2 className="text-center text-3xl text-color4 font-semibold mb-8">
            Trade TGG
            <span className="block text-lg text-color4/80 mt-2 font-normal">
              Buy, Sell, or Swap Tokeshare Gold Gram 
            </span>
          </h2>
          <Exchange />
        </div>
      </div>
      <div className="pt-12">
      <CommoditiesInfos />  
      </div>
    </div>
  );
}

export default CommodityPage;
