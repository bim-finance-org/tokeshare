'use client';

// Investor portfolio: holdings across every RWA asset for the connected wallet.
// Works for any StellarContext signer (Wallets Kit today, Privy later). Balances
// come from each asset's token contract; value uses the live sale price when
// available, else the config price hint.

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Route } from 'next';
import { STELLAR_ASSETS, type StellarAsset } from '@/config/stellar-assets';
import { isPrivyEnabled } from '@/config/privy';
import { useStellarAccount } from '@/context/StellarContext';
import { useAssetBalance, useSaleInfo } from '@/hooks/useStellarAsset';
import StellarIcon from '@/components/icons/blockchains/StellarIcon';
import PrivyLoginButton from '@/components/features/stellar/PrivyLoginButton';

// Assets can span testnet + mainnet; both settle in USDC.
const PAY_SYMBOL = 'USDC';
const fmt = (n: number) => n.toLocaleString('en-US', { maximumFractionDigits: 2 });

function PortfolioRow({
  asset,
  onValue,
}: {
  asset: StellarAsset;
  onValue: (slug: string, value: number) => void;
}) {
  const { data: holdings } = useAssetBalance(asset);
  const { data: saleInfo } = useSaleInfo(asset);

  const units = parseFloat(holdings?.units ?? '0');
  const price = saleInfo ? parseFloat(saleInfo.priceUnits) : (asset.priceHintUsdc ?? 0);
  const value = units * price;

  useEffect(() => {
    onValue(asset.slug, value);
  }, [asset.slug, value, onValue]);

  return (
    <Link
      href={`/stellar/${asset.slug}` as Route}
      className="flex items-center gap-4 rounded-xl bg-white p-4 shadow-sm transition hover:shadow-md"
    >
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg">
        <Image src={asset.image} alt={asset.name} fill sizes="56px" className="object-cover" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-color4">{asset.name}</p>
        <p className="font-mono text-xs text-color6">
          {asset.symbol} · {asset.network}
        </p>
      </div>
      <div className="text-right">
        <p className="font-semibold text-color4">
          {fmt(units)} {asset.symbol}
        </p>
        <p className="text-xs text-color6">
          ≈ {fmt(value)} {PAY_SYMBOL}
        </p>
      </div>
    </Link>
  );
}

export default function StellarPortfolioPage() {
  const { address, isConnected, connect } = useStellarAccount();
  const [values, setValues] = useState<Record<string, number>>({});

  const handleValue = useCallback((slug: string, value: number) => {
    setValues((prev) => (prev[slug] === value ? prev : { ...prev, [slug]: value }));
  }, []);

  const totalValue = Object.values(values).reduce((sum, v) => sum + v, 0);

  return (
    <div className="min-h-screen bg-color1">
      <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center gap-3">
          <Link href={'/stellar' as Route} className="text-sm text-color6 underline hover:text-color4">
            ← Marketplace
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-color4">My portfolio</h1>

        {!isConnected ? (
          <div className="mt-8 rounded-2xl bg-white p-8 text-center shadow-md">
            <p className="text-color6">Connect your Stellar wallet to see your holdings.</p>
            <button
              type="button"
              onClick={() => connect()}
              className="mx-auto mt-4 flex items-center gap-2 rounded-lg bg-color4 px-4 py-2 text-sm text-white"
            >
              <StellarIcon size={20} />
              Connect
            </button>
            {isPrivyEnabled && (
              <PrivyLoginButton className="mx-auto mt-3 rounded-lg border border-color4 px-4 py-2 text-sm font-medium text-color4 transition hover:bg-color1" />
            )}
          </div>
        ) : (
          <>
            <div className="mt-6">
              <div className="rounded-xl bg-white p-4 shadow-sm">
                <p className="text-xs uppercase text-color6">Estimated total value</p>
                <p className="mt-1 text-2xl font-bold text-color4">
                  {fmt(totalValue)} {PAY_SYMBOL}
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {STELLAR_ASSETS.map((asset) => (
                <PortfolioRow key={asset.slug} asset={asset} onValue={handleValue} />
              ))}
            </div>

            <p className="mt-4 break-all text-center font-mono text-xs text-color6">{address}</p>
          </>
        )}
      </div>
    </div>
  );
}
