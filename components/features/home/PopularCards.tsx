import React from 'react';

import ArrowLongLineIcon from '../../icons/arrows/ArrowLongLineIcon';

import PopularCommoditiesCard from './PopularCommoditiesCard';
import PopularTFTCard from './PopularTFTCard';
import PopularTMCCard from './PopularTMCCard';

import commoditiesData from '../../../data/commoditiesData.json';

const PopularHouses: React.FC = () => {
  return (
    <div className="px-4 sm:px-10 lg:px-24 relative py-8 sm:py-10">
      <div className="flex items-center mb-4">
        <div className="w-10 sm:w-12 h-1 bg-color4 mr-2"></div>
        <h3 className=" text-2xl sm:text-3xl text-color4">POPULAR</h3>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <h4 className=" text-xl sm:text-2xl text-color4">Our Popular Assets</h4>
        <div className="flex items-center space-x-2 mt-3 sm:mt-0">
          {/* <a href="/explore-all" className="flex items-center hover:scale-105 transition-transform duration-300"> */}
          <button type="button" className="text-lg sm:text-2xl text-color4">Explore All</button>
          <div className="relative pr-4">
            <ArrowLongLineIcon size={96} className="px-2" />
          </div>
          {/* </a> */}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-1 custom-r:grid-cols-4 gap-4 sm:gap-6">
        <PopularTFTCard />
        <PopularCommoditiesCard key={2} commodity={commoditiesData[0]} />
        <PopularTMCCard />
        <PopularTMCCard />
      </div>
    </div>
  );
};

export default PopularHouses;
