import React from 'react'
import Currencies from '../Currencies'

interface CurrencyPickerProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (currency: string) => void
}

const CurrencyPicker = ({ isOpen, onClose, onSelect }: CurrencyPickerProps) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-white/80 flex items-center justify-center z-50">
      <div className="bg-white p-4 rounded-xl shadow-md">
        <Currencies
          onSelect={(currency) => {
            onSelect(currency)
            onClose()
          }}
        />
        <button
          onClick={onClose}
          className="mt-4 px-3 py-2 bg-gray-200 rounded text-color4"
        >
          Close
        </button>
      </div>
    </div>
  )
}

export default CurrencyPicker 