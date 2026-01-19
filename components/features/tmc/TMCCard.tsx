'use client';
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import ArrowIcon from '@/components/icons/arrows/ArrowIcon';
import { FaChartLine } from 'react-icons/fa6';

const TMCCard = () => {
  return (
    <div className="bg-color1 shadow-lg max-w-3xl md:w-full rounded-3xl overflow-hidden text-color4">
      <div className="image-container relative">
        <Image
          src="/images/img-cmc20.webp"
          alt="CoinMarketCap 20 Index"
          width={1200}
          height={300}
          className="object-cover h-72 w-full"
        />
        <div className="absolute top-4 right-4 bg-color1/90 rounded-full p-2">
          <Image src="/images/currencies/tmc.png" alt="TMC Logo" width={60} height={60} />
        </div>
      </div>

      <div className="px-2 md:px-12 py-8">
        <div className="flex items-center mb-3">
          <div className="border-t-2 border-color4 w-10 mr-3 ml-1"></div>
          <h1 className="text-color4 text-3xl font-bold">Tokeshare MarketCap 20</h1>
        </div>
        <p className="flex items-center text-color4 text-xl mb-6">
          <span className="mr-2">
            <FaChartLine />
          </span>
          Crypto Index Fund on Base
        </p>

        <div className="grid grid-cols-2 gap-6 text-color4 text-lg mb-8">
          <div className="flex flex-col gap-1">
            <span className="font-semibold">Index Type</span>
            <span>Top 20 by Market Cap</span>
            <span className="font-semibold mt-2">Rebalancing</span>
            <span>Monthly</span>
            <span className="font-semibold mt-2">Blockchain</span>
            <span>Base</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-semibold">Token Ratio</span>
            <span>1 TMC = 1/10 CMC20</span>
            <span className="font-semibold mt-2">Token Decimals</span>
            <span>18</span>
            <span className="font-semibold mt-2">Backed By</span>
            <span>CMC20 Index</span>
          </div>
        </div>

        <div className="bg-color2/20 rounded-xl p-6 mb-8">
          <div className="flex items-center gap-2 mb-2">
            <FaChartLine size={32} />
            <span className="font-bold text-xl">Diversified Exposure</span>
          </div>
          <div className="text-base ml-10 text-color4">
            Track the top 20 cryptocurrencies with a single token
          </div>
        </div>

        <div className="flex justify-center">
          <Link href="/marketplace/stock-etf/tmc">
            <button className="flex items-center justify-between bg-color2 rounded-3xl px-8 mt-4 text-xl w-72 hover:bg-color4 hover:text-white transition-colors duration-300 shadow-md font-semibold">
              <span className="text-color1 hover:text-white">Buy</span>
              <ArrowIcon size={32} className="text-white" />
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TMCCard;
