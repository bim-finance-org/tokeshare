'use client';

import React, { useState } from 'react';
import Blockchain from '@/components/features/real-estate/sections/Blockchain';
import NewTabIcon from '@/components/icons/NewTabIcon';
import { useTokenPrice } from '@/hooks/useTokenPrice';
import { useCommodityData } from '@/hooks/useCommodityData';

export interface CommoditiesInfosProps {
  /** Token symbol used to resolve the per-gram price (TGG, TSG, …). */
  tokenSymbol: string;
  /** Commodity name used to resolve performance data (Gold, Silver, …). */
  commodityName: string;
  /** Full display name, e.g. "Tokeshare Gold Gram (TGG)". */
  fullName: string;
  /** Proof-of-reserve address shown in the details panel. */
  proofOfReserveAddress: string;
  /** Explorer URL for the proof-of-reserve address. */
  proofOfReserveUrl: string;
  /** Optional onesheet PDF URL; the row is hidden when absent. */
  onesheetUrl?: string;
}

const CommoditiesInfos = ({
  tokenSymbol,
  commodityName,
  fullName,
  proofOfReserveAddress,
  proofOfReserveUrl,
  onesheetUrl,
}: CommoditiesInfosProps) => {
  const [activeTab, setActiveTab] = useState('DETAILS');
  const { price } = useTokenPrice(tokenSymbol);
  const { perf1y } = useCommodityData(commodityName);
  const perf1yValue = perf1y?.perf1y;

  const handleOnesheetClick = () => {
    if (onesheetUrl) window.open(onesheetUrl, '_blank');
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Tabs */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-4">
        <button type="button"
          onClick={() => setActiveTab('DETAILS')}
          className={`flex-1 py-2 sm:py-3 px-4 sm:px-6 rounded-xl text-base sm:text-lg font-medium transition-all duration-200 ${
            activeTab === 'DETAILS'
              ? 'bg-color4 text-white shadow-lg'
              : 'bg-gray-200 shadow-lg text-gray-500 border border-color4 hover:text-gray-700'
          }`}
        >
          DETAILS
        </button>
        <button type="button"
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
        <Blockchain />
      ) : (
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
                <p className="text-sm sm:text-base mt-1 sm:mt-0">Commodities</p>
              </div>

              <div className="py-3 sm:py-4 flex flex-col sm:flex-row sm:justify-between border-b-2 border-color5">
                <h3 className="text-base sm:text-lg font-semibold text-color2">Performance over 1 year</h3>
                {typeof perf1yValue === 'number' ? (
                  <h6
                    className={
                      'font-medium ' +
                      (perf1yValue > 0 ? 'text-green-500' : perf1yValue < 0 ? 'text-red-500' : 'text-gray-500')
                    }
                  >
                    {(perf1yValue > 0 ? '+' : perf1yValue < 0 ? '' : '') + perf1yValue.toFixed(2) + ' %'}
                  </h6>
                ) : (
                  <h6 className="font-medium text-gray-500">N/A</h6>
                )}
              </div>

              <div className="py-3 sm:py-4 flex flex-col sm:flex-row sm:justify-between border-b-2 border-color5">
                <h3 className="text-base sm:text-lg font-semibold">Token Price</h3>
                <p className="text-sm sm:text-base mt-1 sm:mt-0"> {price != null ? price.toFixed(2) : '—'} $</p>
              </div>

              <div className="py-3 sm:py-4 flex flex-col sm:flex-row sm:justify-between border-b-2 border-color5">
                <h3 className="text-base sm:text-lg font-semibold">Proof of Reserve</h3>
                <a
                  href={proofOfReserveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm sm:text-base mt-1 sm:mt-0 text-blue-600 hover:underline cursor-pointer break-all"
                >
                  {proofOfReserveAddress}
                </a>
              </div>

              <div className="py-3 sm:py-4 flex flex-col sm:flex-row sm:justify-between">
                <h3 className="text-base sm:text-lg font-semibold">{fullName}</h3>
                {onesheetUrl && (
                  <div className="flex items-center gap-2 cursor-pointer mt-1 sm:mt-0" onClick={handleOnesheetClick}>
                    <button type="button" className="text-sm sm:text-base text-blue-500 hover:text-blue-600">Onesheet</button>
                    <NewTabIcon />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommoditiesInfos;
