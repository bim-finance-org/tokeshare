"use client";

import React, { useState, useEffect, useRef } from "react";
import LocationIcon from "../icons/card/LocationIcon";
import SurfaceIcon from "../icons/card/SurfaceIcon";
import BedIcon from "../icons/card/BedIcon";
import ArrowIcon from "../icons/arrows/ArrowIcon";
import Image from "next/image";
import { House } from "@/types/House";

interface PopularHouseCardProps {
  house: House;
}

const PopularHouseCard: React.FC<PopularHouseCardProps> = ({ house }) => {
  const { general } = house;
  const { name, number, surface, price, city, images } = general;

  const cardRef = useRef<HTMLDivElement>(null);
  const [isColumn, setIsColumn] = useState(true);

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      if (entries[0]) {
        const width = entries[0].contentRect.width;
        setIsColumn(width < 350);
      }
    });

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={cardRef}
      className="bg-color5 text-color4 text-base sm:text-lg shadow-lg rounded-xl overflow-hidden flex flex-col min-w-0 
                    max-w-[90%] sm:max-w-full mx-auto"
    >
      <Image src={images[0]} alt="House" width={800} height={800} className="object-cover w-hull h-64" />
      <div className="p-3 sm:p-4 flex flex-col flex-grow">
        <div>
          <h3 className="font-semibold text-lg sm:text-xl">{name}</h3>
          <div className="flex flex-wrap items-center space-x-3 mt-2 text-sm sm:text-base">
            <div className="flex items-center">
              <BedIcon size={36} />
              {number}
            </div>
            <p className="flex items-center">
              <SurfaceIcon />
              {surface} m²
            </p>
            <p className="flex items-center">
              <LocationIcon />
              {city}
            </p>
          </div>
        </div>

        <div className={`mt-2 flex ${isColumn ? "flex-col items-start" : "flex-row items-center"} justify-between gap-2 sm:gap-4`}>
          <h5 className="text-blue-600 font-bold text-lg sm:text-xl">{price}</h5>

          {/* <Link href={link} > */}
          <button className="px-8 w-full sm:w-auto bg-color4 text-white rounded-lg flex items-center justify-center whitespace-nowrap hover:bg-color2">
            <h5>Available Soon</h5>
            <span className="ml-2">
              <ArrowIcon size={24} />
            </span>
          </button>
          {/* </Link> */}
        </div>
      </div>
    </div>
  );
};

export default PopularHouseCard;
