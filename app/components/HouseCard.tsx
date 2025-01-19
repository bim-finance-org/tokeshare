"use client";

import React, { useState, useEffect, useRef } from "react";

interface HouseCardProps {
  name: string;
  beds: number;
  surface: number;
  price: number;
  city: string;
  image: string;
  link: string;
}

const HouseCard: React.FC<HouseCardProps> = ({ name, beds, surface, price, city, image, link }) => {
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
      <div className="relative">
        <img src={image} alt={`Image of ${name}`} className="w-full h-52 sm:h-64 object-cover" />
      </div>
      <div className="p-3 sm:p-4 flex flex-col flex-grow">
        <div>
          <h3 className="font-semibold text-lg sm:text-xl">{name}</h3>
          <div className="flex flex-wrap items-center space-x-3 mt-2 text-sm sm:text-base">
            <p className="flex items-center">
              <img src="/icons/bedIcon.png" alt="Bed Icon" className="size-6 sm:size-8 object-contain mr-1" />
              {beds} bed{beds > 1 && "s"}
            </p>
            <p className="flex items-center">
              <img src="/icons/surfaceIcon.png" alt="Surface Icon" className="size-5 sm:size-6 object-contain mr-1" />
              {surface} m²
            </p>
            <p className="flex items-center">
              <img src="/icons/locationIcon.png" alt="Location Icon" className="size-5 sm:size-6 object-contain mr-1" />
              {city}
            </p>
          </div>
        </div>

        <div className={`mt-4 flex ${isColumn ? "flex-col items-start" : "flex-row items-center"} justify-between gap-2 sm:gap-4`}>
          <p className="text-blue-600 font-bold text-lg sm:text-xl">{price.toLocaleString("en-US", { style: "currency", currency: "USD" })}</p>

          <a href={link} className="px-8 w-full sm:w-auto bg-color4 text-white rounded-lg flex items-center justify-center whitespace-nowrap hover:bg-color2">
            Learn More
            <span>
              <img src="/icons/shortArrowIcon.png" alt="Arrow" className="size-6 ml-2 object-contain" />
            </span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default HouseCard;
