import React from 'react'
import Currencies from '../Currencies'
import StableCoins from '../StableCoins'

interface TokenSelectorProps {
  type: 'fiat' | 'crypto' | 'stablecoin'
  blockchain?: string
  selectedToken: string
  onSelect: ( token: string) => void
  isOpen: boolean
  onClose: () => void
}

const TokenSelector = ({ isOpen, type, blockchain, selectedToken, onClose, onSelect }: TokenSelectorProps) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-2xl shadow-xl max-w-md w-full mx-4 transform transition-all duration-200">
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
        <button
          onClick={onClose}
          className="mt-4 w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-color4 font-medium transition-colors duration-200"
        >
          Close
        </button>
      </div>
    </div>
  )
}

export default TokenSelector 