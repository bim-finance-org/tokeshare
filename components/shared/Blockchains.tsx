'use client';

import React, { useEffect } from 'react';
import PolygonIcon from '@/components/icons/blockchains/PolygonIcon';
import BaseIcon from '@/components/icons/blockchains/BaseIcon';
import EthereumIcon from '@/components/icons/blockchains/EthereumIcon';
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
  let updateBlockchain: (chain: Blockchain) => void = () => {};

  if (section === ExchangeSection.Swap) {
    blockchain = tokenContext.swap.blockchain;
    updateBlockchain = tokenContext.updateSwapBlockchain;
  }

  // Si la blockchain sélectionnée n'est pas dispo pour le token, la forcer à la première dispo
  useEffect(() => {
    if (!availableBlockchains.includes(blockchain) && availableBlockchains.length > 0) {
      updateBlockchain(availableBlockchains[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenSymbol, availableBlockchains.join()]); // update dès que tokenSymbol OU blockchains du token change

  const handleSelect = (chain: Blockchain) => {
    updateBlockchain(chain);
    if (onSelect) onSelect(chain);
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
    <div className="flex items-center gap-2" role="radiogroup" aria-label="Select network">
      {availableBlockchains.map((chain) => {
        const isActive = blockchain === chain;
        return (
          <button
            type="button"
            key={chain}
            onClick={() => handleSelect(chain)}
            role="radio"
            aria-checked={isActive}
            aria-label={chain}
            title={chain}
            className={`flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white transition-all duration-200 ${
              isActive
                ? 'ring-2 ring-color2 shadow-md scale-105'
                : 'ring-1 ring-inset ring-black/5 opacity-60 hover:opacity-100 hover:ring-black/15 active:scale-95'
            }`}
          >
            <span className="w-6 h-6 flex items-center justify-center">{renderIcon(chain)}</span>
          </button>
        );
      })}
    </div>
  );
};

export default Blockchains;
