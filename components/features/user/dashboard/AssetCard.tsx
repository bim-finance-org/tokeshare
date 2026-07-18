import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Route } from 'next';
import ChainIcon from '@/components/shared/ChainIcon';

export interface PortfolioHolding {
  name: string;
  symbol: string;
  amount: number;
  totalPrice: number;
  imageUrl?: string;
  internalUrl?: string;
  /** Chains this token is held on (aggregated). */
  chains: string[];
}

interface AssetCardProps {
  holding: PortfolioHolding;
  share: number;
  accent: string;
  hidden?: boolean;
}

const AssetCard = ({ holding, share, accent, hidden }: AssetCardProps) => {
  const blur = hidden ? 'select-none blur-[6px]' : '';

  return (
    <div className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 sm:p-5">
      {/* Logo */}
      {holding.imageUrl ? (
        <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-color1 ring-1 ring-inset ring-black/5 sm:h-16 sm:w-16">
          <Image src={holding.imageUrl} alt={holding.name} fill sizes="64px" className="object-contain p-2.5" />
        </div>
      ) : (
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-color1 text-xs text-gray-400 ring-1 ring-inset ring-black/5 sm:h-16 sm:w-16">
          No image
        </div>
      )}

      {/* Name + meta */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: accent }} />
          <p className="truncate font-titleSemibold text-color4">{holding.name}</p>
          <span className="flex shrink-0 items-center gap-1">
            {holding.chains.map((chain) => (
              <span
                key={chain}
                title={chain}
                className="flex h-5 w-5 items-center justify-center rounded-full bg-color1 ring-1 ring-inset ring-black/5"
              >
                <ChainIcon chain={chain} size={13} />
              </span>
            ))}
          </span>
        </div>
        <div className="mt-1.5 flex items-center gap-3 text-sm text-gray-500">
          <span className={`tabular-nums ${blur}`}>
            {holding.amount.toFixed(4)} {holding.symbol}
          </span>
          {holding.internalUrl && (
            <Link href={holding.internalUrl as Route} className="font-medium text-color2 hover:underline">
              View asset
            </Link>
          )}
        </div>
      </div>

      {/* Value */}
      <div className="shrink-0 text-right">
        <p className={`font-titleSemibold tabular-nums text-color4 ${blur}`}>
          ${holding.totalPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}
        </p>
        <p className="text-xs tabular-nums text-gray-400">{share.toFixed(1)}%</p>
      </div>
    </div>
  );
};

export default AssetCard;
