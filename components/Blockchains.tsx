'use client'

import React, { useState, useEffect, useRef, useContext } from 'react'
import PolygonIcon from './icons/blockchains/PolygonIcon'
import BaseIcon from './icons/blockchains/BaseIcon'
import ArrowDownIcon from './icons/arrows/ArrowDownIcon'
import { TokenContexts } from '@/context/TokenContexts'

interface BlockchainsProps {
  onSelect?: (blockchain: string) => void
  section: 'swap' | 'buy' | 'sell'
}

const Blockchains = ({ onSelect, section }: BlockchainsProps) => {
  // Récupérer les valeurs du context selon la section
  const tokenContext = useContext(TokenContexts)
  
  // Déterminer la blockchain et le setter en fonction de la section
  let blockchain = 'Polygon'
  let updateBlockchain = (chain: string) => {}
  
  if (section === 'swap') {
    blockchain = tokenContext.swap.blockchain
    updateBlockchain = tokenContext.updateSwapBlockchain
  } else if (section === 'buy') {
    blockchain = tokenContext.buy.blockchain
    updateBlockchain = tokenContext.updateBuyBlockchain
  } else if (section === 'sell') {
    blockchain = tokenContext.sell.blockchain
    updateBlockchain = tokenContext.updateSellBlockchain
  }
  
  // État local uniquement pour l'UI du dropdown
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Handle click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Mise à jour: le handler notifie aussi le parent via onSelect si nécessaire
  const handleSelect = (chain: string) => {
    // Mettre à jour le context
    updateBlockchain(chain)
    
    // Notifier le parent si onSelect est fourni (pour compatibilité)
    if (onSelect) onSelect(chain)
    
    setIsOpen(false)
  }

  const toggleDropdown = (e: React.MouseEvent) => {
    // Si on est dans la section swap, ne pas ouvrir le dropdown
    if (section === 'swap') return;
    
    e.stopPropagation()
    setIsOpen(!isOpen)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={toggleDropdown}
        className={`flex items-center cursor-default gap-3 px-3 py-2 bg-color1 rounded-xl shadow-md transition-all duration-200`}
      >
        <div className="w-6 h-6 flex items-center justify-center">
          {blockchain === 'Polygon' ? (
            <PolygonIcon />
          ) : (
            <BaseIcon  />
          )}
        </div>
        <span className="text-color4 font-medium">{blockchain}</span>
        {!section  && (
          <ArrowDownIcon strokeColor="#4F5B76" className={`w-6 h-6 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        )}
      </button>

      {isOpen && !section && (
        <div className="absolute z-50 top-full left-0 mt-2 rounded-xl shadow-xl border overflow-hidden transform transition-all duration-200">
          <button 
            onClick={() => handleSelect('Polygon')}
            className={`flex items-center gap-3 w-full px-3 pr-4 py-2 transition-colors duration-200 ${
              blockchain === 'Polygon' ? '' : ''
            }`}
          >
            <div className="w-6 h-6 flex items-center justify-center">
              <PolygonIcon  />
            </div>
            <span className="text-color4 font-medium">Polygon</span>
          </button>
          
          <button 
            onClick={() => handleSelect('Base')}
            className={`flex items-center gap-3 w-full px-3 py-2  transition-colors duration-200 ${
              blockchain === 'Base' ? '' : ''
            }`}
          >
            <div className="w-6 h-6 flex items-center justify-center">
              <BaseIcon />
            </div>
            
          </button>
        </div>
      )}
    </div>
  )
}

export default Blockchains