import React, { useState, useEffect } from 'react'
import CurrencyInput from '../../../components/shared/CurrencyInput'
import BankIcon from '@/app/components/icons/BankIcon'
import Blockchains from '@/app/components/Blockchains'

const Sell = () => {
  // Initialize with localStorage value or default
  const [selectedCurrency, setSelectedCurrency] = useState(() =>
    localStorage.getItem('sellSelectedCurrency') || 'EUR'
  )
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false)

  // Save currency to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('sellSelectedCurrency', selectedCurrency)
  }, [selectedCurrency])

  return (
    <div className="p-6 bg-white rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 w-full">
      <button className="w-full bg-blue-600 text-white py-3 rounded-xl mb-6 flex items-center justify-center gap-3 shadow-md">
        <BankIcon />
        <span className="font-medium">Bank transfer</span>
      </button>

      <CurrencyInput
        label="YOU SEND"
        value="10"
        currency="TGG"
        isSelectable={false}
      />

      <div className="my-4" />

      <CurrencyInput
        label="YOU RECEIVE"
        value="9.2444"
        currency={selectedCurrency}
        onCurrencySelect={setSelectedCurrency}
        isSelectable={true}
      />

      <div className="mb-6 mt-4 space-y-2">
        <Blockchains section="sell" />
        <div className="space-y-1 ml-2">
          <p className="text-color4 text-sm font-medium">Exchange rate: 1.13773446</p>
          <p className="text-color4 text-sm font-medium">Delivery time: 0 - 2 Days</p>
        </div>
      </div>

      <div className="mt-6">
        <button className="w-full bg-black text-white py-3 rounded-xl font-medium shadow-md hover:shadow-lg transform transition-all duration-200 hover:bg-opacity-80 hover:scale-[1.02] active:scale-[0.98]">
          Sell
        </button>
      </div>
    </div>
  )
}

export default Sell