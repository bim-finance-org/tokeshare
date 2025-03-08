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

const TokenDisplay = ({ token, isOpenable, onTokenClick}: { token: string, isOpenable: boolean, onTokenClick: () => void}) => {
  return (
    <div className="flex items-center gap-2 border border-color4 rounded-lg p-2" onClick={onTokenClick}>
        {token === 'EUR' && <EURIcon />}
        {token === 'TGG' && <TGGIcon />}
        {token === 'CHF' && <CHFIcon />}
        {token === 'GBP' && <GBPIcon />}
        {token === 'CAD' && <CADIcon />}
        {token === 'USD' && <USDIcon />}
        {token === 'USDT' && <USDTIcon />}
        {token === 'USDC' && <USDCIcon />}
        {token === 'DAI' && <DAIIcon />}
        {token === 'EURS' && <EURSIcon />}
        {token === 'CRVUSD' && <CRVIcon />}
        <span className="font-medium text-color4">{token}</span>
        {isOpenable && (
                <ArrowDownIcon />
        )}
    </div>
  )
}

export default TokenDisplay