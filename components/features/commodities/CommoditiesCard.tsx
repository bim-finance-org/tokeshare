'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Commodity } from '@/interfaces/Commodity';
import { calculateTGGPrice, calculateTSGPrice } from '@/utils/priceUtils';
import { useCommodityData } from '@/hooks/useCommodityData';

interface CommoditiesCardProps {
  commodity: Commodity;
}

const TRADABLE: Record<string, string> = { Gold: 'TGG', Silver: 'TSG' };

const PerfTile = ({ label, value }: { label: string; value?: number | null }) => {
  const num = typeof value === 'number' ? value : null;
  const positive = num !== null && num > 0;
  const negative = num !== null && num < 0;

  return (
    <div className={`rounded-xl px-3 py-2 ${positive ? 'bg-green-50' : negative ? 'bg-red-50' : 'bg-gray-50'}`}>
      <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">{label}</p>
      <p
        className={`text-sm font-semibold tabular-nums ${
          num === null ? 'text-gray-400' : positive ? 'text-green-600' : negative ? 'text-red-600' : 'text-gray-500'
        }`}
      >
        {num !== null ? `${positive ? '+' : ''}${num.toFixed(2)}%` : 'N/A'}
      </p>
    </div>
  );
};

const CommoditiesCard: React.FC<CommoditiesCardProps> = ({ commodity }) => {
  const { name, image } = commodity;
  const { price, perf1d, perf1y, isLoading } = useCommodityData(name);

  const symbol = TRADABLE[name];
  const tradable = Boolean(symbol);

  // The underlying spot (PAXG for gold, XAGM for silver) is per troy ounce; both
  // convert to a per-gram token price via the same 31.1034768 divisor.
  const toGramPrice = name === 'Silver' ? calculateTSGPrice : calculateTGGPrice;
  const displayPrice = price != null ? `$${toGramPrice(price).toFixed(2)}` : null;

  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-2xl bg-white shadow-md ring-1 ring-black/5">
      {/* Media */}
      <div className="relative h-44 w-full overflow-hidden sm:h-48">
        <Image src={image} alt={name} fill className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/0 to-black/0" />

        <span
          className={`absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
            tradable ? 'bg-white/90 text-color4' : 'bg-black/40 text-white backdrop-blur-sm'
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${tradable ? 'bg-color3' : 'bg-white/60'}`} />
          {tradable ? 'Live' : 'Soon'}
        </span>

        <h3 className="absolute bottom-3 left-4 font-titleSemibold text-xl text-white drop-shadow">{name}</h3>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="flex items-baseline justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Token price</span>
          <span className={`font-titleSemibold text-lg tabular-nums ${isLoading ? 'text-gray-400' : 'text-color4'}`}>
            {isLoading ? 'Loading…' : (displayPrice ?? '—')}
          </span>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <PerfTile label="24h" value={perf1d?.perf1d} />
          <PerfTile label="1 year" value={perf1y?.perf1y} />
        </div>

        <div className="mt-auto pt-4">
          {tradable ? (
            <Link href={`/marketplace/commodities/${name}`} className="block">
              <span className="flex items-center justify-center rounded-xl bg-color4 px-4 py-2.5 text-sm font-titleSemibold text-white transition-colors hover:bg-color2">
                Trade {symbol}
              </span>
            </Link>
          ) : (
            <span className="flex cursor-not-allowed items-center justify-center rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-400">
              Available soon
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommoditiesCard;
