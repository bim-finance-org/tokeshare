"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";

import BedIcon from "../icons/BedIcon";
import SurfaceIcon from "../icons/SurfaceIcon";
import LocationIcon from "../icons/LocationIcon";
import ArrowIcon from "../icons/ArrowIcon";

interface HomeCardProps {
  id: string;
  name: string;
  number: string;
  surface: string;
  price: string;
  city: string;
  image: string;
  tokenPrice: string;
  expectedIncome: string;
  dateIncome: string;
  tokenIncome: string;
}

const HomeCard: React.FC<HomeCardProps> = ({ id, name, number, surface, price, city, image, tokenPrice, expectedIncome, dateIncome, tokenIncome }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isCompact, setIsCompact] = useState(false);

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      if (entries.length > 0) {
        const width = entries[0].contentRect.width;
        setIsCompact(width < 500);
      }
    });

    const containerElement = containerRef.current;

    if (containerElement) {
      observer.observe(containerElement);
    }

    return () => {
      if (containerElement) {
        observer.unobserve(containerElement);
      }
    };
  }, []);

  return (
    <div ref={containerRef} className="bg-color1 shadow-lg max-w-xl rounded-3xl">
      <div className="image-container">
        <Image src={image} alt={`Image of ${name}`} width={800} height={800} className="object-cover h-72 rounded-t-3xl" />
      </div>
      <div className="px-8 py-4">
        <div className="flex items-center w-full">
          <div className="border-t-2 border-color4 w-8 mr-2 ml-1"></div>
          <h1 className="text-color4 text-2xl">{name}</h1>
        </div>
        <div className={`text-color4 text-lg flex items-center ${isCompact ? "flex-col space-y-2 items-start" : "space-x-4"} mt-2`}>
          <p className={`flex items-center ${isCompact ? "w-full" : ""} `}>
            <span className="mr-1">
              <BedIcon size={36} />
            </span>
            {number}
          </p>
          <p className={`flex items-center ${isCompact ? "w-full" : ""} `}>
            <span className="mr-1">
              <SurfaceIcon />
            </span>
            {surface} m²
          </p>
          <p className={`flex items-center ${isCompact ? "w-full" : ""} `}>
            <span className="mr-1">
              <LocationIcon />
            </span>
            {city}
          </p>
        </div>
      </div>
      <div className="px-8 pb-8">
        <div className="flex items-center justify-between my-2">
          <h1 className="text-color4 text-xl">Total Price</h1>
          <h5 className="text-color4 text-xl">{price}</h5>
        </div>
        <div className="flex items-center justify-between">
          <h1 className="text-color2 text-xl">Token Price</h1>
          <h5 className="text-color2 text-xl">{tokenPrice}</h5>
        </div>
        <div>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-color4 text-xl">Expected Income</h3>
              <p className="text-color2 text-sm">Not including capital appreciation</p>
            </div>
            <h5 className="text-color4 text-lg font-bold">{expectedIncome}</h5>
          </div>
          <div className="flex items-center justify-between text-color4 py-2">
            <p>Income Start Date</p>
            <p>{dateIncome}</p>
          </div>
          <div className="flex items-center justify-between text-color4">
            <p>Income per Token</p>
            <p>{tokenIncome} / year</p>
          </div>
        </div>
        <div className="flex justify-center">
          <Link href={`/marketplace/real-estate/${id}`}>
            <button className="flex items-center justify-between bg-color2 rounded-3xl px-4 py-1 mt-4 w-64 hover:bg-color4 hover:text-white transition-colors duration-300">
              <h5 className="text-color1 hover:text-white">Available Soon</h5>
              <ArrowIcon size={24} />
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HomeCard;
