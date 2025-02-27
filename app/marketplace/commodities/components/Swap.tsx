import React, { useState } from 'react'
import CurrencyInput from '../../../components/shared/CurrencyInput'
import CurrencyPicker from '../../../components/shared/CurrencyPicker'

const Swap = () => {
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false)
  const [selectedCurrency, setSelectedCurrency] = useState('EUR')
  return (
    <div className="p-6 bg-white rounded-3xl shadow-sm  w-full">
      <CurrencyInput
        label="YOU SEND"
        value="10"
        currency="TGG"
        onOpenCurrencyPicker={() => setShowCurrencyPicker(true)}  
      />

      <div className="relative my-4 flex justify-center">
        <button className="absolute top-1/2 -translate-y-1/2 shadow-md rounded-full p-2">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m-4 8v4m0 0l-4-4m4 4l4-4" />
          </svg>
        </button>
      </div>

      <CurrencyInput
        label="YOU RECEIVE"
        value="9.2444"
        currency="EUR"
        onOpenCurrencyPicker={() => setShowCurrencyPicker(true)}
      />

      <CurrencyPicker
        isOpen={showCurrencyPicker}
        onClose={() => setShowCurrencyPicker(false)}
        onSelect={setSelectedCurrency}
      />

      <div className="mt-6">
        <button className="w-full bg-color4 text-white py-3 rounded-xl font-medium">
          Next
        </button>
      </div>
    </div>
  )
}

export default Swap