'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import ArrowIcon from '@/components/icons/arrows/ArrowIcon';
import { useTSP500Data } from '@/hooks/useTSP500Data';

const TSP500Card = () => {
  const { price, perf1d, perf30d, isLoading } = useTSP500Data();

  const formatPrice = (price: number) => {
    return `$${price.toFixed(2)}`;
  };

  const displayPrice = isLoading ? 'Loading...' : price ? formatPrice(price) : null;

  return (
    <div className="text-color4 min-w-[280px] max-w-[400px] w-full mx-auto">
      <div className="relative w-full aspect-[5/3] overflow-hidden rounded-t-3xl">
        <Image src="/images/image_TSP500.webp" alt="TSP500" fill sizes="(max-width: 640px) 100vw, 400px" className="object-cover" priority />
      </div>
      <div className="bg-color1 rounded-b-3xl p-4 shadow-lg">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div className="border-t-2 border-color4 w-8 mr-2 ml-1"></div>
            <h3>Tokeshare S&amp;P500</h3>
          </div>
          <h6 className={`font-bold text-lg ${isLoading ? 'text-gray-400' : 'text-color2'}`}>{displayPrice}</h6>
        </div>

        <div className="mt-2 space-y-1">
          <div className="flex justify-between">
            <p className="text-sm">Performance over 1 day</p>
            {typeof perf1d === 'number' ? (
              <h6
                className={
                  'font-medium ' + (perf1d > 0 ? 'text-green-500' : perf1d < 0 ? 'text-red-500' : 'text-gray-500')
                }
              >
                {(perf1d > 0 ? '+' : '') + perf1d.toFixed(2) + ' %'}
              </h6>
            ) : (
              <h6 className="font-medium text-gray-500">N/A</h6>
            )}
          </div>
          <div className="flex justify-between">
            <p className="text-sm">Performance over 30 days</p>
            {typeof perf30d === 'number' ? (
              <h6
                className={
                  'font-medium ' + (perf30d > 0 ? 'text-green-500' : perf30d < 0 ? 'text-red-500' : 'text-gray-500')
                }
              >
                {(perf30d > 0 ? '+' : '') + perf30d.toFixed(2) + ' %'}
              </h6>
            ) : (
              <h6 className="font-medium text-gray-500">N/A</h6>
            )}
          </div>
        </div>

        <div className="flex justify-center mt-4 w-full">
          <Link href="/marketplace/stock-etf/tsp500">
            <button type="button" className="bg-color2 text-white rounded-full text-sm font-bold hover:scale-105 transition">
              <div className="flex w-full justify-between items-center px-8">
                <h6 className="whitespace-nowrap pr-10">Swap TSP500</h6>
                <ArrowIcon size={24} />
              </div>
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TSP500Card;
