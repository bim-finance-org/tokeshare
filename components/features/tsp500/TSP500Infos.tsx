'use client';

import React, { useState } from 'react';
import { useTSP500Data } from '@/hooks/useTSP500Data';
import { BASE_CONTRACTS } from '@/contracts/contracts';
import NewTabIcon from '@/components/icons/NewTabIcon';

const TSP500Infos = () => {
  const [activeTab, setActiveTab] = useState('DETAILS');
  const { price: tsp500Price, perf90d, isLoading } = useTSP500Data();

  const handleOnesheetClick = () => {
    // TODO: replace with real TSP500 onesheet PDF
    window.open('/TSP500_Onesheet.pdf', '_blank');
  };

  const tsp500Address = BASE_CONTRACTS.TSP500;
  const despxaAddress = BASE_CONTRACTS.DESPXA;

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
          <div className="bg-color4 text-white p-4 pl-6">
            <h2 className="text-lg font-semibold">BLOCKCHAIN</h2>
          </div>

          <div className="bg-color1 p-6">
            <div className="flex flex-col md:flex-row justify-between items-center pb-4">
              <div className="flex flex-col md:flex-row justify-between w-full md:pr-9 mb-4 md:mb-0">
                <h3 className="text-lg font-semibold">Identifier</h3>
                <p className="text-base mt-2 md:mt-0">Tokeshare S&amp;P500</p>
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
                    href={`https://basescan.org/address/${tsp500Address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm sm:text-base mt-1 sm:mt-0 text-blue-600 hover:underline cursor-pointer break-all"
                  >
                    {tsp500Address}
                  </a>
                </div>

                <div className="py-4 flex flex-col md:flex-row justify-between border-b-2 border-color5">
                  <h3 className="text-lg font-semibold">Underlying (deSPXA)</h3>
                  <a
                    href={`https://basescan.org/address/${despxaAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm sm:text-base mt-1 sm:mt-0 text-blue-600 hover:underline cursor-pointer break-all"
                  >
                    {despxaAddress}
                  </a>
                </div>

                <div className="py-4 flex flex-col md:flex-row justify-between">
                  <h3 className="text-lg font-semibold">Owner Wallet</h3>
                  <a
                    href={`https://basescan.org/address/${tsp500Address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm sm:text-base mt-1 sm:mt-0 text-blue-600 hover:underline cursor-pointer break-all"
                  >
                    {tsp500Address}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'DETAILS' && (
        <div className="w-full rounded-xl shadow-lg overflow-hidden text-color4 border-2 border-color4">
          <div className="bg-color4 text-white p-3 sm:p-4 pl-4 sm:pl-6">
            <h2 className="text-base sm:text-lg font-semibold">DETAILS</h2>
          </div>

          <div className="bg-color1 p-4 sm:p-6">
            <div className="space-y-3 sm:space-y-4">
              <div className="py-3 sm:py-4 flex flex-col sm:flex-row sm:justify-between border-b-2 border-color5">
                <h3 className="text-base sm:text-lg font-semibold text-color2">Token Type</h3>
                <p className="text-sm sm:text-base mt-1 sm:mt-0">S&amp;P500 Index Fund</p>
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
                  {isLoading ? 'Loading...' : `${tsp500Price?.toFixed(2) || 'N/A'} $`}
                </p>
              </div>

              <div className="py-3 sm:py-4 flex flex-col sm:flex-row sm:justify-between border-b-2 border-color5">
                <h3 className="text-base sm:text-lg font-semibold">Proof of Reserve</h3>
                <a
                  href={`https://basescan.org/address/${despxaAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm sm:text-base mt-1 sm:mt-0 text-blue-600 hover:underline cursor-pointer break-all"
                >
                  {despxaAddress}
                </a>
              </div>

              <div className="py-3 sm:py-4 flex flex-col sm:flex-row sm:justify-between">
                <h3 className="text-base sm:text-lg font-semibold">Tokeshare S&amp;P500 (TSP500)</h3>
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

export default TSP500Infos;
