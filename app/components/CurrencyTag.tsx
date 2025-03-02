import React from 'react'
import ArrowDownIcon from './icons/arrows/ArrowDownIcon'
import EURIcon from './icons/currency/EURIcon'
import TGGIcon from './icons/currency/TGGIcon'
import CHFIcon from './icons/currency/CHFIcon'
import GBPIcon from './icons/currency/GBPIcon'
import CADIcon from './icons/currency/CADIcon'
import USDIcon from './icons/currency/USDIcon'
import USDTIcon from './icons/currency/USDTIcon'
import USDCIcon from './icons/currency/USDCIcon'
import DAIIcon from './icons/currency/DAIIcon'
import EURSIcon from './icons/currency/EURSIcon'
import CRVIcon from './icons/currency/CRVIcon'

const CurrencyTag = ({ currency, isOpenable}: { currency: string, isOpenable: boolean}) => {
  return (
    <div className="flex items-center gap-2 border border-color4 rounded-lg p-2">
        {currency === 'EUR' && <EURIcon />}
        {currency === 'TGG' && <TGGIcon />}
        {currency === 'CHF' && <CHFIcon />}
        {currency === 'GBP' && <GBPIcon />}
        {currency === 'CAD' && <CADIcon />}
        {currency === 'USD' && <USDIcon />}
        {currency === 'USDT' && <USDTIcon />}
        {currency === 'USDC' && <USDCIcon />}
        {currency === 'DAI' && <DAIIcon />}
        {currency === 'EURS' && <EURSIcon />}
        {currency === 'CRVUSD' && <CRVIcon />}
        <span className="font-medium text-color4">{currency}</span>
        {isOpenable && (
                <ArrowDownIcon />
        )}
    </div>
  )
}

export default CurrencyTag