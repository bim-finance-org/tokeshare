'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Route } from 'next';

export type PerfStat = { label: string; value?: number | null };

interface AssetCardProps {
  name: string;
  image: string;
  /** Pre-formatted price, e.g. "$128.87". */
  price?: string | null;
  isLoading?: boolean;
  /** Performance tiles (2 recommended). */
  perfs: PerfStat[];
  /** Trade route. When absent, the card shows an "Available soon" state. */
  href?: string;
  /** Token symbol used in the CTA ("Trade TGG"). */
  ctaSymbol?: string;
  imagePriority?: boolean;
}

const PerfTile = ({ label, value }: PerfStat) => {
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

const AssetCard = ({ name, image, price, isLoading, perfs, href, ctaSymbol, imagePriority }: AssetCardProps) => {
  const tradable = Boolean(href);
  // Shrink the title for long names so it stays on a single line.
  const nameSize = name.length > 20 ? 'text-sm' : name.length > 15 ? 'text-lg' : 'text-xl';

  return (
    <div className="mx-auto flex h-full w-full max-w-sm flex-col overflow-hidden rounded-2xl bg-white shadow-md ring-1 ring-black/5">
      {/* Media */}
      <div className="relative aspect-[3/2] w-full overflow-hidden">
        <Image
          src={image}
          alt={name}
          fill
          sizes="(max-width: 640px) 100vw, 400px"
          className="object-cover object-center"
          priority={imagePriority}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/0 to-black/0" />

        <span
          className={`absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
            tradable ? 'bg-white/90 text-color4' : 'bg-black/40 text-white backdrop-blur-sm'
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${tradable ? 'bg-color3' : 'bg-white/60'}`} />
          {tradable ? 'Live' : 'Soon'}
        </span>

        <h3
          className={`absolute bottom-3 left-4 right-4 truncate font-titleSemibold leading-tight text-white drop-shadow ${nameSize}`}
        >
          {name}
        </h3>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Token price</span>
          <span className={`font-titleSemibold text-lg tabular-nums ${isLoading ? 'text-gray-400' : 'text-color4'}`}>
            {isLoading ? 'Loading…' : (price ?? '—')}
          </span>
        </div>

        <div className={`mt-3 grid gap-2 ${perfs.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
          {perfs.map((perf) => (
            <PerfTile key={perf.label} label={perf.label} value={perf.value} />
          ))}
        </div>

        <div className="mt-auto pt-4">
          {href ? (
            <Link href={href as Route} className="block">
              <span className="flex items-center justify-center rounded-xl bg-color4 px-4 py-2.5 text-sm font-titleSemibold text-white transition-colors hover:bg-color2">
                Trade {ctaSymbol}
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

export default AssetCard;
