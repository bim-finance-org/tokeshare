'use client'

import React, { useState } from 'react'
import Buy from '@/app/marketplace/commodities/components/Buy'
import Sell from '@/app/marketplace/commodities/components/Sell'
import Swap from '@/app/marketplace/commodities/components/Swap'

const Exchange = () => {
  const [activeTab, setActiveTab] = useState('swap')

  return (
    <div className="flex flex-col items-center bg-gray-100 rounded-xl overflow-hidden w-full mx-auto max-w-md sm:max-w-lg">
      <div className="flex w-full border-b border-gray-200">
        <button 
          onClick={() => setActiveTab('swap')}
          className={`flex-1 px-2 sm:px-4 py-2 sm:py-3 text-center text-sm sm:text-base ${
            activeTab === 'swap' 
              ? 'border-b-2 border-color2 text-color2 font-medium' 
              : 'text-color4'
          }`}
        >
          Swap
        </button>
        <button 
          onClick={() => setActiveTab('buy')}
          className={`flex-1 px-2 sm:px-4 py-2 sm:py-3 text-center text-sm sm:text-base ${
            activeTab === 'buy' 
              ? 'border-b-2 border-color2 text-color2 font-medium' 
              : 'text-color4'
          }`}
        >
          Buy
        </button>
        <button 
          onClick={() => setActiveTab('sell')}
          className={`flex-1 px-2 sm:px-4 py-2 sm:py-3 text-center text-sm sm:text-base ${
            activeTab === 'sell' 
              ? 'border-b-2 border-color2 text-color2 font-medium' 
              : 'text-color4'
          }`}
        >
          Sell
        </button>
      </div>

      <div className="p-2 sm:p-4 w-full">
        {activeTab === 'swap' && <Swap />}
        {activeTab === 'buy' && <Buy />}
        {activeTab === 'sell' && <Sell />}
      </div>
    </div>
  )
}

export default Exchange