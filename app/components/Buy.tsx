import React, { useState } from 'react'
import CurrencyInput from './shared/CurrencyInput'
import CurrencyPicker from './shared/CurrencyPicker'

const Buy = () => {
  const [selectedCurrency, setSelectedCurrency] = useState('EUR')
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false)

  return (
    <div className="p-6 w-full">
      {/* ... */}
      <CurrencyInput
        label="YOU SEND"
        value="10"
        currency={selectedCurrency}
        onOpenCurrencyPicker={() => setShowCurrencyPicker(true)}
      />

      <div className="my-4" />

      <CurrencyInput
        label="YOU RECEIVE"
        value="9.2444"
        currency="TGG"
        isSelectable={false}
      />

      <CurrencyPicker
        isOpen={showCurrencyPicker}
        onClose={() => setShowCurrencyPicker(false)}
        onSelect={setSelectedCurrency}
      />
      {/* ... */}
    </div>
  )
}

export default Buy 