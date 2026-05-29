'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useStellarAccount } from '@/context/StellarContext';
import { useBuyTres, useSaleInfo, useStellarBalances } from '@/hooks/useTresSale';
import { stellarConfig, isStellarConfigured } from '@/config/stellar';
import { explorerTxUrl } from '@/lib/stellar';
import StellarIcon from '@/components/icons/blockchains/StellarIcon';
import { Badge } from '@/components/ui/badge';

const TOKEN_SYMBOL = stellarConfig.tres.code;
const PAY_SYMBOL = stellarConfig.pay.code;
const PROPERTY = {
  name: 'Angel Cœur Caribe, Las Terrenas, Dominican Republic',
  city: 'Playa Bonita',
  country: 'Dominican Republic',
  image: '/images/stellar/steallr_poc.jpeg',
  surface: '96 m²',
  bedrooms: '2 Beds',
  bathrooms: '2 Baths',
  totalValue: '$ 230.000',
  totalTokens: '23.000',
  expectedIncome: '7% - 12%',
};

const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-6)}`;

const PocStellarPage = () => {
  const { address, isConnected, connect, disconnect } = useStellarAccount();
  const { data: saleInfo, isLoading: isSaleLoading } = useSaleInfo();
  const { data: balances } = useStellarBalances();
  const buy = useBuyTres();

  const [tokenAmount, setTokenAmount] = useState('');

  const fmtBalance = (value?: string) =>
    parseFloat(value ?? '0').toLocaleString('en-US', { maximumFractionDigits: 2 });

  const priceUnits = saleInfo ? parseFloat(saleInfo.priceUnits) : 0;
  const tokenNum = parseFloat(tokenAmount) || 0;
  const cost = tokenNum > 0 && priceUnits > 0 ? tokenNum * priceUnits : 0;
  const available = saleInfo ? parseFloat(saleInfo.availableUnits) : 0;

  const handleAmountChange = (value: string) => {
    if (value === '' || /^\d*\.?\d*$/.test(value)) setTokenAmount(value);
  };

  const exceedsInventory = available > 0 && tokenNum > available;
  const isInvalid = tokenNum <= 0 || exceedsInventory;

  const handleBuy = () => {
    if (!isConnected) {
      connect();
      return;
    }
    if (isInvalid) return;
    buy.mutate(tokenAmount);
  };

  const buttonLabel = !isConnected
    ? 'Connect Stellar wallet'
    : buy.isPending
      ? 'Processing…'
      : exceedsInventory
        ? 'Not enough inventory'
        : tokenNum <= 0
          ? 'Enter an amount'
          : `Buy ${tokenAmount} ${TOKEN_SYMBOL}`;

  return (
    <div className="min-h-screen bg-color1">
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center gap-3">
          <Badge className="bg-color3 text-color4">POC — Stellar</Badge>
          <p className="text-sm text-color6">
            Real on-chain purchase · pay with {PAY_SYMBOL} on Stellar · fixed price
          </p>
        </div>

        {!isStellarConfigured && (
          <div className="mb-6 rounded-xl border border-amber-400 bg-amber-50 p-4 text-sm text-amber-800">
            The sale contract is not configured yet. Set the <code>NEXT_PUBLIC_*</code> Stellar variables to enable
            purchases.
          </div>
        )}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Property card */}
          <section className="bg-white rounded-2xl shadow-md overflow-hidden">
            <div className="relative h-72 w-full">
              <Image src={PROPERTY.image} alt={PROPERTY.name} fill className="object-cover" priority />
            </div>
            <div className="p-6 space-y-4">
              <div>
                <h1 className="text-2xl font-bold text-color4">{PROPERTY.name}</h1>
                <p className="text-sm text-color6">
                  {PROPERTY.city}, {PROPERTY.country}
                </p>
              </div>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div className="bg-color1 rounded-lg p-3">
                  <p className="text-color6 text-xs uppercase">Surface</p>
                  <p className="font-semibold text-color4">{PROPERTY.surface}</p>
                </div>
                <div className="bg-color1 rounded-lg p-3">
                  <p className="text-color6 text-xs uppercase">Bedrooms</p>
                  <p className="font-semibold text-color4">{PROPERTY.bedrooms}</p>
                </div>
                <div className="bg-color1 rounded-lg p-3">
                  <p className="text-color6 text-xs uppercase">Bathrooms</p>
                  <p className="font-semibold text-color4">{PROPERTY.bathrooms}</p>
                </div>
              </div>
              <div className="border-t border-color1 pt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-color6">Total value</span>
                  <span className="font-semibold text-color4">{PROPERTY.totalValue}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-color6">Total tokens</span>
                  <span className="font-semibold text-color4">{PROPERTY.totalTokens}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-color6">Token price</span>
                  <span className="font-semibold text-color4">
                    {saleInfo ? `${saleInfo.priceUnits} ${PAY_SYMBOL}` : '—'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-color6">Expected income</span>
                  <span className="font-semibold text-color4">{PROPERTY.expectedIncome}</span>
                </div>
              </div>
            </div>
          </section>

          {/* Buy widget */}
          <section className="bg-white rounded-2xl shadow-md p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-color4">Buy with Stellar</h2>
              {isConnected ? (
                <div className="flex items-center gap-2">
                  <StellarIcon size={28} />
                  <span className="font-mono text-sm text-color4">{formatAddress(address!)}</span>
                  <button
                    type="button"
                    onClick={() => disconnect()}
                    className="ml-2 text-xs underline text-color6 hover:text-color4"
                  >
                    disconnect
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => connect()}
                  className="flex items-center gap-2 rounded-lg bg-color4 px-3 py-1.5 text-sm text-white"
                >
                  <StellarIcon size={20} />
                  Connect
                </button>
              )}
            </div>

            {isConnected && (
              <div className="flex items-center justify-between rounded-lg bg-color1 px-3 py-2 text-sm">
                <span className="text-color6">Your balance</span>
                <span className="font-medium text-color4">
                  {fmtBalance(balances?.tres)} {TOKEN_SYMBOL}
                </span>
              </div>
            )}

            {/* YOU BUY - TOKEN */}
            <div className="bg-color1 p-4 rounded-xl shadow-sm">
              <div className="flex justify-between items-center gap-4">
                <div className="flex-1">
                  <label className="block text-xs uppercase text-color6 mb-1">You buy</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={tokenAmount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    placeholder="0"
                    className="w-full bg-transparent text-2xl font-semibold text-color4 outline-none"
                  />
                </div>
                <div className="flex items-center gap-2 bg-white rounded-full px-3 py-2">
                  <span className="font-semibold text-color4">{TOKEN_SYMBOL}</span>
                </div>
              </div>
            </div>

            {/* YOU PAY - USDC */}
            <div className="bg-color1 p-4 rounded-xl shadow-sm">
              <div className="flex justify-between items-center gap-4">
                <div className="flex-1">
                  <label className="block text-xs uppercase text-color6 mb-1">You pay</label>
                  <p className="w-full text-2xl font-semibold text-color4">{cost > 0 ? cost.toFixed(2) : '0.00'}</p>
                </div>
                <div className="flex items-center gap-2 bg-white rounded-full px-3 py-2">
                  <span className="font-semibold text-color4">{PAY_SYMBOL}</span>
                </div>
              </div>
            </div>

            {/* Rate info */}
            <div className="bg-color1 rounded-lg p-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-color6">Price</span>
                <Badge className="font-medium">
                  {isSaleLoading ? '...' : saleInfo ? `1 ${TOKEN_SYMBOL} = ${saleInfo.priceUnits} ${PAY_SYMBOL}` : '—'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-color6">Available</span>
                <Badge className="font-medium">
                  {isSaleLoading ? '...' : saleInfo ? `${saleInfo.availableUnits} ${TOKEN_SYMBOL}` : '—'}
                </Badge>
              </div>
            </div>

            <button
              type="button"
              onClick={handleBuy}
              disabled={!isStellarConfigured || (isConnected && (isInvalid || buy.isPending))}
              className="w-full bg-color4 text-white py-3 rounded-xl font-medium shadow-sm hover:bg-opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {buttonLabel}
            </button>

            {buy.isError && (
              <div className="rounded-xl border border-red-400 bg-red-50 p-4 text-sm text-red-800">
                <p className="font-semibold">Purchase failed</p>
                <p className="break-words">{buy.error instanceof Error ? buy.error.message : 'Unknown error'}</p>
              </div>
            )}

            {buy.isSuccess && buy.data && (
              <div className="rounded-xl border border-green-500 bg-green-50 p-4 text-sm text-green-800">
                <p className="font-semibold">Purchase confirmed</p>
                <a
                  href={explorerTxUrl(buy.data)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline break-all"
                >
                  View transaction on Stellar Expert
                </a>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default PocStellarPage;
