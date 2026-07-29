'use client';

// Buyback ("sell back to Tokeshare") panel for a single RWA asset. Self-hides
// unless the connected wallet holds shares. The only exit offered is the
// contract's buyback — there is NO peer-to-peer secondary market.
//
// State is resolved on-chain BEFORE the user can sign, so we never let them
// submit a doomed transaction:
//   1. buyback closed (price 0)            -> disabled, "closed" message
//   2. buyback float too small for amount  -> disabled, contact-us message
//   3. seller removed from the allowlist   -> disabled (#113 on-chain)
//   4. otherwise                           -> show net payout, enabled
// The net payout comes straight from quote_sell (fees + rounding authoritative);
// the fee percentage is read from fee_bps, never hardcoded.

import { useState } from 'react';
import { type StellarAsset } from '@/config/stellar-assets';
import { getNetworkProfile } from '@/config/stellar';
import { useStellarAccount } from '@/context/StellarContext';
import { useAssetBalance, useBuybackInfo, useIsAllowed, useSellAsset, useSellQuote } from '@/hooks/useStellarAsset';
import { explorerTxUrl } from '@/lib/stellar';
import { toReadableStellarError } from '@/lib/stellar-errors';

const CONTACT_HREF = 'mailto:contact@tokeshare.co';
const fmt = (value: number) => value.toLocaleString('en-US', { maximumFractionDigits: 2 });

export default function SellPanel({ asset }: { asset: StellarAsset }) {
  const PAY_SYMBOL = getNetworkProfile(asset.network).pay.code;
  const { isConnected } = useStellarAccount();
  const { data: holdings } = useAssetBalance(asset);
  const { data: buyback } = useBuybackInfo(asset);
  const { data: allowed } = useIsAllowed(asset);
  const [amount, setAmount] = useState('');
  const { data: quote, isFetching: quoting } = useSellQuote(asset, amount);
  const sell = useSellAsset(asset);

  const heldUnits = parseFloat(holdings?.units ?? '0');

  // Self-hide: resale only makes sense for holders.
  if (!isConnected || heldUnits <= 0) return null;

  const shareNum = parseFloat(amount) || 0;
  const buybackAvailable = buyback ? parseFloat(buyback.availableUnits) : 0;
  const feePct = buyback ? buyback.feeBps / 100 : 0;
  const grossUnits = buyback ? shareNum * parseFloat(buyback.priceUnits) : 0;
  const netUnits = quote ? parseFloat(quote.netUnits) : 0;
  const feeUnits = grossUnits > 0 && netUnits > 0 ? Math.max(grossUnits - netUnits, 0) : 0;

  const closed = buyback ? !buyback.isOpen : false;
  const notAllowed = allowed === false;
  const exceedsHoldings = shareNum > heldUnits;
  const exceedsFloat = shareNum > 0 && shareNum > buybackAvailable;
  const isInvalid = shareNum <= 0 || closed || notAllowed || exceedsHoldings || exceedsFloat;

  const handleAmountChange = (value: string) => {
    if (value === '' || /^\d*\.?\d*$/.test(value)) setAmount(value);
  };

  const handleSell = () => {
    if (isInvalid) return;
    sell.mutate(amount);
  };

  const buttonLabel = closed
    ? 'Buyback closed'
    : notAllowed
      ? 'Address not authorized'
      : sell.isPending
        ? 'Processing…'
        : shareNum <= 0
          ? 'Enter an amount'
          : exceedsHoldings
            ? 'More than you hold'
            : exceedsFloat
              ? 'Insufficient buyback funds'
              : `Sell ${amount} ${asset.symbol}`;

  return (
    <section className="bg-white rounded-2xl shadow-md p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-color4">Sell back to Tokeshare</h2>
        <span className="text-sm text-color6">
          You hold {fmt(heldUnits)} {asset.symbol}
        </span>
      </div>

      {closed && (
        <div className="rounded-xl border border-amber-400 bg-amber-50 p-4 text-sm text-amber-800">
          The buyback desk is currently closed.
        </div>
      )}

      {!closed && notAllowed && (
        <div className="rounded-xl border border-red-400 bg-red-50 p-4 text-sm text-red-800">
          Your address is no longer authorized for this asset, so resale is blocked.
        </div>
      )}

      {!closed && !notAllowed && exceedsFloat && (
        <div className="rounded-xl border border-amber-400 bg-amber-50 p-4 text-sm text-amber-800">
          Insufficient buyback funds for this quantity.{' '}
          <a href={CONTACT_HREF} className="font-semibold underline">
            Contact us
          </a>{' '}
          to arrange your exit.
        </div>
      )}

      {/* YOU SELL */}
      <div className="bg-color1 p-4 rounded-xl shadow-sm">
        <div className="flex justify-between items-center gap-4">
          <div className="flex-1">
            <label className="block text-xs uppercase text-color6 mb-1">You sell</label>
            <input
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              placeholder="0"
              disabled={closed}
              className="w-full bg-transparent text-2xl font-semibold text-color4 outline-none disabled:opacity-50"
            />
          </div>
          <div className="flex items-center gap-2 bg-white rounded-full px-3 py-2">
            <span className="font-semibold text-color4">{asset.symbol}</span>
          </div>
        </div>
      </div>

      {/* YOU RECEIVE — net big, fee small */}
      <div className="bg-color1 p-4 rounded-xl shadow-sm">
        <label className="block text-xs uppercase text-color6 mb-1">You receive</label>
        <p className="text-2xl font-semibold text-color4">
          {quoting && shareNum > 0 ? '…' : fmt(netUnits)} {PAY_SYMBOL}
        </p>
        <p className="mt-1 text-xs text-color6">
          after {feePct}% fee
          {feeUnits > 0 ? ` (−${fmt(feeUnits)} ${PAY_SYMBOL})` : ''}
        </p>
      </div>

      {/* Buyback info */}
      <div className="bg-color1 rounded-lg p-3 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-color6">Buyback price</span>
          <span className="font-medium text-color4">
            {buyback && buyback.isOpen ? `${buyback.priceUnits} ${PAY_SYMBOL} / ${asset.symbol}` : '—'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-color6">Buyback capacity</span>
          <span className="font-medium text-color4">
            {buyback ? `${fmt(buybackAvailable)} ${asset.symbol}` : '—'}
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={handleSell}
        disabled={isInvalid || sell.isPending}
        className="w-full bg-color4 text-white py-3 rounded-xl font-medium shadow-sm hover:bg-opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {buttonLabel}
      </button>

      {sell.isError && (
        <div className="rounded-xl border border-red-400 bg-red-50 p-4 text-sm text-red-800">
          <p className="font-semibold">Sale failed</p>
          <p className="break-words">{toReadableStellarError(sell.error)}</p>
        </div>
      )}

      {sell.isSuccess && sell.data && (
        <div className="rounded-xl border border-green-500 bg-green-50 p-4 text-sm text-green-800">
          <p className="font-semibold">Buyback confirmed</p>
          <a
            href={explorerTxUrl(asset.network, sell.data)}
            target="_blank"
            rel="noopener noreferrer"
            className="underline break-all"
          >
            View transaction on Stellar Expert
          </a>
        </div>
      )}
    </section>
  );
}
