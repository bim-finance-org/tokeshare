'use client';

import React, { useEffect, useRef, useState } from 'react';
import ArrowIcon from '../../icons/arrows/ArrowIcon';
import Image from 'next/image';
import { Commodity } from '@/interfaces/Commodity';
import { calculateTGGPrice } from '@/utils/priceUtils';
import { usePaxgPrice } from '@/hooks/usePaxgPrice';
import Link from 'next/link';

interface PopularCommoditiesCardProps {
  commodity: Commodity;
}

const PopularCommoditiesCard: React.FC<PopularCommoditiesCardProps> = ({ commodity }) => {
  const { name, image } = commodity;
  const { data: paxgPrice, isLoading } = usePaxgPrice();

  const cardRef = useRef<HTMLDivElement>(null);
  const [isColumn, setIsColumn] = useState(true);

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
  const formatPrice = (price: number): string => {
    return `$${price.toFixed(2)}`;
  };

  // Display price based on availability
  const displayPrice = isLoading ? 'Loading...' : paxgPrice ? formatPrice(calculateTGGPrice(paxgPrice)) : null;

  return (
    <div
      ref={cardRef}
      className="bg-color5 text-color4 text-base sm:text-lg shadow-lg rounded-xl overflow-hidden flex flex-col min-w-0 w-full
                    max-w-[90%] sm:max-w-full mx-auto"
    >
      <Image src={image} alt="House" width={800} height={800} className="object-cover w-hull h-64" />
      <div className="p-3 sm:p-4 flex flex-col flex-grow min-h-[180px]">
        <div>
          <h3 className="font-semibold text-lg sm:text-xl">Tokeshare Gold Gram</h3>
          <div className="pt-2">1 gram of gold</div>
        </div>
        <div className="flex-grow"></div>
        <div
          className={`flex ${isColumn ? 'flex-col items-start' : 'flex-row items-center'} justify-between gap-2 sm:gap-4`}
        >
          <h5 className={`font-bold text-lg sm:text-xl ${isLoading ? 'text-gray-400' : 'text-blue-600'}`}>
            {displayPrice}
          </h5>

          <Link href={`/marketplace/commodities/${name}`} rel="noopener noreferrer">
            <button type="button" className="px-8 w-full sm:w-auto bg-color4 text-white rounded-lg flex items-center justify-center whitespace-nowrap hover:bg-color2">
              <h5>Swap Gold (TGG)</h5>
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
