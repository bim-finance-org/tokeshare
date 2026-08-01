'use client';

// Swap-style trade widget for a Stellar RWA asset, mirroring the EVM Swap UI: two
// stacked fields (YOU SEND / YOU RECEIVE) with a circular switch button between
// them. The switch flips direction:
//   buy  — send USDC, receive shares (sale.buy, auto-allowlists the buyer)
//   sell — send shares, receive net USDC (sale.sell buyback, quote_sell authoritative)
// The only exit is the Tokeshare buyback — there is no peer-to-peer market.

import { useState } from 'react';
import Image from 'next/image';
import { Loader2 } from 'lucide-react';
import { type StellarAsset, isAssetConfigured } from '@/config/stellar-assets';
import { getNetworkProfile } from '@/config/stellar';
import { useStellarAccount } from '@/context/StellarContext';
import {
  useAddPaymentTrustline,
  useAssetBalance,
  useBuyAsset,
  useBuybackInfo,
  useClassicBalances,
  useIsAllowed,
  usePaymentTrustline,
  useSaleInfo,
  useSellAsset,
  useSellQuote,
} from '@/hooks/useStellarAsset';
import { explorerTxUrl } from '@/lib/stellar';
import { toReadableStellarError } from '@/lib/stellar-errors';
import StellarConnectButton from '@/components/features/stellar/StellarConnectButton';

const CONTACT_HREF = 'mailto:contact@tokeshare.co';
const num = (v?: string) => parseFloat(v ?? '0') || 0;
const fmt = (n: number) => n.toLocaleString('en-US', { maximumFractionDigits: 4 });

function Field({
  label,
  value,
  onChange,
  symbol,
  balance,
  max,
  readOnly,
  loading,
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  symbol: string;
  balance?: string;
  /** When set (>0) and editable, shows a MAX button that fills this amount. */
  max?: string;
  readOnly?: boolean;
  loading?: boolean;
}) {
  const showMax = !readOnly && max != null && num(max) > 0;
  return (
    <div className="rounded-2xl bg-color1 p-4 ring-1 ring-inset ring-black/5">
      <div className="flex items-center justify-between gap-2">
        <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">{label}</label>
        <div className="flex items-center gap-2">
          {showMax && (
            <button
              type="button"
              onClick={() => onChange?.(max!)}
              className="rounded-lg bg-color4 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-white transition-all hover:bg-color2 active:scale-95"
            >
              MAX
            </button>
          )}
          {balance != null && <span className="text-xs text-gray-500">Balance: {fmt(num(balance))}</span>}
        </div>
      </div>
      <div className="mt-1 flex items-center justify-between gap-3">
        {readOnly ? (
          <p className="min-w-0 flex-1 truncate text-2xl font-titleSemibold text-color4">
            {loading ? <Loader2 className="h-5 w-5 animate-spin text-gray-400" /> : fmt(num(value))}
          </p>
        ) : (
          <input
            type="text"
            inputMode="decimal"
            value={value}
            onChange={(e) => {
              const v = e.target.value;
              if (v === '' || /^\d*\.?\d*$/.test(v)) onChange?.(v);
            }}
            placeholder="0"
            className="min-w-0 flex-1 bg-transparent text-2xl font-titleSemibold text-color4 outline-none"
          />
        )}
        <span className="shrink-0 rounded-full bg-white px-3 py-2 text-sm font-semibold text-color4 ring-1 ring-inset ring-black/5">
          {symbol}
        </span>
      </div>
    </div>
  );
}

export default function StellarSwap({ asset }: { asset: StellarAsset }) {
  const PAY = getNetworkProfile(asset.network).pay.code;
  const { isConnected } = useStellarAccount();

  const [isSell, setIsSell] = useState(false);
  const [input, setInput] = useState('');

  const { data: saleInfo, isLoading: isSaleLoading } = useSaleInfo(asset);
  const { data: holdings } = useAssetBalance(asset);
  const { data: balances } = useClassicBalances(asset);
  const { data: hasTrustline } = usePaymentTrustline(asset);
  const { data: buyback } = useBuybackInfo(asset);
  const { data: allowed } = useIsAllowed(asset);
  const addTrustline = useAddPaymentTrustline(asset);
  const buy = useBuyAsset(asset);
  const sell = useSellAsset(asset);
  const { data: sellQuote, isFetching: quotingSell } = useSellQuote(asset, isSell ? input : '');

  const configured = isAssetConfigured(asset);
  const priceUnits = saleInfo ? num(saleInfo.priceUnits) : (asset.priceHintUsdc ?? 0);
  const available = saleInfo ? num(saleInfo.availableUnits) : 0;
  const heldUnits = num(holdings?.units);
  const usdcBalance = num(balances?.usdc);
  const feePct = buyback ? buyback.feeBps / 100 : 0;
  const buybackAvailable = buyback ? num(buyback.availableUnits) : 0;

  // Direction-dependent amounts. `input` is always the top (YOU SEND) field.
  const inputNum = num(input);
  const sharesOut = !isSell && priceUnits > 0 ? inputNum / priceUnits : 0; // buy: USDC -> shares
  const netUsdcOut = sellQuote ? num(sellQuote.netUnits) : 0; // sell: shares -> net USDC

  const sendSymbol = isSell ? asset.symbol : PAY;
  const receiveSymbol = isSell ? PAY : asset.symbol;
  const sendBalance = isSell ? holdings?.units : balances?.usdc;
  const receiveBalance = isSell ? balances?.usdc : holdings?.units;
  const outputValue = isSell ? String(netUsdcOut) : String(sharesOut);

  // MAX = what you can actually send: all USDC to buy, or the most sellable shares
  // (capped by the contract's buyback float).
  const maxSend = isSell ? Math.min(heldUnits, buybackAvailable) : usdcBalance;
  const maxSendStr = maxSend > 0 ? String(maxSend) : undefined;

  const handleSwitch = () => {
    setInput(outputValue && num(outputValue) > 0 ? outputValue : '');
    setIsSell((s) => !s);
  };

  // ---- gating ----
  const needsTrustline = !isSell && isConnected && hasTrustline === false;
  const closed = isSell && buyback ? !buyback.isOpen : false;
  const notAllowed = isSell && allowed === false;
  const exceedsInventory = !isSell && available > 0 && sharesOut > available;
  const insufficientUsdc = !isSell && isConnected && inputNum > 0 && inputNum > usdcBalance;
  const exceedsHoldings = isSell && inputNum > heldUnits;
  const exceedsFloat = isSell && inputNum > 0 && inputNum > buybackAvailable;

  const isPending = buy.isPending || sell.isPending;
  const isInvalid =
    inputNum <= 0 ||
    needsTrustline ||
    closed ||
    notAllowed ||
    exceedsInventory ||
    insufficientUsdc ||
    exceedsHoldings ||
    exceedsFloat;

  const label = isPending
    ? 'Processing…'
    : inputNum <= 0
      ? 'Enter an amount'
      : needsTrustline
        ? `Enable ${PAY} first`
        : closed
          ? 'Buyback closed'
          : notAllowed
            ? 'Address not authorized'
            : exceedsInventory
              ? 'Not enough inventory'
              : insufficientUsdc
                ? `Not enough ${PAY}`
                : exceedsHoldings
                  ? 'More than you hold'
                  : exceedsFloat
                    ? 'Insufficient buyback funds'
                    : isSell
                      ? `Sell ${asset.symbol}`
                      : `Buy ${asset.symbol}`;

  const handleAction = () => {
    if (isInvalid) return;
    if (isSell) sell.mutate(input);
    else buy.mutate(String(sharesOut));
  };

  const active = isSell ? sell : buy;

  return (
    <section className="mx-auto w-full max-w-md overflow-hidden rounded-3xl bg-white ring-1 ring-black/5 shadow-[0_24px_60px_-24px_rgba(20,20,45,0.28)] sm:max-w-lg">
      <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 pb-3 pt-4 sm:px-6 sm:pt-5">
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate text-base font-titleSemibold text-color4 sm:text-lg">Swap {asset.name}</span>
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-color2" />
        </div>
        <span className="shrink-0 text-[11px] font-medium tracking-wide text-gray-400 sm:text-xs">Instant · On-chain</span>
      </div>

      <div className="p-4 sm:p-6">
      {!configured && (
        <div className="mb-4 rounded-xl border border-amber-400 bg-amber-50 p-4 text-sm text-amber-800">
          This asset is not on-chain yet.
        </div>
      )}

      {/* Swap fields with the centered switch */}
      <div className="relative flex flex-col gap-4">
        <Field
          label="You send"
          value={input}
          onChange={setInput}
          symbol={sendSymbol}
          balance={isConnected ? sendBalance : undefined}
          max={isConnected ? maxSendStr : undefined}
        />

        <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
          <button
            type="button"
            onClick={handleSwitch}
            aria-label="Switch direction"
            className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-md ring-1 ring-black/10 transition-transform duration-300 hover:rotate-180 hover:scale-110 active:scale-95"
          >
            <span className="relative h-7 w-7">
              <Image src="/images/switch.png" alt="Switch" fill sizes="28px" className="object-contain" />
            </span>
          </button>
        </div>

        <Field
          label="You receive"
          value={outputValue}
          symbol={receiveSymbol}
          balance={isConnected ? receiveBalance : undefined}
          readOnly
          loading={isSell ? quotingSell && inputNum > 0 : isSaleLoading}
        />
      </div>

      {/* Enable USDC (buy path, fresh wallet) */}
      {needsTrustline && (
        <div className="mt-4 space-y-2 rounded-xl border border-blue-300 bg-blue-50 p-4 text-sm text-blue-900">
          <p>Your wallet doesn&apos;t trust {PAY} yet. Enable it once to send and receive {PAY}.</p>
          <button
            type="button"
            onClick={() => addTrustline.mutate()}
            disabled={addTrustline.isPending}
            className="rounded-lg bg-color4 px-3 py-1.5 text-white disabled:opacity-50"
          >
            {addTrustline.isPending ? 'Enabling…' : `Enable ${PAY}`}
          </button>
        </div>
      )}

      {/* Info panel */}
      <div className="mt-4 space-y-2.5 rounded-2xl bg-color1 px-3.5 py-3 text-sm ring-1 ring-inset ring-black/5">
        <div className="flex items-center justify-between">
          <span className="font-medium text-gray-500">Price</span>
          <span className="font-semibold tabular-nums text-color4">
            {isSaleLoading ? '…' : `1 ${asset.symbol} = ${saleInfo ? saleInfo.priceUnits : priceUnits} ${PAY}`}
          </span>
        </div>
        {isSell ? (
          <>
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-500">Buyback fee</span>
              <span className="font-semibold tabular-nums text-color4">{feePct}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-500">Buyback capacity</span>
              <span className="font-semibold tabular-nums text-color4">
                {buyback ? `${fmt(buybackAvailable)} ${asset.symbol}` : '—'}
              </span>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-between">
            <span className="font-medium text-gray-500">Available</span>
            <span className="font-semibold tabular-nums text-color4">
              {isSaleLoading ? '…' : saleInfo ? `${fmt(available)} ${asset.symbol}` : '—'}
            </span>
          </div>
        )}
      </div>

      {/* Insufficient-float contact hint */}
      {exceedsFloat && (
        <p className="mt-3 text-sm text-amber-700">
          Buyback funds are limited right now.{' '}
          <a href={CONTACT_HREF} className="font-semibold underline">
            Contact us
          </a>{' '}
          to arrange a larger exit.
        </p>
      )}

      {/* Action */}
      <div className="mt-4">
        {isConnected ? (
          <button
            type="button"
            onClick={handleAction}
            disabled={!configured || isInvalid}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-color4 py-3.5 font-titleSemibold tracking-wide text-white shadow-md transition-all hover:bg-color2 hover:shadow-lg disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {label}
          </button>
        ) : (
          <StellarConnectButton
            label="Connect to trade"
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-color4 py-3.5 font-titleSemibold text-white shadow-md transition-all hover:bg-color2"
          />
        )}
      </div>

      {active.isError && (
        <div className="mt-3 rounded-xl border border-red-400 bg-red-50 p-4 text-sm text-red-800">
          <p className="font-semibold">{isSell ? 'Sale' : 'Purchase'} failed</p>
          <p className="break-words">{toReadableStellarError(active.error)}</p>
        </div>
      )}

      {active.isSuccess && active.data && (
        <div className="mt-3 rounded-xl border border-green-500 bg-green-50 p-4 text-sm text-green-800">
          <p className="font-semibold">{isSell ? 'Buyback' : 'Purchase'} confirmed</p>
          <a
            href={explorerTxUrl(asset.network, active.data)}
            target="_blank"
            rel="noopener noreferrer"
            className="break-all underline"
          >
            View transaction on Stellar Expert
          </a>
        </div>
      )}
      </div>
    </section>
  );
}
