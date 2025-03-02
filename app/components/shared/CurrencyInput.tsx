import React from 'react'
import CurrencyTag from '../CurrencyTag'
import Currencies from '../Currencies'
import StableCoins from '../StableCoins'

interface CurrencyInputProps {
  label: string
  value: string
  currency: string
  isSelectable?: boolean
  type?: 'currency' | 'stablecoin'
  blockchain?: string
  onChangeValue?: (val: string) => void
  onCurrencySelect?: (currency: string) => void
}

const CurrencyInput = ({
  label,
  value,
  currency,
  isSelectable = true,
  type = 'currency',
  blockchain = 'Polygon',
  onChangeValue,
  onCurrencySelect,
}: CurrencyInputProps) => {
  const [showCurrencyPicker, setShowCurrencyPicker] = React.useState(false)

  return (
    <div className="relative">
      <div className="bg-gray-100 p-4 rounded-xl shadow-lg">
        <p className="text-color4 text-lg mb-2">{label}</p>
        <div className="flex justify-between items-center">
          <input
            type="text"
            value={value}
            onChange={(e) => onChangeValue?.(e.target.value)}
            className="bg-transparent text-2xl text-color4 font-medium outline-none w-1/2"
          />
          <div onClick={() => isSelectable && setShowCurrencyPicker(true)}>
            <CurrencyTag currency={currency} isOpenable={isSelectable}/>
          </div>
        </div>
      </div>

      {showCurrencyPicker && (
        <div className="fixed inset-0 bg-white/80 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-xl shadow-md">
            {type === 'currency' ? (
              <Currencies
                onSelect={(selectedCurrency) => {
                  onCurrencySelect?.(selectedCurrency)
                  setShowCurrencyPicker(false)
                }}
              />
            ) : (
              <StableCoins
                onSelect={(selectedCurrency) => {
                  onCurrencySelect?.(selectedCurrency)
                  setShowCurrencyPicker(false)
                }}
                blockchain={blockchain}
              />
            )}
            <button
              onClick={() => setShowCurrencyPicker(false)}
              className="mt-4 px-3 py-2 bg-gray-200 rounded text-color4"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default CurrencyInput
