import React from 'react';
import { useAccount } from 'wagmi';
import { useAllTokenBalances } from '@/utils/blockchainUtils';
import { Blockchain } from '@/enums/Blockchain';
import { getTokenIcon } from '@/utils/token';

interface StableCoinsProps {
  onSelect: (currency: string) => void;
  blockchain: Blockchain | null;
}

// Define which stablecoins are available on each blockchain
const BLOCKCHAIN_STABLECOINS = {
  Polygon: ['USDT', 'USDC', 'DAI', 'EURS', 'USDCE'],
  Base: ['USDC', 'DAI', 'EURC', 'CRVUSD', 'BOLD'],
};

const StableCoins = ({ onSelect, blockchain }: StableCoinsProps) => {
  if (blockchain === null) {
    return;
  }

  const availableStablecoins = BLOCKCHAIN_STABLECOINS[blockchain as keyof typeof BLOCKCHAIN_STABLECOINS] || [];
  const { isConnected } = useAccount();

  // Récupérer toutes les balances en une seule fois avec multicall
  const { balances, isLoading, error } = useAllTokenBalances(blockchain);

  const renderStablecoinButton = (symbol: string) => {
    const Icon = getTokenIcon(symbol);

    // Récupérer la balance depuis le multicall
    const balance = balances[symbol]?.formatted || '0';

    return (
      <button
        key={symbol}
        onClick={() => {
          onSelect(symbol);
        }}
        className="flex items-center justify-between w-full p-2 hover:bg-gray-200 rounded-lg transition-colors border-b border-gray-200"
      >
        <div className="flex items-center gap-3">
          {Icon && <Icon />}
          <span className="text-color4 font-medium">{symbol === 'USDCE' ? 'USDC.e' : symbol}</span>
        </div>

        {isConnected && (
          <span className="text-sm text-color4 font-medium">Balance: {isLoading ? 'Loading...' : balance}</span>
        )}
      </button>
    );
  };

  return (
    <div>
      <h1 className="text-2xl text-color2 font-bold border-b-2 border-color2 pb-2">Select a Stablecoin</h1>
      <h2 className="text-lg text-color2 font-bold mt-4 mb-2">Available on {blockchain}</h2>
      {error && <div className="text-red-500 text-sm mb-2">Erreur: {error.toString()}</div>}
      <div className="flex flex-col gap-1 min-w-[200px]">{availableStablecoins.map(renderStablecoinButton)}</div>
    </div>
  );
};

export default StableCoins;
