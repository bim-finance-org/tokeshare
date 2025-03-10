"use client";

import React, { useEffect, useRef, useState } from "react";
import ArrowIcon from "../icons/arrows/ArrowIcon";
import Image from "next/image";
import { Commodity } from "@/app/types/Commodity";
import { fetchPAXGPrice, calculateTGGPrice } from "@/app/utils/priceUtils";
import Link from "next/link";

interface PopularCommoditiesCardProps {
  commodity: Commodity;
}

const PopularCommoditiesCard: React.FC<PopularCommoditiesCardProps> = ({ commodity }) => {
  const { name, image, tokenPrice: staticTokenPrice } = commodity;

  const cardRef = useRef<HTMLDivElement>(null);
  const [isColumn, setIsColumn] = useState(true);
  const [dynamicTokenPrice, setDynamicTokenPrice] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch the real-time price
  useEffect(() => {
    const getPrice = async () => {
      try {
        setIsLoading(true);
        const paxgPrice = await fetchPAXGPrice();
        const calculatedTggPrice = calculateTGGPrice(paxgPrice);
        setDynamicTokenPrice(calculatedTggPrice);
      } catch (error) {
        console.error("Error fetching token price:", error);
      } finally {
        setIsLoading(false);
      }
    };

    getPrice();
    
    // Refresh price every 30 seconds
    const intervalId = setInterval(getPrice, 30000);
    return () => clearInterval(intervalId);
  }, []);

  // Handle responsive layout
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

  // Format price display
  const formatPrice = (price: number) => {
    return `$${price.toFixed(2)}`;
  };

  // Display price based on availability
  const displayPrice = isLoading 
    ? "Loading..." 
    : dynamicTokenPrice 
      ? formatPrice(dynamicTokenPrice)
      : staticTokenPrice;

  return (
    <div
      ref={cardRef}
      className="bg-color5 text-color4 text-base sm:text-lg shadow-lg rounded-xl overflow-hidden flex flex-col min-w-0 
                    max-w-[90%] sm:max-w-full mx-auto"
    >
      <Image src={image} alt="House" width={800} height={800} className="object-cover w-hull h-64" />
      <div className="p-3 sm:p-4 flex flex-col flex-grow">
        <div>
          <h3 className="font-semibold text-lg sm:text-xl">{name}</h3>
        </div>
        <div className="pt-2">1g {name}</div>
        <div className={`mt-4 flex ${isColumn ? "flex-col items-start" : "flex-row items-center"} justify-between gap-2 sm:gap-4`}>
          <h5 className={`font-bold text-lg sm:text-xl ${isLoading ? 'text-gray-400' : 'text-blue-600'}`}>
            {displayPrice}
          </h5>

          <Link href={`/marketplace/commodities/${name}`} rel="noopener noreferrer">
          <button className="px-8 w-full sm:w-auto bg-color4 text-white rounded-lg flex items-center justify-center whitespace-nowrap hover:bg-color2">
            <h5>Buy Gold (TGG)</h5>
            <span className="ml-2">
              <ArrowIcon size={24} />
            </span>
          </button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PopularCommoditiesCard;
