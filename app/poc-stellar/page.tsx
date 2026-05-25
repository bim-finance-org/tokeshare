'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { useStellarAccount } from '@/context/StellarContext';
import { useXlmPrice } from '@/hooks/useXlmPrice';
import StellarIcon from '@/components/icons/blockchains/StellarIcon';
import { Badge } from '@/components/ui/badge';

const TOKEN_PRICE_USD = 50;
const TOKEN_SYMBOL = 'TRES';
const PROPERTY = {
  name: 'Villa Coral, Las Terrenas, Dominican Republic',
  city: 'Playa Bonita',
  country: 'Dominican Republic',
  image: '/images/img-house-2.webp',
  surface: '142 m²',
  bedrooms: '3 Beds',
  bathrooms: '2 Baths',
  totalValue: '$ 420.000',
  totalTokens: '8.400',
  expectedIncome: '7% - 10%',
};

const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-6)}`;

const PocStellarPage = () => {
  const { address, isConnected, connect, disconnect } = useStellarAccount();
  const { data: xlmPrice, isLoading: isXlmLoading } = useXlmPrice();

  // The user types in exactly one of the two inputs at a time. We store that
  // single value + which side it represents, and derive the other side
  // during render — no effect, no cascade.
  const [inputValue, setInputValue] = useState('');
  const [inputSide, setInputSide] = useState<'xlm' | 'token'>('xlm');
  const [purchased, setPurchased] = useState<{ xlm: string; tokens: string } | null>(null);

  const xlmToUsd = xlmPrice ?? 0;
  const tokensPerXlm = xlmToUsd > 0 ? xlmToUsd / TOKEN_PRICE_USD : 0;

  const derivedOtherSide = useMemo(() => {
    if (!xlmPrice) return '';
    const num = parseFloat(inputValue);
    if (isNaN(num) || num <= 0) return '';
    if (inputSide === 'xlm') return ((num * xlmPrice) / TOKEN_PRICE_USD).toFixed(4);
    return ((num * TOKEN_PRICE_USD) / xlmPrice).toFixed(4);
  }, [inputValue, inputSide, xlmPrice]);

  const xlmAmount = inputSide === 'xlm' ? inputValue : derivedOtherSide;
  const tokenAmount = inputSide === 'token' ? inputValue : derivedOtherSide;

  const handleXlmChange = (value: string) => {
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setInputSide('xlm');
      setInputValue(value);
    }
  };

  const handleTokenChange = (value: string) => {
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setInputSide('token');
      setInputValue(value);
    }
  };

  const isInvalid = !xlmAmount || parseFloat(xlmAmount) <= 0 || !tokenAmount || parseFloat(tokenAmount) <= 0;

  const handleBuy = () => {
    if (!isConnected) {
      connect();
      return;
    }
    if (isInvalid) return;
    setPurchased({ xlm: xlmAmount, tokens: tokenAmount });
  };

  return (
    <div className="min-h-screen bg-color1">
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center gap-3">
          <Badge className="bg-color3 text-color4">POC — Stellar</Badge>
          <p className="text-sm text-color6">
            Proof of concept · pay with XLM · prices are live · no transaction is broadcast
          </p>
        </div>

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
                  <span className="font-semibold text-color4">${TOKEN_PRICE_USD.toFixed(2)}</span>
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

            {/* YOU SEND - XLM */}
            <div className="bg-color1 p-4 rounded-xl shadow-sm">
              <div className="flex justify-between items-center gap-4">
                <div className="flex-1">
                  <label className="block text-xs uppercase text-color6 mb-1">You send</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={xlmAmount}
                    onChange={(e) => handleXlmChange(e.target.value)}
                    placeholder="0.0"
                    className="w-full bg-transparent text-2xl font-semibold text-color4 outline-none"
                  />
                </div>
                <div className="flex items-center gap-2 bg-white rounded-full px-3 py-2">
                  <StellarIcon size={24} />
                  <span className="font-semibold text-color4">XLM</span>
                </div>
              </div>
            </div>

            {/* YOU RECEIVE - TOKEN */}
            <div className="bg-color1 p-4 rounded-xl shadow-sm">
              <div className="flex justify-between items-center gap-4">
                <div className="flex-1">
                  <label className="block text-xs uppercase text-color6 mb-1">You receive</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={tokenAmount}
                    onChange={(e) => handleTokenChange(e.target.value)}
                    placeholder="0.0"
                    className="w-full bg-transparent text-2xl font-semibold text-color4 outline-none"
                  />
                </div>
                <div className="flex items-center gap-2 bg-white rounded-full px-3 py-2">
                  <span className="font-semibold text-color4">{TOKEN_SYMBOL}</span>
                </div>
              </div>
            </div>

            {/* Rate info */}
            <div className="bg-color1 rounded-lg p-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-color6">XLM price</span>
                <Badge className="font-medium">
                  {isXlmLoading ? '...' : xlmToUsd ? `$${xlmToUsd.toFixed(4)}` : 'unavailable'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-color6">1 {TOKEN_SYMBOL}</span>
                <Badge className="font-medium">${TOKEN_PRICE_USD.toFixed(2)}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-color6">Rate</span>
                <Badge className="font-medium">
                  {tokensPerXlm > 0 ? `1 XLM ≈ ${tokensPerXlm.toFixed(6)} ${TOKEN_SYMBOL}` : '—'}
                </Badge>
              </div>
            </div>

            <button
              type="button"
              onClick={handleBuy}
              disabled={isConnected && (isInvalid || isXlmLoading)}
              className="w-full bg-color4 text-white py-3 rounded-xl font-medium shadow-sm hover:bg-opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {!isConnected ? 'Connect Stellar wallet' : isInvalid ? 'Enter an amount' : `Buy ${tokenAmount} ${TOKEN_SYMBOL}`}
            </button>

            {purchased && (
              <div className="rounded-xl border border-green-500 bg-green-50 p-4 text-sm text-green-800">
                <p className="font-semibold">Purchase simulated</p>
                <p>
                  Sent {purchased.xlm} XLM · received {purchased.tokens} {TOKEN_SYMBOL}
                </p>
                <p className="mt-1 text-xs text-green-700">No transaction was broadcast — this is a PoC.</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default PocStellarPage;
