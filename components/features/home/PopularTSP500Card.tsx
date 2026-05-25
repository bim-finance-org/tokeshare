'use client';

import React, { useEffect, useRef, useState } from 'react';
import ArrowIcon from '../../icons/arrows/ArrowIcon';
import Image from 'next/image';
import Link from 'next/link';
import { useTSP500Data } from '@/hooks/useTSP500Data';

const PopularTSP500Card = () => {
  const { price, isLoading } = useTSP500Data();

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

  const formatPrice = (price: number): string => {
    return `$${price.toFixed(2)}`;
  };

  const displayPrice = isLoading ? 'Loading...' : price ? formatPrice(price) : null;

  return (
    <div
      ref={cardRef}
      className="bg-color5 text-color4 text-base sm:text-lg shadow-lg rounded-xl overflow-hidden flex flex-col min-w-0 w-full
                    max-w-[90%] sm:max-w-full mx-auto"
    >
      <Image
        src="/images/image_TSP500.webp"
        alt="TSP500"
        width={800}
        height={800}
        className="object-cover w-full h-64"
      />
      <div className="p-3 sm:p-4 flex flex-col flex-grow min-h-[180px]">
        <div>
          <h3 className="font-semibold text-lg sm:text-xl">Tokeshare S&amp;P500</h3>
          <div className="pt-2">Stock Index Fund</div>
        </div>
        <div className="flex-grow"></div>
        <div
          className={`flex ${isColumn ? 'flex-col items-start' : 'flex-row items-center'} justify-between gap-2 sm:gap-4`}
        >
          <h5 className={`font-bold text-lg sm:text-xl ${isLoading ? 'text-gray-400' : 'text-blue-600'}`}>
            {displayPrice}
          </h5>

          <Link href="/marketplace/stock-etf/tsp500">
            <button type="button" className="px-8 w-full sm:w-auto bg-color4 text-white rounded-lg flex items-center justify-center whitespace-nowrap hover:bg-color2">
              <h5>Buy TSP500</h5>
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

export default PopularTSP500Card;
