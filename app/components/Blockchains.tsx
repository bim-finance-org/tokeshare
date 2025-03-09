import React, { useState, useEffect, useRef } from 'react'
import PolygonIcon from './icons/blockchains/PolygonIcon'
import BaseIcon from './icons/blockchains/BaseIcon'
import ArrowDownIcon from './icons/arrows/ArrowDownIcon'

interface BlockchainsProps {
  onSelect?: (blockchain: string) => void
  section: 'swap' | 'buy' | 'sell'
}

const Blockchains = ({ onSelect, section }: BlockchainsProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedChain, setSelectedChain] = useState('Polygon')
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Load from localStorage after component mounts (client-side only)
  useEffect(() => {
    const savedChain = localStorage.getItem(`${section}SelectedBlockchain`)
    if (savedChain) {
      setSelectedChain(savedChain)
    }
  }, [section])

  // Save to localStorage whenever selectedChain changes
  useEffect(() => {
    localStorage.setItem(`${section}SelectedBlockchain`, selectedChain)
    if (onSelect) {
      onSelect(selectedChain)
    }
  }, [selectedChain, section, onSelect])

  // Handle click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('click', handleClickOutside)
    }

    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [isOpen])

  const handleSelect = (chain: string) => {
    setSelectedChain(chain)
    setIsOpen(false)
  }

  const toggleDropdown = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsOpen(!isOpen)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={toggleDropdown}
        className="flex items-center gap-3  px-3 py-2 bg-color1 rounded-xl shadow-md hover:shadow-lg hover:bg-gray-100 transition-all duration-200"
      >
        <div className="w-6 h-6 flex items-center justify-center">
          {selectedChain === 'Polygon' ? (
            <PolygonIcon />
          ) : (
            <BaseIcon  />
          )}
        </div>
        <span className="text-color4 font-medium">{selectedChain}</span>
        <ArrowDownIcon strokeColor="#4F5B76" className={`w-6 h-6 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
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