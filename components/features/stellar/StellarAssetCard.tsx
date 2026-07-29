'use client';

// Marketplace card for a Stellar RWA asset, styled to match the other listing
// cards. Reads live price + availability on-chain; links to the asset's Stellar
// page for the full buy/sell flow.

import Image from 'next/image';
import Link from 'next/link';
import type { Route } from 'next';
import { type StellarAsset } from '@/config/stellar-assets';
import { getNetworkProfile } from '@/config/stellar';
import { useSaleInfo } from '@/hooks/useStellarAsset';

const Stat = ({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) => (
  <div className={`rounded-xl px-3 py-2 ${highlight ? 'bg-color1 ring-1 ring-inset ring-black/5' : 'bg-gray-50'}`}>
    <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">{label}</p>
    <p className={`font-titleSemibold ${highlight ? 'text-color2' : 'text-color4'}`}>{value}</p>
  </div>
);

export default function StellarAssetCard({ asset }: { asset: StellarAsset }) {
  const PAY_SYMBOL = getNetworkProfile(asset.network).pay.code;
  const { data: saleInfo } = useSaleInfo(asset);

  const priceLabel = saleInfo
    ? `${saleInfo.priceUnits} ${PAY_SYMBOL}`
    : asset.priceHintUsdc != null
      ? `${asset.priceHintUsdc} ${PAY_SYMBOL}`
      : '—';
  const availableLabel = saleInfo
    ? `${parseFloat(saleInfo.availableUnits).toLocaleString('en-US')} left`
    : `${asset.totalShares.toLocaleString('en-US')} shares`;

  return (
    <div className="mx-auto flex h-full w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-md ring-1 ring-black/5 text-color4">
      <div className="relative aspect-[3/2] w-full overflow-hidden">
        <Image
          src={asset.image}
          alt={asset.name}
          fill
          sizes="(max-width: 640px) 100vw, 448px"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0" />
        <span className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-color4">
          <span className="h-1.5 w-1.5 rounded-full bg-color3" />
          {availableLabel}
        </span>
        <h3 className="absolute bottom-3 left-4 font-titleSemibold text-xl text-white drop-shadow">{asset.name}</h3>
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        {asset.description && <p className="text-sm text-gray-500">{asset.description}</p>}

        <div className="mt-4 grid grid-cols-2 gap-2">
          <Stat label="Token price" value={priceLabel} highlight />
          <Stat label="Total tokens" value={asset.totalShares.toLocaleString('en-US')} />
          <Stat label="Blockchain" value="Stellar" />
          <Stat label="Symbol" value={asset.symbol} />
        </div>

        <div className="mt-auto pt-4">
          <Link href={`/stellar/${asset.slug}` as Route} className="block">
            <span className="flex items-center justify-center rounded-xl bg-color4 px-4 py-2.5 text-sm font-titleSemibold text-white transition-colors hover:bg-color2">
              Trade {asset.symbol}
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
