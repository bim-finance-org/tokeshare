'use client';

import React, { useState, useEffect, useRef } from 'react';
import PolygonIcon from '@/components/icons/blockchains/PolygonIcon';
import BaseIcon from '@/components/icons/blockchains/BaseIcon';
import EthereumIcon from '@/components/icons/blockchains/EthereumIcon';
import ArrowDownIcon from '@/components/icons/arrows/ArrowDownIcon';
import { useTokenContext } from '@/context/TokenContexts';
import { Blockchain } from '@/enums/Blockchain';
import { ExchangeSection } from '@/enums/ExchangeSection';
import { getTokenBlockchains } from '@/utils/token';

interface BlockchainsProps {
  onSelect?: (blockchain: Blockchain) => void;
  section: ExchangeSection;
  tokenSymbol: string;
}

const Blockchains = ({ onSelect, section, tokenSymbol }: BlockchainsProps) => {
  const availableBlockchains = getTokenBlockchains(tokenSymbol);

  const tokenContext = useTokenContext();

  // Sélection actuelle depuis le context
  let blockchain: Blockchain = Blockchain.Polygon;
  let updateBlockchain = (chain: Blockchain) => {};

  if (section === ExchangeSection.Swap) {
    blockchain = tokenContext.swap.blockchain;
    updateBlockchain = tokenContext.updateSwapBlockchain;
  } else if (section === ExchangeSection.Buy) {
    blockchain = tokenContext.buy.blockchain;
    updateBlockchain = tokenContext.updateBuyBlockchain;
  } else if (section === ExchangeSection.Sell) {
    blockchain = tokenContext.sell.blockchain;
    updateBlockchain = tokenContext.updateSellBlockchain;
  }

  // Si la blockchain sélectionnée n'est pas dispo pour le token, la forcer à la première dispo
  useEffect(() => {
    if (!availableBlockchains.includes(blockchain) && availableBlockchains.length > 0) {
      updateBlockchain(availableBlockchains[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenSymbol, availableBlockchains.join()]); // update dès que tokenSymbol OU blockchains du token change

  // Dropdown UI state
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Click hors menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelect = (chain: Blockchain) => {
    updateBlockchain(chain);
    if (onSelect) onSelect(chain);
    setIsOpen(false);
  };

  const toggleDropdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  // Icone dynamique
  const renderIcon = (chain: Blockchain) => {
    switch (chain) {
      case Blockchain.Polygon:
        return <PolygonIcon />;
      case Blockchain.Ethereum:
        return <EthereumIcon />;
      default:
        return <BaseIcon />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={toggleDropdown}
        className="flex items-center cursor-default gap-3 px-3 py-2 bg-color1 rounded-xl shadow-md transition-all duration-200"
      >
        <div className="w-6 h-6 flex items-center justify-center">{renderIcon(blockchain)}</div>
        <span className="text-color4 font-medium">{blockchain}</span>
        <ArrowDownIcon
          strokeColor="#4F5B76"
          className={`w-6 h-6 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 top-full left-0 mt-2 rounded-xl shadow-xl border overflow-hidden transform transition-all duration-200 bg-white">
          {availableBlockchains.map((chain) => (
            <button
              key={chain}
              onClick={() => handleSelect(chain)}
              className={`flex items-center gap-3 w-full px-3 py-2 transition-colors duration-200 ${
                blockchain === chain ? 'bg-gray-100' : ''
              }`}
            >
              <div className="w-6 h-6 flex items-center justify-center">{renderIcon(chain)}</div>
              <span className="text-color4 font-medium">{chain}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Blockchains;
