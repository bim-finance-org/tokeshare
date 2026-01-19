'use client';

import React, { useState } from 'react';
import { useTokenPrice } from '@/hooks/useTokenPrice';

const TMCInfos = () => {
  const [activeTab, setActiveTab] = useState('TOKEN');
  const { price: tmcPrice, isLoading } = useTokenPrice('TMC');

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Tabs */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-4">
        <button
          onClick={() => setActiveTab('TOKEN')}
          className={`flex-1 py-2 sm:py-3 px-4 sm:px-6 rounded-xl text-base sm:text-lg font-medium transition-all duration-200 ${
            activeTab === 'TOKEN'
              ? 'bg-color4 text-white shadow-lg'
              : 'bg-gray-200 shadow-lg text-gray-500 border border-color4 hover:text-gray-700'
          }`}
        >
          TOKEN
        </button>
        <button
          onClick={() => setActiveTab('BLOCKCHAIN')}
          className={`flex-1 py-2 sm:py-3 px-4 sm:px-6 rounded-xl text-base sm:text-lg font-medium transition-all duration-200 ${
            activeTab === 'BLOCKCHAIN'
              ? 'bg-color4 text-white shadow-lg'
              : 'bg-gray-200 shadow-lg text-gray-500 border border-color4 hover:text-gray-700'
          }`}
        >
          BLOCKCHAIN
        </button>
      </div>

      {/* Content */}
      {activeTab === 'BLOCKCHAIN' ? (
        <div className="w-full rounded-xl shadow-lg overflow-hidden text-color4 border-2 border-color4">
          {/* Header */}
          <div className="bg-color4 text-white p-3 sm:p-4 pl-4 sm:pl-6">
            <h2 className="text-base sm:text-lg font-semibold">BLOCKCHAIN</h2>
          </div>

          {/* Content */}
          <div className="bg-color1 p-4 sm:p-6">
            <div className="space-y-3 sm:space-y-4">
              <div className="py-3 sm:py-4 flex flex-col sm:flex-row sm:justify-between border-b-2 border-color5">
                <h3 className="text-base sm:text-lg font-semibold text-color2">Network</h3>
                <p className="text-sm sm:text-base mt-1 sm:mt-0">Base</p>
              </div>

              <div className="py-3 sm:py-4 flex flex-col sm:flex-row sm:justify-between border-b-2 border-color5">
                <h3 className="text-base sm:text-lg font-semibold">Contract Address</h3>
                <a
                  href="https://basescan.org/address/0xb9f78ce237e639C129BD6F26a32812361Ddf2584"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm sm:text-base mt-1 sm:mt-0 text-blue-600 hover:underline cursor-pointer break-all"
                >
                  0xb9f78ce237e639C129BD6F26a32812361Ddf2584
                </a>
              </div>

              <div className="py-3 sm:py-4 flex flex-col sm:flex-row sm:justify-between border-b-2 border-color5">
                <h3 className="text-base sm:text-lg font-semibold">ZAP Contract</h3>
                <a
                  href="https://basescan.org/address/0x721c807C56c68D2818662C8Bc316a6730CCe44c9"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm sm:text-base mt-1 sm:mt-0 text-blue-600 hover:underline cursor-pointer break-all"
                >
                  0x721c807C56c68D2818662C8Bc316a6730CCe44c9
                </a>
              </div>

              <div className="py-3 sm:py-4 flex flex-col sm:flex-row sm:justify-between">
                <h3 className="text-base sm:text-lg font-semibold">Token Standard</h3>
                <p className="text-sm sm:text-base mt-1 sm:mt-0">ERC-20</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="w-full rounded-xl shadow-lg overflow-hidden text-color4 border-2 border-color4">
          {/* Header */}
          <div className="bg-color4 text-white p-3 sm:p-4 pl-4 sm:pl-6">
            <h2 className="text-base sm:text-lg font-semibold">TOKEN</h2>
          </div>

          {/* Content */}
          <div className="bg-color1 p-4 sm:p-6">
            <div className="space-y-3 sm:space-y-4">
              <div className="py-3 sm:py-4 flex flex-col sm:flex-row sm:justify-between border-b-2 border-color5">
                <h3 className="text-base sm:text-lg font-semibold text-color2">Token Type</h3>
                <p className="text-sm sm:text-base mt-1 sm:mt-0">Crypto Index</p>
              </div>

              <div className="py-3 sm:py-4 flex flex-col sm:flex-row sm:justify-between border-b-2 border-color5">
                <h3 className="text-base sm:text-lg font-semibold">Token Name</h3>
                <p className="text-sm sm:text-base mt-1 sm:mt-0">Tokeshare MarketCap 20 Index</p>
              </div>

              <div className="py-3 sm:py-4 flex flex-col sm:flex-row sm:justify-between border-b-2 border-color5">
                <h3 className="text-base sm:text-lg font-semibold">Token Symbol</h3>
                <p className="text-sm sm:text-base mt-1 sm:mt-0">TMC</p>
              </div>

              <div className="py-3 sm:py-4 flex flex-col sm:flex-row sm:justify-between border-b-2 border-color5">
                <h3 className="text-base sm:text-lg font-semibold">Token Price</h3>
                <p className="text-sm sm:text-base mt-1 sm:mt-0">
                  {isLoading ? 'Loading...' : `$${tmcPrice?.toFixed(2) || 'N/A'}`}
                </p>
              </div>

              <div className="py-3 sm:py-4 flex flex-col sm:flex-row sm:justify-between border-b-2 border-color5">
                <h3 className="text-base sm:text-lg font-semibold">Token Ratio</h3>
                <p className="text-sm sm:text-base mt-1 sm:mt-0">1 TMC = 1/10 CMC20 Index</p>
              </div>

              <div className="py-3 sm:py-4 flex flex-col sm:flex-row sm:justify-between border-b-2 border-color5">
                <h3 className="text-base sm:text-lg font-semibold">Decimals</h3>
                <p className="text-sm sm:text-base mt-1 sm:mt-0">18</p>
              </div>

              <div className="py-3 sm:py-4 flex flex-col sm:flex-row sm:justify-between">
                <h3 className="text-base sm:text-lg font-semibold">Rebalancing</h3>
                <p className="text-sm sm:text-base mt-1 sm:mt-0">Monthly</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TMCInfos;
