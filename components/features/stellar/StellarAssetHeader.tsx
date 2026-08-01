import React from 'react';
import Image from 'next/image';
import { ExternalLink } from 'lucide-react';
import { type StellarAsset } from '@/config/stellar-assets';
import StellarIcon from '@/components/icons/blockchains/StellarIcon';

const KIND_LABEL: Record<string, string> = { 'real-estate': 'Real estate', vehicle: 'Vehicle' };

/** Navy hero header for a Stellar RWA asset — matches AssetPageHeader's language. */
export default function StellarAssetHeader({ asset }: { asset: StellarAsset }) {
  const net = asset.network === 'mainnet' ? 'public' : 'testnet';
  const contractUrl = (id: string) => `https://stellar.expert/explorer/${net}/contract/${id}`;

  return (
    <div className="relative overflow-hidden rounded-3xl bg-color4 p-5 text-white shadow-lg ring-1 ring-black/5 sm:p-8">
      <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-blue-500/20 blur-3xl" />
      <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-inset ring-white/15">
              <StellarIcon size={30} />
            </span>
            <span className="rounded-full bg-white/10 px-3 py-1 text-sm font-semibold text-white ring-1 ring-inset ring-white/15">
              {asset.symbol}
            </span>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium capitalize text-white/80 ring-1 ring-inset ring-white/15">
              {KIND_LABEL[asset.kind] ?? asset.kind} · Stellar {asset.network}
            </span>
          </div>
          <h1 className="mt-4 font-titleSemibold text-2xl sm:text-3xl">{asset.name}</h1>
          {asset.location && <p className="mt-1 text-sm text-white/60">{asset.location}</p>}
          {asset.tokenId && (
            <div className="mt-5 flex flex-wrap gap-2 text-xs">
              <a
                href={contractUrl(asset.tokenId)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-white/80 ring-1 ring-inset ring-white/15 transition-colors hover:bg-white/15"
              >
                Token <ExternalLink className="h-3 w-3" />
              </a>
              {asset.saleId && (
                <a
                  href={contractUrl(asset.saleId)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-white/80 ring-1 ring-inset ring-white/15 transition-colors hover:bg-white/15"
                >
                  Sale contract <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          )}
        </div>

        <div className="relative h-44 w-full shrink-0 overflow-hidden rounded-2xl ring-1 ring-white/10 sm:h-52 md:w-72">
          <Image
            src={asset.image}
            alt={asset.name}
            fill
            sizes="(max-width: 768px) 100vw, 288px"
            priority
            className="object-cover"
          />
        </div>
      </div>
    </div>
  );
}
