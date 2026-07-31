import Image from 'next/image';
import Link from 'next/link';
import type { Route } from 'next';
import { STELLAR_ASSETS, isAssetConfigured } from '@/config/stellar-assets';
import { Badge } from '@/components/ui/badge';

export const metadata = {
  title: 'Stellar Marketplace — Tokeshare',
  description: 'Invest in tokenized real-world assets on Stellar.',
};

const KIND_LABEL: Record<string, string> = {
  'real-estate': 'Real estate',
  vehicle: 'Vehicle',
};

export default function StellarMarketplacePage() {
  return (
    <div className="min-h-screen bg-color1">
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-color4">Stellar Marketplace</h1>
            <p className="mt-1 text-sm text-color6">Tokenized real-world assets, buyable with USDC on Stellar.</p>
          </div>
          <Link
            href={'/user/dashboard' as Route}
            className="rounded-lg bg-color4 px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90"
          >
            My portfolio
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {STELLAR_ASSETS.map((asset) => (
            <Link
              key={asset.slug}
              href={`/stellar/${asset.slug}` as Route}
              className="group block overflow-hidden rounded-2xl bg-white shadow-md transition hover:shadow-lg"
            >
              <div className="relative aspect-[3/2] w-full">
                <Image
                  src={asset.image}
                  alt={asset.name}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover"
                />
                <div className="absolute left-3 top-3 flex gap-2">
                  <Badge className="bg-color3 text-color4">{KIND_LABEL[asset.kind] ?? asset.kind}</Badge>
                  {!isAssetConfigured(asset) && <Badge className="bg-amber-100 text-amber-800">Coming soon</Badge>}
                </div>
              </div>
              <div className="space-y-2 p-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-color4">{asset.name}</h2>
                  <span className="font-mono text-xs text-color6">{asset.symbol}</span>
                </div>
                {asset.location && <p className="text-sm text-color6">{asset.location}</p>}
                <div className="flex items-center justify-between pt-2 text-sm">
                  <span className="text-color6">{asset.totalShares.toLocaleString('en-US')} shares</span>
                  {asset.priceHintUsdc != null && (
                    <span className="font-semibold text-color4">
                      ≈ {asset.priceHintUsdc} {'USDC'} / share
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
