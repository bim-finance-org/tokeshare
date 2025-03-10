import React, { useState } from 'react';
import Blockchain from '../../real-estate/[id]/components/sections/Blockchain';
import NewTabIcon from '@/app/components/icons/NewTabIcon';

const CommoditiesPage = () => {
  const [activeTab, setActiveTab] = useState('DETAILS');

  const handleOnesheetClick = () => {
    window.open('/TGG_Onesheet.pdf', '_blank');
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Tabs */}
      <div className="flex gap-4 mb-4">
        <button
          onClick={() => setActiveTab('DETAILS')}
          className={`flex-1 py-3 px-6 rounded-xl text-lg font-medium transition-all duration-200 ${
            activeTab === 'DETAILS'
              ? 'bg-color4 text-white shadow-lg'
                : 'bg-gray-200 shadow-lg text-gray-500 border border-color4 hover:text-gray-700'
          }`}
        >
          DETAILS
        </button>
        <button
          onClick={() => setActiveTab('BLOCKCHAIN')}
          className={`flex-1 py-3 px-6 rounded-xl text-lg font-medium transition-all duration-200 ${
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
          <div className="bg-color4 text-white p-4 pl-6">
            <h2 className="text-lg font-semibold">DETAILS</h2>
          </div>

          {/* Content */}
          <div className="bg-color1 p-6">
            <div className="space-y-4">
              <div className="py-4 flex justify-between border-b-2 border-color5">
                <h3 className="text-lg font-semibold text-color2">Token Type</h3>
                <p className="text-base">Commodities</p>
              </div>

              <div className="py-4 flex justify-between border-b-2 border-color5">
                <h3 className="text-lg font-semibold text-color2">Performance over 1 year</h3>
                <p className="text-base text-green-500">+ 37.32 %</p>
              </div>

              <div className="py-4 flex justify-between border-b-2 border-color5">
                <h3 className="text-lg font-semibold">Token Price</h3>
                <p className="text-base">$ 50.47</p>
              </div>

              <div className="py-4 flex justify-between border-b-2 border-color5">
                <h3 className="text-lg font-semibold">Proof of Reserve</h3>
                <p className="text-base">0x0c...f80</p>
              </div>

              <div className="py-4 flex justify-between">
                <h3 className="text-lg font-semibold">Tokeshare Gold Gram (TGG)</h3>
                <div className="flex items-center gap-2 cursor-pointer" onClick={handleOnesheetClick}>
                <button className="text-base text-blue-500 hover:text-blue-600 ">Onesheet</button>
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
