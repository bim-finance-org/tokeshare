import Image from 'next/image';
import Link from 'next/link';
import type { Route } from 'next';
import { notFound } from 'next/navigation';
import { STELLAR_ASSETS, getStellarAsset } from '@/config/stellar-assets';
import AssetBuyPanel from '@/components/features/stellar/AssetBuyPanel';
import SellPanel from '@/components/features/stellar/SellPanel';
import { Badge } from '@/components/ui/badge';

const KIND_LABEL: Record<string, string> = {
  'real-estate': 'Real estate',
  vehicle: 'Vehicle',
};

export function generateStaticParams() {
  return STELLAR_ASSETS.map((a) => ({ asset: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ asset: string }> }) {
  const { asset: slug } = await params;
  const asset = getStellarAsset(slug);
  if (!asset) return { title: 'Asset not found — Tokeshare' };
  return { title: `${asset.name} — Tokeshare`, description: asset.description };
}

export default async function StellarAssetPage({ params }: { params: Promise<{ asset: string }> }) {
  const { asset: slug } = await params;
  const asset = getStellarAsset(slug);
  if (!asset) notFound();

  return (
    <div className="min-h-screen bg-color1">
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center gap-3">
          <Link href={'/stellar' as Route} className="text-sm text-color6 underline hover:text-color4">
            ← Marketplace
          </Link>
          <Badge className="bg-color3 text-color4">{KIND_LABEL[asset.kind] ?? asset.kind}</Badge>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Asset card */}
          <section className="overflow-hidden rounded-2xl bg-white shadow-md">
            <div className="relative aspect-[3/2] w-full">
              <Image
                src={asset.image}
                alt={asset.name}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
                priority
              />
            </div>
            <div className="space-y-4 p-6">
              <div>
                <h1 className="text-2xl font-bold text-color4">{asset.name}</h1>
                {asset.location && <p className="text-sm text-color6">{asset.location}</p>}
              </div>
              {asset.description && <p className="text-sm text-color6">{asset.description}</p>}
              <div className="space-y-2 border-t border-color1 pt-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-color6">Symbol</span>
                  <span className="font-mono font-semibold text-color4">{asset.symbol}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-color6">Total shares</span>
                  <span className="font-semibold text-color4">{asset.totalShares.toLocaleString('en-US')}</span>
                </div>
                {asset.priceHintUsdc != null && (
                  <div className="flex justify-between">
                    <span className="text-color6">Indicative price</span>
                    <span className="font-semibold text-color4">≈ {asset.priceHintUsdc} USDC / share</span>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Buy + sell (sell self-hides unless the wallet holds shares) */}
          <div className="space-y-8">
            <AssetBuyPanel asset={asset} />
            <SellPanel asset={asset} />
          </div>
        </div>
      </div>
    </div>
  );
}
