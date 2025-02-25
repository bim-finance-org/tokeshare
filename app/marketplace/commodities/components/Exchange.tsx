'use client'

import React, { useState } from 'react'
import Buy from '@/app/marketplace/commodities/components/Buy'
import Sell from '@/app/marketplace/commodities/components/Sell'
import Swap from '@/app/marketplace/commodities/components/Swap'

const Exchange = () => {
  const [activeTab, setActiveTab] = useState('swap')

  return (
    <div className="flex flex-col items-center bg-gray-100 rounded-xl overflow-hidden max-w-lg w-full mx-auto">
      <div className="flex w-full border-b border-gray-200">
        <button 
          onClick={() => setActiveTab('swap')}
          className={`flex-1 px-4 py-3 text-center ${
            activeTab === 'swap' 
              ? 'border-b-2 border-color2 text-color2' 
              : 'text-color4'
          }`}
        >
          Swap
        </button>
        <button 
          onClick={() => setActiveTab('buy')}
          className={`flex-1 px-4 py-3 text-center ${
            activeTab === 'buy' 
              ? 'border-b-2 border-color2 text-color2' 
              : 'text-color4'
          }`}
        >
          Buy
        </button>
        <button 
          onClick={() => setActiveTab('sell')}
          className={`flex-1 px-4 py-3 text-center ${
            activeTab === 'sell' 
              ? 'border-b-2 border-color2 text-color2' 
              : 'text-color4'
          }`}
        >
          Sell
        </button>
      </div>

      <div className="p-4 w-full">
        {activeTab === 'swap' && <Swap />}
        {activeTab === 'buy' && <Buy />}
        {activeTab === 'sell' && <Sell />}
      </div>
    </div>
  )
}

export default Exchange