"use client";

import React from "react";
import ArrowIcon from "@/app/components/icons/arrows/ArrowIcon";
import Image from "next/image";
import Link from "next/link";
import { Commodity } from "@/app/types/Commodity";
import { usePAXGPrice, calculateTGGPrice } from "@/app/utils/priceUtils";

interface CommoditiesCardProps {
  commodity: Commodity;
}

const CommoditiesCard: React.FC<CommoditiesCardProps> = ({ commodity }) => {
  const { name, image, tokenPrice: staticTokenPrice } = commodity;
  const { paxgPrice, isLoading } = usePAXGPrice();

  // Format price for display
  const formatPrice = (price: number) => {
    return `$${price.toFixed(2)}`;
  };

  // Display price based on availability
  const displayPrice = isLoading 
    ? "Loading..." 
    : paxgPrice 
      ? formatPrice(calculateTGGPrice(paxgPrice))
      : staticTokenPrice;

  return (
    <div className="text-color4 min-w-[280px] max-w-[400px] w-full mx-auto">
      <div className="relative w-">
        <Image src={image} alt={name} width={500} height={400} className="object-contain" />
      </div>
      <div className="bg-color1 rounded-b-3xl p-4 shadow-lg">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div className="border-t-2 border-color4 w-8 mr-2 ml-1"></div>
            <h3>{name}</h3>
          </div>
          <h6 className={`font-bold text-lg ${isLoading ? 'text-gray-400' : 'text-color2'}`}>
            {displayPrice}
          </h6>
        </div>

        <div className="mt-2 space-y-1">
          <div className="flex justify-between">
            <p className="text-sm">Performance over 1 day</p>
            <h6 className="font-medium">...</h6>
          </div>
          <div className="flex justify-between">
            <p className="text-sm">Performance over 1 year</p>
            <h6 className="font-medium">...</h6>
          </div>
        </div>
        <div className="flex justify-center mt-4 w-full">
          {name === 'Gold' ? (
            <Link href={`/marketplace/commodities/${name}`} rel="noopener noreferrer">
              <button className="bg-color2 text-white rounded-full text-sm font-bold hover:scale-105 transition">
                <div className="flex w-full justify-between items-center px-8">
                  <h6 className="whitespace-nowrap pr-10">Buy Gold (TGG)</h6>
                  <ArrowIcon size={24} />
                </div>
              </button>
            </Link>
          ) : (
            <button className="bg-gray-400 text-white rounded-full text-sm font-bold cursor-not-allowed opacity-80">
              <div className="flex w-full justify-between items-center px-8">
                <h6 className="whitespace-nowrap pr-10">Available Soon</h6>
                <ArrowIcon size={24} />
              </div>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommoditiesCard;
