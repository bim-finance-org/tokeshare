import React, { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import Currencies from './Currencies';
import StableCoins from './StableCoins';
import { Blockchain } from '@/enums/Blockchain';

interface TokenSelectorProps {
  type: 'fiat' | 'crypto' | 'stablecoin';
  blockchain?: Blockchain;
  onSelect: (token: string) => void;
  isOpen: boolean;
  onClose: () => void;
  selected?: string;
}

/**
 * Rendered inside the swap card: it anchors to the nearest positioned ancestor
 * (Swap's `relative` root) and fills the swap body, so the token list slides in
 * over the widgets instead of opening a full-screen overlay with a page backdrop.
 */
const TokenSelector = ({ isOpen, type, blockchain, onClose, onSelect, selected }: TokenSelectorProps) => {
  const [query, setQuery] = useState('');

  // Close on Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!isOpen) return null;

  const title = type === 'fiat' ? 'Select a currency' : 'Select a token';

  return (
    <div
      className="absolute inset-0 z-40 flex flex-col bg-white animate-in fade-in-0 slide-in-from-bottom-4 duration-200"
      role="dialog"
      aria-label={title}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-4 pb-3 pt-4 sm:px-5">
        <div>
          <h2 className="text-base font-titleSemibold text-color4 sm:text-lg">{title}</h2>
          {type !== 'fiat' && blockchain && <p className="mt-0.5 text-xs text-gray-400">Available on {blockchain}</p>}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-color4"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Search */}
      <div className="px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2 rounded-xl bg-color1 px-3 py-2.5 ring-1 ring-inset ring-black/5 transition focus-within:ring-2 focus-within:ring-blue-400">
          <Search className="h-4 w-4 shrink-0 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name or symbol"
            className="w-full bg-transparent text-sm text-color4 outline-none placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* Token list */}
      <div className="flex-1 overflow-y-auto px-2 pb-3 sm:px-3">
        {type === 'fiat' ? (
          <Currencies
            query={query}
            selected={selected}
            onSelect={(currency) => {
              onSelect(currency);
              onClose();
            }}
          />
        ) : (
          <StableCoins
            blockchain={blockchain || null}
            query={query}
            selected={selected}
            onSelect={(currency) => {
              onSelect(currency);
              onClose();
            }}
          />
        )}
      </div>
    </div>
  );
};

export default TokenSelector;
