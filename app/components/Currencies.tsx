import React from 'react'
import CADIcon from './icons/currency/CADIcon'
import EURIcon from './icons/currency/EURIcon'
import USDIcon from './icons/currency/USDIcon'
import CHFIcon from './icons/currency/CHFIcon'
import GBPIcon from './icons/currency/GBPIcon'

interface CurrenciesProps {
  onSelect: (currency: string) => void
}

const Currencies = ({ onSelect }: CurrenciesProps) => {
  return (
    <div>
        <h1 className='text-2xl text-color2 font-bold border-b-2 border-color2 pb-2'>Select a Currency</h1>
        <h2 className='text-lg text-color2 font-bold'>Search for a currency</h2>
        <h2 className='text-lg text-color2 font-bold'>Available Currencies</h2>
        <div className='flex flex-wrap gap-2'>
            <button onClick={() => onSelect('EUR')} className='cursor-pointer'>
                <EURIcon className='border-2 border-color2' />
            </button>
            <button onClick={() => onSelect('USD')} className='cursor-pointer'>
                <USDIcon className='border-2 border-color2' />
            </button>
            <button onClick={() => onSelect('CHF')} className='cursor-pointer'>
                <CHFIcon className='border-2 border-color2' />
            </button>
            <button onClick={() => onSelect('GBP')} className='cursor-pointer'>
                <GBPIcon className='border-2 border-color2' />
            </button>
            <button onClick={() => onSelect('CAD')} className='cursor-pointer'>
                <CADIcon className='border-2 border-color2' />
            </button>
        </div>
    </div>
  )
}

export default Currencies