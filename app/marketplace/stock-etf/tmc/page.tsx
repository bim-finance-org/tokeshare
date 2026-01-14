'use client';

import React from 'react';
import Exchange from '@/components/features/commodities/Exchange';
import Contracts from '@/components/shared/Contracts';
import Image from 'next/image';
import { BASE_CONTRACTS } from '@/contracts/contracts';
import { TOKENS } from '@/config/token';

const TMCPage = () => {
  return (
    <div className="max-w-6xl mx-auto py-6 sm:py-8 md:py-12 px-4 sm:px-6">
      <div className="space-y-6 sm:space-y-8">
        {/* Header Section */}
        <div className="bg-white/5 rounded-2xl p-4 sm:p-6 backdrop-blur-sm">
          <div className="flex flex-col items-center justify-between mb-4 sm:mb-6 md:flex-row gap-4">
            <h1 className="text-2xl sm:text-3xl text-color4 font-semibold text-center md:text-left">
              Tokeshare MarketCap 20 Index (TMC)
            </h1>
            <Contracts baseContract={BASE_CONTRACTS.TMC} />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12 p-4 sm:p-6">
            <div className="relative">
              <Image src="/images/currencies/tmc.png" alt="TMC Logo" width={120} height={120} />
            </div>
            <div className="relative mt-4 sm:mt-0">
              <Image src="/images/img-cmc20.webp" alt="CMC20 Index" width={200} height={200} className="rounded-xl" />
            </div>
          </div>
        </div>

        {/* Trading Section */}
        <div className="bg-white/5 rounded-2xl backdrop-blur-sm p-4 sm:p-6">
          <h2 className="text-center text-2xl sm:text-3xl text-color4 font-semibold mb-4 sm:mb-8">
            Trade TMC
            <span className="block text-base sm:text-lg text-color4/80 mt-2 font-normal">
              Buy, Sell, or Swap Tokeshare MarketCap 20 Index
            </span>
          </h2>
          <Exchange token={TOKENS['TMC']} />
        </div>
      </div>

      {/* Info Section */}
      <div className="pt-6 sm:pt-8 md:pt-12">
        <div className="bg-white/5 rounded-2xl backdrop-blur-sm p-4 sm:p-6">
          <h3 className="text-xl sm:text-2xl text-color4 font-semibold mb-4">About TMC</h3>
          <div className="space-y-4 text-color4/80">
            <p>
              The Tokeshare MarketCap 20 Index (TMC) is a tokenized representation of the CoinMarketCap 20 Index, which
              tracks the performance of the top 20 cryptocurrencies by market capitalization.
            </p>
            <p>
              TMC provides diversified exposure to the crypto market through a single token, similar to how traditional
              index funds work in the stock market. The index excludes stablecoins and wrapped tokens to focus on native
              crypto assets.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div className="bg-color1/50 rounded-lg p-4">
                <h4 className="font-semibold text-color4 mb-2">Key Features</h4>
                <ul className="list-disc list-inside text-sm space-y-1">
                  <li>Tracks top 20 cryptos by market cap</li>
                  <li>Monthly rebalancing</li>
                  <li>Instant swaps on Base network</li>
                  <li>1 TMC = 1/10 CMC20 Index value</li>
                </ul>
              </div>
              <div className="bg-color1/50 rounded-lg p-4">
                <h4 className="font-semibold text-color4 mb-2">Network Info</h4>
                <ul className="list-disc list-inside text-sm space-y-1">
                  <li>Network: Base</li>
                  <li>Token Decimals: 18</li>
                  <li>Backed by CMC20 token</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TMCPage;
