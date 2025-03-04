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
  disabled?: boolean
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
  disabled = false,
  onChangeValue,
  onCurrencySelect,
}: CurrencyInputProps) => {
  const [showCurrencyPicker, setShowCurrencyPicker] = React.useState(false)

  return (
    <div className="relative">
      <div className={`bg-gray-100 p-4 rounded-xl shadow-md transition-all duration-200 ${!disabled && 'hover:shadow-lg'}`}>
        <p className="text-color4 text-lg mb-3 font-medium">{label}</p>
        <div className="flex justify-between items-center gap-4">
          <input
            type="text"
            value={value}
            onChange={(e) => onChangeValue?.(e.target.value)}
            disabled={disabled}
            className={`bg-transparent text-2xl text-color4 font-medium outline-none w-1/2 px-2 py-1 transition-all duration-200 `}
          />
          <div 
            onClick={() => isSelectable && !disabled && setShowCurrencyPicker(true)}
            className={isSelectable && !disabled ? 'cursor-pointer transform hover:scale-[1.02] active:scale-[0.98] transition-transform duration-200' : ' opacity-80'}
          >
            <CurrencyTag currency={currency} isOpenable={isSelectable && !disabled}/>
          </div>
        </div>
      </div>

      {showCurrencyPicker && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl shadow-xl max-w-md w-full mx-4 transform transition-all duration-200">
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
              className="mt-4 w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-color4 font-medium transition-colors duration-200"
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
