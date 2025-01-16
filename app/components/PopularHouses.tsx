import React from "react";
import HomeCard from "./HouseCard";
import housesData from "../data/housesData";

interface PopularHomesProps {
  indexes: number[];
}

const PopularHomes: React.FC<PopularHomesProps> = ({ indexes }) => {
  return (
    <div className="w-10/12 mx-auto mb-[-22rem] relative py-10">
      <div className="flex items-center mb-4">
        <div className="w-12 h-1 bg-color4 mr-2"></div>
        <h3 className="font-titleBold text-xl text-color4 md:text-2xl">POPULAR</h3>
      </div>
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-titleBold text-2xl text-color4">Our Popular Homes</h4>
        <div className="flex items-center space-x-2">
          <button className="text-2xl text-color4">Explore All</button>
          <div className="relative">
            <img src="/icons/longArrowIcon.png" alt="Long Arrow to Explore All" className="w-28 pr-6 " />
          </div>
        </div>
      </div>
      <div className="w-full mx-auto flex justify-center space-x-4">
        {indexes.map((index) => (
          <HomeCard key={index} {...housesData[index]} />
        ))}
      </div>
    </div>
  );
};

export default PopularHomes;
