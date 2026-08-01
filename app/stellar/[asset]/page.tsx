import Image from 'next/image';
import Link from 'next/link';
import type { Route } from 'next';
import { ArrowLeft } from 'lucide-react';
import { notFound } from 'next/navigation';
import { STELLAR_ASSETS, getStellarAsset } from '@/config/stellar-assets';
import StellarSwap from '@/components/features/stellar/StellarSwap';
import StellarAssetHeader from '@/components/features/stellar/StellarAssetHeader';

export function generateStaticParams() {
  return STELLAR_ASSETS.map((a) => ({ asset: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ asset: string }> }) {
  const { asset: slug } = await params;
  const asset = getStellarAsset(slug);
  if (!asset) return { title: 'Asset not found · Tokeshare' };
  return { title: `${asset.name} · Tokeshare`, description: asset.description };
}

const Fact = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-2xl bg-color1 p-4 ring-1 ring-inset ring-black/5">
    <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">{label}</p>
    <p className="mt-0.5 font-titleSemibold text-color4">{value}</p>
  </div>
);

export default async function StellarAssetPage({ params }: { params: Promise<{ asset: string }> }) {
  const { asset: slug } = await params;
  const asset = getStellarAsset(slug);
  if (!asset) notFound();

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <Link
        href={'/stellar' as Route}
        className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-sm font-medium text-gray-500 shadow-sm ring-1 ring-black/5 transition-colors hover:text-color4"
      >
        <ArrowLeft className="h-4 w-4" />
        Marketplace
      </Link>

      <div className="mt-4 space-y-6">
        <StellarAssetHeader asset={asset} />

        {/* Swap sits right under the header, like the token pages. */}
        <StellarSwap asset={asset} />
      </div>

      {/* Asset details */}
      <div className="mt-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5 sm:mt-8 sm:p-8">
        <h2 className="font-titleSemibold text-lg text-color4">About this asset</h2>
        {asset.description && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-500">{asset.description}</p>}

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Fact label="Symbol" value={asset.symbol} />
          <Fact label="Total shares" value={asset.totalShares.toLocaleString('en-US')} />
          <Fact label="Network" value={`Stellar ${asset.network}`} />
          {asset.priceHintUsdc != null && <Fact label="Indicative price" value={`${asset.priceHintUsdc} USDC / share`} />}
        </div>

        {asset.gallery && asset.gallery.length > 1 && (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {asset.gallery.map((src) => (
              <div key={src} className="relative aspect-[4/3] overflow-hidden rounded-2xl ring-1 ring-black/5">
                <Image src={src} alt={asset.name} fill sizes="(max-width: 640px) 50vw, 260px" className="object-cover" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
