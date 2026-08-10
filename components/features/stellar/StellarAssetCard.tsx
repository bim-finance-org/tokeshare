'use client';

// Marketplace card for a Stellar RWA asset. Deliberately mirrors TacosCard
// (components/features/french-tacos/TacosCard.tsx) — same shell, same 2×3 stat
// grid, same green yield band — because the two sit side by side in the same
// grid on /marketplace/other and any divergence reads as a glitch.
//
// Unlike TacosCard, whose figures are hardcoded for a single token, everything
// here is driven by the asset config: assets without `economics` (or whose sale
// contract is unreachable) fall back to a dash rather than breaking the layout.

import Image from 'next/image';
import Link from 'next/link';
import type { Route } from 'next';
import { LineChart } from 'lucide-react';
import LocationIcon from '@/components/icons/card/LocationIcon';
import { getNetworkProfile } from '@/config/stellar';
import { type StellarAsset } from '@/config/stellar-assets';
import { useSaleInfo } from '@/hooks/useStellarAsset';

const Stat = ({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) => (
  <div className={`rounded-xl px-3 py-2 ${highlight ? 'bg-color1 ring-1 ring-inset ring-black/5' : 'bg-gray-50'}`}>
    <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">{label}</p>
    <p className={`font-titleSemibold ${highlight ? 'text-color2' : 'text-color4'}`}>{value}</p>
  </div>
);

const EMPTY = '—';

const amount = (value: number, decimals = 2) =>
  value.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

export default function StellarAssetCard({ asset }: { asset: StellarAsset }) {
  const PAY_SYMBOL = getNetworkProfile(asset.network).pay.code;
  const { data: saleInfo } = useSaleInfo(asset);
  const economics = asset.economics;

  const priceLabel = saleInfo
    ? `${saleInfo.priceUnits} ${PAY_SYMBOL}`
    : asset.priceHintUsdc != null
      ? `${asset.priceHintUsdc} ${PAY_SYMBOL}`
      : EMPTY;

  // Availability only appears once the sale contract has answered, so a slow or
  // failed read shows no badge instead of a misleading "sold out".
  const available = saleInfo ? parseFloat(saleInfo.availableUnits) : null;
  const showAvailability = available !== null;
  const soldOut = available === 0;

  // The location line carries a pin; assets that only declare a description
  // reuse the same slot without one.
  const subtitle = asset.location ?? asset.description;

  return (
    <div className="mx-auto flex h-full w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-md ring-1 ring-black/5 text-color4">
      {/* Media */}
      <div className="relative aspect-[3/2] w-full overflow-hidden">
        <Image
          src={asset.image}
          alt={asset.name}
          fill
          sizes="(max-width: 640px) 100vw, 448px"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0" />

        {showAvailability && (
          <span
            className={`absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
              soldOut ? 'bg-black/40 text-white backdrop-blur-sm' : 'bg-white/90 text-color4'
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${soldOut ? 'bg-white/60' : 'bg-color3'}`} />
            {soldOut ? 'Sold out' : `${available.toLocaleString('en-US')} ${asset.symbol} left`}
          </span>
        )}

        <h3 className="absolute bottom-3 left-4 font-titleSemibold text-xl text-white drop-shadow">{asset.name}</h3>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        {subtitle && (
          <p className="flex items-center gap-1.5 text-sm text-gray-500">
            {asset.location && <LocationIcon size={16} />}
            {subtitle}
          </p>
        )}

        {/* Key figures */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Stat label="Token price" value={priceLabel} highlight />
          <Stat
            label="Total valuation"
            value={economics ? `${amount(economics.totalValuation, 0)} ${PAY_SYMBOL}` : EMPTY}
          />
          <Stat label="Total tokens" value={asset.totalShares.toLocaleString('en-US')} />
          <Stat
            label="Platform fees"
            value={economics ? `${amount(economics.platformFeePercent, 0)}% on revenues` : EMPTY}
          />
          <Stat label="Blockchain" value="Stellar" />
          <Stat label="Symbol" value={asset.symbol} />
        </div>

        {/* Net yield */}
        {economics && (
          <div className="mt-3 rounded-xl bg-green-50 p-3.5">
            <div className="flex items-center gap-2">
              <LineChart className="h-5 w-5 text-green-600" />
              <span className="font-titleSemibold text-color4">Net yield</span>
              <span className="ml-auto font-titleSemibold text-green-600">
                {amount(economics.netYieldPercent)}%/year
              </span>
            </div>
            <p className="mt-1 pl-7 text-xs text-gray-500">Dividends paid monthly in {PAY_SYMBOL}</p>
          </div>
        )}

        {/* CTA */}
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
