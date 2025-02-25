import React from 'react'
import ArrowDownIcon from './icons/arrows/ArrowDownIcon'
import EURIcon from './icons/currency/EURIcon'
import TGGIcon from './icons/currency/TGGIcon'
import CHFIcon from './icons/currency/CHFIcon'
import GBPIcon from './icons/currency/GBPIcon'
import CADIcon from './icons/currency/CADIcon'
import USDIcon from './icons/currency/USDIcon'

const CurrencyTag = ({ currency, isOpenable}: { currency: string, isOpenable: boolean}) => {
  return (
    <div className="flex w-28 items-center gap-2 border border-color4 rounded-lg p-2">
        {currency === 'EUR' && <EURIcon />}
        {currency === 'TGG' && <TGGIcon />}
        {currency === 'CHF' && <CHFIcon />}
        {currency === 'GBP' && <GBPIcon />}
        {currency === 'CAD' && <CADIcon />}
        {currency === 'USD' && <USDIcon />}
        <span className="font-medium text-color4">{currency}</span>
        {isOpenable && (
                <ArrowDownIcon />
        )}
    </div>
  )
}

export default CurrencyTag