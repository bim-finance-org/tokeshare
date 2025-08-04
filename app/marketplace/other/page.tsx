import TacosCard from '@/components/features/french-tacos/TacosCard';
import React from 'react';

const page = () => {
  return (
    <div>
      <div className="px-6 md:px-32 bg-color7 pb-20 h-96">
        <h1 className="text-color6 text-3xl sm:text-4xl py-8 sm:py-12">Invest in others assets</h1>
        <div className="text-color3 text-lg sm:text-2xl space-y-4 text-justify ">
          <p>With Tokeshare, discover a new way to access unique investment opportunities in Latin America.</p>
          <p>Thanks to tokenization, we offer you the opportunity to become a co-owner of a diverse range of assets.</p>
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-x-10 gap-y-10 max-w-7xl mx-auto px-4 mb-24 transform -translate-y-10 sm:-translate-y-20">
        <div className="w-full  max-w-lg flex justify-center">
          <TacosCard />
        </div>
      </div>
    </div>
  );
};

export default page;
