import React from "react";
import ArrowIcon from "./icons/ArrowIcon";

interface CommoditiesCardProps {
  name: string;
  image: string;
  tokenPrice: number;
  year1Perf: number;
  years5Perf: number;
  link: string;
}

const CommoditiesCard: React.FC<CommoditiesCardProps> = ({ name, image, tokenPrice, year1Perf, years5Perf, link }) => {
  return (
    <div className="text-color4 min-w-[280px] max-w-[400px] w-full mx-auto">
      <div className="relative w-full aspect-[4/3]">
        <img src={image} alt={name} className="w-full h-full object-cover rounded-t-3xl" />
      </div>
      <div className="bg-color1 rounded-b-3xl p-4 shadow-lg">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div className="border-t-2 border-color4 w-8 mr-2 ml-1"></div>
            <p className="font-semibold">{name}</p>
          </div>
          <p className="text-color2 font-bold text-lg">{tokenPrice} $</p>
        </div>

        <div className="mt-2 space-y-1">
          <div className="flex justify-between">
            <p className="text-sm">Performance over 1 year</p>
            <p className="font-medium">{year1Perf} %</p>
          </div>
          <div className="flex justify-between">
            <p className="text-sm">Performance over 5 years</p>
            <p className="font-medium">{years5Perf} %</p>
          </div>
        </div>
        <div className="flex justify-center mt-4 w-full">
          <a href={link} target="_blank" rel="noopener noreferrer">
            <button className=" bg-color2 text-white rounded-full text-sm font-bold hover:scale-105 transition ">
              <div className="flex w-full justify-between items-center px-8">
                <p className="whitespace-nowrap pr-10">Learn More</p>
                <ArrowIcon size={24} />
              </div>
            </button>
          </a>
        </div>
      </div>
    </div>
  );
};

export default CommoditiesCard;
