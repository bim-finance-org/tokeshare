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
      {/* Dropdown Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-gray-100 p-3 rounded-xl shadow-sm hover:bg-gray-200 transition-colors"
      >
        {selectedChain === 'Polygon' ? <PolygonIcon /> : <BaseIcon />}
        <span className="text-color4 font-medium">{selectedChain}</span>
        <ArrowDownIcon className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-full bg-white rounded-xl shadow-lg border border-gray-200 py-2">
          <button 
            onClick={() => handleSelect('Polygon')}
            className={`flex items-center gap-2 w-full px-4 py-2 hover:bg-gray-100 transition-colors ${
              selectedChain === 'Polygon' ? 'bg-gray-100' : ''
            }`}
          >
            <PolygonIcon />
            <span className="text-color4">Polygon</span>
          </button>
          
          <button 
            onClick={() => handleSelect('Base')}
            className={`flex items-center gap-2 w-full px-4 py-2 hover:bg-gray-100 transition-colors ${
              selectedChain === 'Base' ? 'bg-gray-100' : ''
            }`}
          >
            <BaseIcon />
            <span className="text-color4">Base</span>
          </button>
        </div>
      )}
    </div>
  )
}

export default Blockchains