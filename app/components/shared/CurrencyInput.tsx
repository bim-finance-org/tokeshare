import React, { ReactNode } from 'react'
import CurrencyTag from '../CurrencyTag'

interface CurrencyInputProps {
  label: string
  value: string
  currency: string
  isSelectable?: boolean
  onChangeValue?: (val: string) => void
  onOpenCurrencyPicker?: () => void
}

const CurrencyInput = ({
  label,
  value,
  currency,
  isSelectable = true,
  onChangeValue,
  onOpenCurrencyPicker,
}: CurrencyInputProps) => {
  return (
    <div className="bg-gray-100 p-4 rounded-xl shadow-lg">
      <p className="text-color4 text-lg mb-2">{label}</p>
      <div className="flex justify-between items-center">
        <input
          type="text"
          value={value}
          onChange={(e) => onChangeValue?.(e.target.value)}
          className="bg-transparent text-2xl text-color4 font-medium outline-none w-1/2"
        />
        <div onClick={() => isSelectable && onOpenCurrencyPicker?.()}>
          <CurrencyTag currency={currency} isOpenable={isSelectable}/>
        </div>
      </div>
    </div>
  )
}

export default CurrencyInput
