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
    <div className="text-color4">
      <div className="relative w-full h-96">
        <img src={image} alt={name} className="w-full h-full object-cover" />
      </div>
      <div className="bg-color1 rounded-b-3xl p-4 shadow-lg">
        <div className="flex justify-between items-center">
          <p className="font-semibold">{name}</p>
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

        <a href={link} target="_blank" rel="noopener noreferrer">
          <button className="mt-4 w-full bg-color2 text-white py-2 rounded-full text-sm font-bold hover:bg-color3 transition">
            <div className="flex justify-between items-center px-4">
              <p>Learn More</p>
              <ArrowIcon size={24} />
            </div>
          </button>
        </a>
      </div>
    </div>
  );
};

export default CommoditiesCard;
