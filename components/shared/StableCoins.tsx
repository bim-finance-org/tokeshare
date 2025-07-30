import React from 'react';
import { useAccount } from 'wagmi';
import { useAllTokenBalances } from '@/utils/blockchainUtils';
import { Blockchain } from '@/enums/Blockchain';
import { getTokensByTypeAndByBlockchain } from '@/utils/token';
import { TokenType } from '@/enums/TokenType';
import { TokenInfo } from '@/config/token';

interface StableCoinsProps {
  onSelect: (currency: string) => void;
  blockchain: Blockchain | null;
}

const StableCoins = ({ onSelect, blockchain }: StableCoinsProps) => {
  if (blockchain === null) {
    return;
  }

  const stablecoins = getTokensByTypeAndByBlockchain(blockchain, TokenType.Stablecoin);

  const { isConnected } = useAccount();

  const { balances, isLoading, error } = useAllTokenBalances(blockchain);

  const renderStablecoinButton = (token: TokenInfo) => {
    const { symbol } = token;
    const Icon = token.icon;
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
      <div className="flex flex-col gap-1 min-w-[200px]">{stablecoins.map(renderStablecoinButton)}</div>
    </div>
  );
};

export default StableCoins;
