import React from 'react';
import HouseCard from '@/components/features/real-estate/HouseCard';
import housesData from '@/data/housesData.json';

const page = () => {
  return (
    <div>
      <div className="px-6 md:px-32 bg-color7 pb-20">
        <h1 className="text-color6 text-3xl sm:text-4xl py-8 sm:py-12">Invest in real estate</h1>
        <div className="text-color3 text-lg sm:text-2xl space-y-4 text-justify ">
          <p>With Tokeshare, discover a new way to access the real estate market in Latin America.</p>
          <p>
            Thanks to tokenization, we offer you the opportunity to become a co-owner of real estate, in a simple,
            secure and compliant way.
          </p>
        </div>
        <button type="button" className="bg-color4 w-full sm:w-64 text-xl sm:text-2xl p-4 rounded-2xl my-8 sm:my-12 hover:scale-105">
          Properties
        </button>
      </div>

      {/* 🏡 Responsive Grid */}
      <div className="flex flex-wrap justify-center gap-x-10 gap-y-10 max-w-7xl mx-auto px-4 mb-24 transform -translate-y-10 sm:-translate-y-20">
        {housesData.map((house, index) => (
          <div key={index} className="w-full  max-w-lg flex justify-center">
            <HouseCard house={house} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default page;
