import Link from 'next/link';
import type { Route } from 'next';
import { STELLAR_ASSETS } from '@/config/stellar-assets';
import MarketplaceHero from '@/components/shared/MarketplaceHero';
import StellarAssetCard from '@/components/features/stellar/StellarAssetCard';

export const metadata = {
  title: 'Stellar Marketplace · Tokeshare',
  description: 'Invest in tokenized real-world assets on Stellar.',
};

export default function StellarMarketplacePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="space-y-8">
        <MarketplaceHero
          eyebrow="Stellar"
          title="Invest in real-world assets on Stellar"
          action={
            <Link
              href={'/user/dashboard' as Route}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 font-titleSemibold text-color4 shadow-sm transition-colors hover:bg-color2 hover:text-white"
            >
              My portfolio
            </Link>
          }
        >
          <p>Buy fractional shares of tokenized assets, settled in USDC on the Stellar network.</p>
          <p>Fast, low-fee, on-chain — with a Tokeshare buyback whenever you want to exit.</p>
        </MarketplaceHero>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {STELLAR_ASSETS.map((asset) => (
            <StellarAssetCard key={asset.slug} asset={asset} />
          ))}
        </div>
      </div>
    </div>
  );
}
