import React from 'react';
import CommoditiesCard from '@/components/marketplace/commodities/CommoditiesCard';
import commoditiesData from '@/data/commoditiesData.json';

const Page = () => {
  return (
    <div>
      <div className="px-6 md:px-12 lg:px-32 pb-20 pt-1 bg-color7 h-auto min-h-[20rem] sm:min-h-[22rem] md:min-h-[24rem] lg:min-h-[26rem]">
        <h1 className="text-color6 text-3xl sm:text-4xl my-10">Invest in Commodities</h1>
        <p className="text-color3 text-lg sm:text-2xl space-y-4 text-justify">
          With Tokeshare, discover a new way to access the commodities market. Through tokenization, we offer you the
          opportunity to invest in assets like gold, silver, cocoa, or sugarcane in a simple, secure, and management
          fee-free way.
        </p>
      </div>

      <div className="bg-color1 px-6 md:px-12 lg:px-20 py-12 mt-6">
        <div className="max-w-screen-xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 justify-center transform -translate-y-32">
          {commoditiesData.map((commodity, index) => (
            <CommoditiesCard key={index} commodity={commodity} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Page;
