import React from 'react'
import Currencies from '../Currencies'
import StableCoins from '../StableCoins'

interface TokenSelectorProps {
  type: 'fiat' | 'crypto' | 'stablecoin'
  blockchain?: string
  onSelect: (token: string) => void
  isOpen: boolean
  onClose: () => void
}

const TokenSelector = ({ isOpen, type, blockchain, onClose, onSelect }: TokenSelectorProps) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="bg-gray-100 p-6 rounded-3xl shadow-2xl max-w-lg w-full mx-4 transform transition-all duration-300 hover:shadow-3xl">
        <div className="mb-6">
          {type === 'fiat' ? (
            <Currencies
              onSelect={(currency) => {
                onSelect(currency)
                onClose()
              }}
            />
          ) : (
            <StableCoins
              blockchain={blockchain || ""}
              onSelect={(currency) => {
                onSelect(currency)
                onClose()
              }}
            />
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full bg-color4 text-white py-3 rounded-xl font-medium shadow-sm hover:bg-opacity-90 transition-all duration-200"
        >
          Close
        </button>
      </div>
    </div>
  )
}

export default TokenSelector