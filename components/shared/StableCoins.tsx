import React from 'react';
import { Check } from 'lucide-react';
import { useAccount } from 'wagmi';
import { useAllTokenBalances } from '@/utils/blockchainUtils';
import { Blockchain } from '@/enums/Blockchain';
import { getTokensByTypeAndByBlockchain } from '@/utils/token';
import { TokenType } from '@/enums/TokenType';
import { TokenInfo } from '@/config/token';

interface StableCoinsProps {
  onSelect: (currency: string) => void;
  blockchain: Blockchain | null;
  query?: string;
  selected?: string;
}

const label = (symbol: string) => (symbol === 'USDCE' ? 'USDC.e' : symbol);

const StableCoins = ({ onSelect, blockchain, query = '', selected }: StableCoinsProps) => {
  const { isConnected } = useAccount();
  const { balances, isLoading, error } = useAllTokenBalances(blockchain);

  if (blockchain === null) {
    return null;
  }

  const stablecoins = getTokensByTypeAndByBlockchain(blockchain, TokenType.Stablecoin);
  const q = query.trim().toLowerCase();
  const filtered = q
    ? stablecoins.filter((t) => label(t.symbol).toLowerCase().includes(q) || t.name.toLowerCase().includes(q))
    : stablecoins;

  const renderStablecoinButton = (token: TokenInfo) => {
    const { symbol, name } = token;
    const Icon = token.icon;
    const balance = balances[symbol]?.formatted || '0';
    const isSelected = selected === symbol;

    return (
      <button
        type="button"
        key={symbol}
        onClick={() => onSelect(symbol)}
        className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 transition-colors ${
          isSelected ? 'bg-color1' : 'hover:bg-gray-50'
        }`}
      >
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center">{Icon && <Icon />}</span>
          <div className="flex min-w-0 flex-col items-start">
            <span className="font-semibold leading-tight text-color4">{label(symbol)}</span>
            <span className="max-w-[160px] truncate text-xs text-gray-400">{name}</span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {isConnected && (
            <span className="text-sm font-medium tabular-nums text-color4">{isLoading ? '…' : balance}</span>
          )}
          {isSelected && <Check className="h-4 w-4 text-color2" />}
        </div>
      </button>
    );
  };

  return (
    <div className="flex flex-col gap-0.5">
      {error && <div className="mb-2 px-3 text-sm text-red-500">Error: {error.toString()}</div>}
      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-400">No token matches your search.</p>
      ) : (
        filtered.map(renderStablecoinButton)
      )}
    </div>
  );
};

export default StableCoins;
