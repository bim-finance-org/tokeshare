import React, { useState } from 'react';
import Blockchain from '@/components/marketplace/real-estate/sections/Blockchain';
import NewTabIcon from '@/components/icons/NewTabIcon';
import { usePaxgPrice } from '@/hooks/usePaxgPrice';
import { calculateTGGPrice } from '@/utils/priceUtils';
import { usePaxgPerformance } from '@/hooks/useGetPaxgPerf';
import { Period } from '@/enums/Period';

const CommoditiesPage = () => {
  const [activeTab, setActiveTab] = useState('DETAILS');
  const { data: paxgPrice, isLoading } = usePaxgPrice();  

  const { data: perf1y, isLoading: isLoadingPerf1y, error: error1y } = usePaxgPerformance(Period.OneYear);

  const handleOnesheetClick = () => {
    window.open('/TGG_Onesheet.pdf', '_blank');
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
                {typeof perf1y?.perf1y === "number" ? (
                <h6
                  className={
                    "font-medium " +
                    (perf1y.perf1y > 0
                      ? "text-green-500"
                      : perf1y.perf1y < 0
                      ? "text-red-500"
                      : "text-gray-500")
                  }
                >
                  {(perf1y.perf1y > 0 ? "+" : perf1y.perf1y < 0 ? "" : "") +
                    perf1y.perf1y.toFixed(2) + " %"}
                </h6>
              ) : (
                <h6 className="font-medium text-gray-500">N/A</h6>
              )}
              </div>

              <div className="py-3 sm:py-4 flex flex-col sm:flex-row sm:justify-between border-b-2 border-color5">
                <h3 className="text-base sm:text-lg font-semibold">Token Price</h3>
                <p className="text-sm sm:text-base mt-1 sm:mt-0"> {calculateTGGPrice(paxgPrice).toFixed(2)} $</p>
              </div>

              <div className="py-3 sm:py-4 flex flex-col sm:flex-row sm:justify-between border-b-2 border-color5">
                <h3 className="text-base sm:text-lg font-semibold">Proof of Reserve</h3>
                 <a
    href="https://polygonscan.com/address/0x3d4Df7BD7Ea3f305Ac3A4065019B96d382834B71"
    target="_blank"
    rel="noopener noreferrer"
    className="text-sm sm:text-base mt-1 sm:mt-0 text-blue-600 hover:underline cursor-pointer break-all"
  >
    0x3d4Df7BD7Ea3f305Ac3A4065019B96d382834B71
  </a>
              </div>

              <div className="py-3 sm:py-4 flex flex-col sm:flex-row sm:justify-between">
                <h3 className="text-base sm:text-lg font-semibold">Tokeshare Gold Gram (TGG)</h3>
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

export default CommoditiesPage;
