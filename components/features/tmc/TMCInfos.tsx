'use client';

import React, { useState } from 'react';
import { useTMCData } from '@/hooks/useTMCData';
import CMC20PieChart from './CMC20PieChart';
import NewTabIcon from '@/components/icons/NewTabIcon';

const TMCInfos = () => {
  const [activeTab, setActiveTab] = useState('DETAILS');
  const { price: tmcPrice, perf90d, isLoading } = useTMCData();

  const handleOnesheetClick = () => {
    window.open('/TMC_Onesheet.pdf', '_blank');
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Tabs */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-4">
        <button
          onClick={() => setActiveTab('DETAILS')}
          className={`flex-1 py-2 sm:py-3 px-4 sm:px-6 rounded-xl text-base sm:text-lg font-medium transition-all duration-200 ${
            activeTab === 'DETAILS'
              ? 'bg-color4 text-white shadow-lg'
              : 'bg-gray-200 shadow-lg text-gray-500 border border-color4 hover:text-gray-700'
          }`}
        >
          DETAILS
        </button>
        <button
          onClick={() => setActiveTab('COMPOSITION')}
          className={`flex-1 py-2 sm:py-3 px-4 sm:px-6 rounded-xl text-base sm:text-lg font-medium transition-all duration-200 ${
            activeTab === 'COMPOSITION'
              ? 'bg-color4 text-white shadow-lg'
              : 'bg-gray-200 shadow-lg text-gray-500 border border-color4 hover:text-gray-700'
          }`}
        >
          COMPOSITION
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
      {activeTab === 'BLOCKCHAIN' && (
        <div className="w-full rounded-xl shadow-lg overflow-hidden text-color4 border-2 border-color4">
          {/* Header */}
          <div className="bg-color4 text-white p-4 pl-6">
            <h2 className="text-lg font-semibold">BLOCKCHAIN</h2>
          </div>

          {/* Content */}
          <div className="bg-color1 p-6">
            <div className="flex flex-col md:flex-row justify-between items-center pb-4">
              <div className="flex flex-col md:flex-row justify-between w-full md:pr-9 mb-4 md:mb-0">
                <h3 className="text-lg font-semibold">Identifier</h3>
                <p className="text-base mt-2 md:mt-0">Tokeshare MarketCap 20</p>
              </div>
            </div>

            <div className="border-t-2 border-color4">
              <div className="border-color4 md:pr-6">
                <div className="py-4 flex flex-col md:flex-row justify-between border-b-2 border-color5">
                  <h3 className="text-lg font-semibold text-color2">Base Chain</h3>
                  <p className="text-base mt-2 md:mt-0"></p>
                </div>

                <div className="py-4 flex flex-col md:flex-row justify-between border-b-2 border-color5">
                  <h3 className="text-lg font-semibold">Contract Address</h3>
                  <a
                    href="https://basescan.org/address/0xb9f78ce237e639C129BD6F26a32812361Ddf2584"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm sm:text-base mt-1 sm:mt-0 text-blue-600 hover:underline cursor-pointer break-all"
                  >
                    0xb9f78ce237e639C129BD6F26a32812361Ddf2584
                  </a>
                </div>

                <div className="py-4 flex flex-col md:flex-row justify-between">
                  <h3 className="text-lg font-semibold">Owner Wallet</h3>
                  <a
                    href="https://basescan.org/address/0xb9f78ce237e639C129BD6F26a32812361Ddf2584"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm sm:text-base mt-1 sm:mt-0 text-blue-600 hover:underline cursor-pointer break-all"
                  >
                    0xb9f78ce237e639C129BD6F26a32812361Ddf2584
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'COMPOSITION' && (
        <div className="w-full rounded-xl shadow-lg overflow-hidden text-color4 border-2 border-color4">
          {/* Header */}
          <div className="bg-color4 text-white p-3 sm:p-4 pl-4 sm:pl-6">
            <h2 className="text-base sm:text-lg font-semibold">INDEX COMPOSITION</h2>
          </div>

          {/* Content */}
          <div className="bg-color1 p-4 sm:p-6">
            <CMC20PieChart />
          </div>
        </div>
      )}

      {activeTab === 'DETAILS' && (
        <div className="w-full rounded-xl shadow-lg overflow-hidden text-color4 border-2 border-color4">
          {/* Header */}
          <div className="bg-color4 text-white p-3 sm:p-4 pl-4 sm:pl-6">
            <h2 className="text-base sm:text-lg font-semibold">DETAILS</h2>
          </div>

          {/* Content */}
          <div className="bg-color1 p-4 sm:p-6">
            <div className="space-y-3 sm:space-y-4">
              <div className="py-3 sm:py-4 flex flex-col sm:flex-row sm:justify-between border-b-2 border-color5">
                <h3 className="text-base sm:text-lg font-semibold text-color2">Token Type</h3>
                <p className="text-sm sm:text-base mt-1 sm:mt-0">Crypto Index</p>
              </div>

              <div className="py-3 sm:py-4 flex flex-col sm:flex-row sm:justify-between border-b-2 border-color5">
                <h3 className="text-base sm:text-lg font-semibold text-color2">Performance over 90 days</h3>
                {typeof perf90d === 'number' ? (
                  <h6
                    className={
                      'font-medium ' + (perf90d > 0 ? 'text-green-500' : perf90d < 0 ? 'text-red-500' : 'text-gray-500')
                    }
                  >
                    {(perf90d > 0 ? '+' : '') + perf90d.toFixed(2) + ' %'}
                  </h6>
                ) : (
                  <h6 className="font-medium text-gray-500">N/A</h6>
                )}
              </div>

              <div className="py-3 sm:py-4 flex flex-col sm:flex-row sm:justify-between border-b-2 border-color5">
                <h3 className="text-base sm:text-lg font-semibold">Token Price</h3>
                <p className="text-sm sm:text-base mt-1 sm:mt-0">
                  {isLoading ? 'Loading...' : `${tmcPrice?.toFixed(2) || 'N/A'} $`}
                </p>
              </div>

              <div className="py-3 sm:py-4 flex flex-col sm:flex-row sm:justify-between border-b-2 border-color5">
                <h3 className="text-base sm:text-lg font-semibold">Proof of Reserve</h3>
                <a
                  href="https://basescan.org/address/0xb9f78ce237e639C129BD6F26a32812361Ddf2584"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm sm:text-base mt-1 sm:mt-0 text-blue-600 hover:underline cursor-pointer break-all"
                >
                  0xb9f78ce237e639C129BD6F26a32812361Ddf2584
                </a>
              </div>

              <div className="py-3 sm:py-4 flex flex-col sm:flex-row sm:justify-between">
                <h3 className="text-base sm:text-lg font-semibold">Tokeshare MarketCap 20 (TMC)</h3>
                <div className="flex items-center gap-2 cursor-pointer mt-1 sm:mt-0" onClick={handleOnesheetClick}>
                  <button className="text-sm sm:text-base text-blue-500 hover:text-blue-600">Onesheet</button>
                  <NewTabIcon />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TMCInfos;
