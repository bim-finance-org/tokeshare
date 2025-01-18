import React from "react";
import HouseCard from "./HouseCard";
import housesData from "../data/housesData";

interface PopularHousesProps {
  indexes: number[];
}

const PopularHouses: React.FC<PopularHousesProps> = ({ indexes }) => {
  return (
    <div className="px-4 sm:px-10 lg:px-24 mb-[-22rem] relative py-8 sm:py-10">
      <div className="flex items-center mb-4">
        <div className="w-10 sm:w-12 h-1 bg-color4 mr-2"></div>
        <h3 className="font-titleSemiBold text-2xl sm:text-3xl text-color4">POPULAR</h3>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <h4 className="font-titleBold text-xl sm:text-2xl text-color4">Our Popular Homes</h4>
        <div className="flex items-center space-x-2 mt-3 sm:mt-0">
          <button className="text-lg sm:text-2xl text-color4">Explore All</button>
          <div className="relative">
            <img src="/icons/longArrowIcon.png" alt="Explore All" className="w-24 sm:w-28 pr-4 sm:pr-6" />
          </div>
        </div>
      </div>

      {/* Grille qui devient colonne sur mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {indexes.map((index) => (
          <HouseCard key={index} {...housesData[index]} />
        ))}
      </div>
    </div>
  );
};

export default PopularHouses;
