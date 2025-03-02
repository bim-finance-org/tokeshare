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
    <div className="p-6 bg-white rounded-3xl shadow-sm w-full">
      <button className="w-full bg-blue-600 text-white py-3 rounded-xl mb-6 flex items-center justify-center gap-2">
        <BankIcon />
        Bank transfer
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

      <Blockchains section="sell" />

      <div className="mt-6">
        <button className="w-full bg-black text-white py-3 rounded-xl font-medium">
          Sell
        </button>
      </div>


    </div>
  )
}

export default Sell