import TMCCard from '@/components/features/tmc/TMCCard';
import React from 'react';

const page = () => {
  return (
    <div>
      <div className="px-6 md:px-32 bg-color7 pb-20 h-96">
        <h1 className="text-color6 text-3xl sm:text-4xl py-8 sm:py-12">Invest in ETF</h1>
        <div className="text-color3 text-lg sm:text-2xl space-y-4 text-justify ">
          <p>
            Gain diversified exposure to the cryptocurrency market through tokenized index funds on Tokeshare.
          </p>
          <p>
            Our ETF tokens allow you to track the performance of multiple top cryptocurrencies with a single investment,
            simplifying your portfolio management.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-x-10 gap-y-10 max-w-7xl mx-auto px-4 mb-24 transform -translate-y-10 sm:-translate-y-20">
        <div className="w-full max-w-lg flex justify-center">
          <TMCCard />
        </div>
      </div>
    </div>
  );
};

export default page;
