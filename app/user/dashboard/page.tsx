'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { Eye, EyeOff, Wallet } from 'lucide-react';
import AssetCard, { type PortfolioHolding } from '@/components/features/user/dashboard/AssetCard';
import ChainIcon from '@/components/shared/ChainIcon';
import ConnectButton from '@/components/shared/ConnectButton';
import { useUserTokenAssets } from '@/hooks/useUserTokenAssets';
import type { AssetData } from '@/interfaces/AssetData';

// Allocation colours, assigned to holdings by descending value.
const PALETTE = ['#4f46e5', '#2563eb', '#0ea5e9', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#14b8a6'];

const fmt = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 2 });

// Merge the same token held across several chains into a single holding.
const groupBySymbol = (assets: AssetData[]): PortfolioHolding[] => {
  const map = new Map<string, PortfolioHolding>();
  for (const a of assets) {
    const existing = map.get(a.symbol);
    if (existing) {
      existing.amount += a.amount;
      existing.totalPrice += a.totalPrice;
      if (!existing.chains.includes(a.blockchain)) existing.chains.push(a.blockchain);
    } else {
      map.set(a.symbol, {
        name: a.name,
        symbol: a.symbol,
        amount: a.amount,
        totalPrice: a.totalPrice,
        imageUrl: a.imageUrl,
        internalUrl: a.internalUrl,
        chains: [a.blockchain],
      });
    }
  }
  return [...map.values()];
};

export default function Page() {
  const { isConnected } = useAccount();
  const { assets, isLoading } = useUserTokenAssets();

  const [chainFilter, setChainFilter] = useState<'ALL' | string>('ALL');
  const [hidden, setHidden] = useState(false);

  const fullTotal = assets.reduce((acc, a) => acc + a.totalPrice, 0);
  const availableChains = [...new Set(assets.map((a) => a.blockchain))];
  const tokenCount = groupBySymbol(assets).length;

  const filtered = chainFilter === 'ALL' ? assets : assets.filter((a) => a.blockchain === chainFilter);
  const holdings = groupBySymbol(filtered).sort((a, b) => b.totalPrice - a.totalPrice);
  const viewTotal = holdings.reduce((acc, h) => acc + h.totalPrice, 0);
  const share = (value: number) => (viewTotal > 0 ? (value / viewTotal) * 100 : 0);

  const blur = hidden ? 'select-none blur-md' : '';

  return (
    <div className="min-h-screen bg-gradient-to-b from-color1 to-white px-4 py-10 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-3xl bg-color4 p-6 text-white shadow-lg ring-1 ring-black/5 sm:p-8">
          <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-blue-500/25 blur-3xl" />
          <div className="relative">
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white/80 ring-1 ring-inset ring-white/15">
                Portfolio
              </span>
              {isConnected && (
                <button
                  type="button"
                  onClick={() => setHidden((h) => !h)}
                  aria-label={hidden ? 'Show balances' : 'Hide balances'}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/80 ring-1 ring-inset ring-white/15 transition-colors hover:bg-white/20 hover:text-white"
                >
                  {hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              )}
            </div>
            <p className="mt-4 text-sm text-white/60">Total portfolio value</p>
            <p className={`mt-1 font-titleSemibold text-4xl tabular-nums sm:text-5xl ${blur}`}>
              {isConnected ? `$${fmt(fullTotal)}` : '—'}
            </p>
            {isConnected && !isLoading && (
              <div className="mt-6 flex flex-wrap gap-x-8 gap-y-2 text-sm">
                <span>
                  <span className="text-white/50">Assets </span>
                  <span className="font-semibold tabular-nums">{tokenCount}</span>
                </span>
                <span>
                  <span className="text-white/50">Networks </span>
                  <span className="font-semibold tabular-nums">{availableChains.length}</span>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* States */}
        {!isConnected ? (
          <div className="flex flex-col items-center gap-5 rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-black/5">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-color1 text-color4">
              <Wallet className="h-6 w-6" />
            </span>
            <p className="text-gray-500">Connect your wallet to see your portfolio.</p>
            <div className="w-full max-w-xs">
              <ConnectButton />
            </div>
          </div>
        ) : isLoading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-[92px] animate-pulse rounded-2xl bg-white/70 ring-1 ring-black/5" />
            ))}
          </div>
        ) : assets.length === 0 ? (
          <div className="rounded-2xl bg-white p-10 text-center text-gray-400 shadow-sm ring-1 ring-black/5">
            No assets found
          </div>
        ) : (
          <>
            {/* Network filter */}
            {availableChains.length > 1 && (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setChainFilter('ALL')}
                  className={`rounded-full px-4 py-1.5 text-sm font-titleSemibold transition-colors ${
                    chainFilter === 'ALL'
                      ? 'bg-color4 text-white shadow-sm'
                      : 'bg-white text-gray-500 ring-1 ring-inset ring-black/5 hover:text-color4'
                  }`}
                >
                  All
                </button>
                {availableChains.map((chain) => {
                  const active = chainFilter === chain;
                  return (
                    <button
                      key={chain}
                      type="button"
                      onClick={() => setChainFilter(chain)}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-titleSemibold transition-colors ${
                        active
                          ? 'bg-color4 text-white shadow-sm'
                          : 'bg-white text-gray-500 ring-1 ring-inset ring-black/5 hover:text-color4'
                      }`}
                    >
                      <span className="flex h-4 w-4 items-center justify-center">
                        <ChainIcon chain={chain} size={16} />
                      </span>
                      {chain}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Allocation */}
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
              <h2 className="font-titleSemibold text-color4">Allocation</h2>
              <div className="mt-3 flex h-3 w-full overflow-hidden rounded-full bg-color1">
                {holdings.map((h, i) => (
                  <div
                    key={h.symbol}
                    style={{ width: `${share(h.totalPrice)}%`, backgroundColor: PALETTE[i % PALETTE.length] }}
                  />
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs">
                {holdings.map((h, i) => (
                  <span key={h.symbol} className="inline-flex items-center gap-1.5 text-gray-500">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: PALETTE[i % PALETTE.length] }} />
                    {h.symbol}
                    <span className="font-semibold tabular-nums text-color4">{share(h.totalPrice).toFixed(1)}%</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Holdings */}
            <div className="space-y-3">
              {holdings.map((h, i) => (
                <AssetCard
                  key={h.symbol}
                  holding={h}
                  share={share(h.totalPrice)}
                  accent={PALETTE[i % PALETTE.length]}
                  hidden={hidden}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
