import React from 'react'
import USDTIcon from './icons/currency/USDTIcon'
import USDCIcon from './icons/currency/USDCIcon'
import DAIIcon from './icons/currency/DAIIcon'
import EURSIcon from './icons/currency/EURSIcon'
import CRVIcon from './icons/currency/CRVIcon'
// import EURCIcon from './icons/currency/EURCIcon'
// import BOLDIcon from './icons/currency/BOLDIcon'
// import USDCEIcon from './icons/currency/USDCEIcon'
interface StableCoinsProps {
  onSelect: (currency: string) => void
  blockchain: string
}

// Define which stablecoins are available on each blockchain
const BLOCKCHAIN_STABLECOINS = {
//   Polygon: ['USDT', 'USDC', 'DAI', 'EURS', 'CRVUSD', 'EURA','USDCE'],
//   Base: ['USDC', 'DAI','EURC', 'CRVUSD', 'BOLD']
  Polygon: ['USDT', 'USDC', 'DAI', 'EURS', 'CRVUSD', 'EURA'],
  Base: ['USDC', 'DAI', 'CRVUSD']
}

const StableCoins = ({ onSelect, blockchain }: StableCoinsProps) => {
  const availableStablecoins = BLOCKCHAIN_STABLECOINS[blockchain as keyof typeof BLOCKCHAIN_STABLECOINS] || []

  const renderStablecoinButton = (symbol: string) => {
    const icons = {
      USDT: USDTIcon,
      USDC: USDCIcon,
      DAI: DAIIcon,
      EURS: EURSIcon,
      CRVUSD: CRVIcon,
    //   EURC: EURCIcon,
    //   BOLD: BOLDIcon,
      EURA: EURSIcon,
    //   USDCE: USDCEIcon,
    }
    const Icon = icons[symbol as keyof typeof icons]
    
    return (
      <button 
        key={symbol}
        onClick={() => onSelect(symbol)} 
        className='flex items-center w-full p-2 hover:bg-gray-100 rounded-lg transition-colors border-b border-gray-200'
      >
        <div className='flex items-center gap-3'>
          <Icon  />
          <span className='text-color4 font-medium'>{symbol}</span>
        </div>
      </button>
    )
  }

  return (
    <div>
      <h1 className='text-2xl text-color2 font-bold border-b-2 border-color2 pb-2'>Select a Stablecoin</h1>
      <h2 className='text-lg text-color2 font-bold mt-4 mb-2'>Available on {blockchain}</h2>
      <div className='flex flex-col gap-1 min-w-[200px]'>
        {availableStablecoins.map(renderStablecoinButton)}
      </div>
    </div>
  )
}

export default StableCoins
