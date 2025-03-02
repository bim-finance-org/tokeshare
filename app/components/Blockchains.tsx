import React, { useState, useEffect } from 'react'
import PolygonIcon from './icons/blockchains/PolygonIcon'
import BaseIcon from './icons/blockchains/BaseIcon'
import ArrowDownIcon from './icons/arrows/ArrowDownIcon'

interface BlockchainsProps {
  onSelect?: (blockchain: string) => void
  section: 'swap' | 'buy' | 'sell'
}

const Blockchains = ({ onSelect, section }: BlockchainsProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedChain, setSelectedChain] = useState(() => {
    // Initialize from localStorage or default to Polygon
    return localStorage.getItem(`${section}SelectedBlockchain`) || 'Polygon'
  })

  // Save to localStorage whenever selectedChain changes
  useEffect(() => {
    localStorage.setItem(`${section}SelectedBlockchain`, selectedChain)
  }, [selectedChain, section])

  const handleSelect = (chain: string) => {
    setSelectedChain(chain)
    onSelect?.(chain)
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3  px-3 py-2 bg-gray-100 rounded-xl shadow-md hover:shadow-lg hover:bg-gray-50 transition-all duration-200"
      >
        <div className="w-6 h-6 flex items-center justify-center">
          {selectedChain === 'Polygon' ? (
            <PolygonIcon />
          ) : (
            <BaseIcon  />
          )}
        </div>
        <span className="text-color4 font-medium">{selectedChain}</span>
        <ArrowDownIcon className={`w-4 h-4 text-color4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 top-full left-0 mt-2  bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden transform transition-all duration-200">
          <button 
            onClick={() => handleSelect('Polygon')}
            className={`flex items-center gap-3 w-full px-3 pr-4 py-2 hover:bg-gray-50 transition-colors duration-200 ${
              selectedChain === 'Polygon' ? 'bg-gray-100' : ''
            }`}
          >
            <div className="w-6 h-6 flex items-center justify-center">
              <PolygonIcon  />
            </div>
            <span className="text-color4 font-medium">Polygon</span>
          </button>
          
          <button 
            onClick={() => handleSelect('Base')}
            className={`flex items-center gap-3 w-full px-3 py-2 hover:bg-gray-50 transition-colors duration-200 ${
              selectedChain === 'Base' ? 'bg-gray-100' : ''
            }`}
          >
            <div className="w-6 h-6 flex items-center justify-center">
              <BaseIcon />
            </div>
            <span className="text-color4 font-medium">Base</span>
          </button>
        </div>
      )}
    </div>
  )
}

export default Blockchains