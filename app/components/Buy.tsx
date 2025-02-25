import React, { useState } from 'react'
import CurrencyInput from './shared/CurrencyInput'

const Buy = () => {
  return (
    <div className="p-6 w-full">
      {/* ... */}
      <CurrencyInput
        label="YOU SEND"
        value="10"
        currency="EUR"
      />

      <div className="my-4" />

      <CurrencyInput
        label="YOU RECEIVE"
        value="9.2444"
        currency="TGG"
        isSelectable={false}
      />
      {/* ... */}
    </div>
  )
}

export default Buy 