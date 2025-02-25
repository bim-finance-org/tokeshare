import React from 'react'
import CurrencyInput from '../../../components/shared/CurrencyInput'

const Sell = () => {
  return (
    <div className="p-6 bg-white rounded-3xl shadow-sm w-full">
      <button className="w-full bg-blue-600 text-white py-3 rounded-xl mb-6 flex items-center justify-center gap-2">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6h18M3 12h18M3 18h18" />
        </svg>
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
        currency="Euro"
      />

      <div className="mt-6">
        <button className="w-full bg-black text-white py-3 rounded-xl font-medium">
          Next
        </button>
      </div>
    </div>
  )
}

export default Sell