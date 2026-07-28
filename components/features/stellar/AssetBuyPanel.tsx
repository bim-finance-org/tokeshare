'use client';

// Buy panel for a single RWA asset. Parameterized by asset, so it serves every
// marketplace detail page. Reads price/inventory + balances on-chain and drives
// the sale contract's `buy`. Signing is whatever StellarContext provides (Wallets
// Kit today, Privy later).

import { useState } from 'react';
import { type StellarAsset, isAssetConfigured } from '@/config/stellar-assets';
import { getNetworkProfile } from '@/config/stellar';
import { isPrivyEnabled } from '@/config/privy';
import { useStellarAccount } from '@/context/StellarContext';
import { useAssetBalance, useBuyAsset, useClassicBalances, useIsAllowed, useSaleInfo } from '@/hooks/useStellarAsset';
import { explorerTxUrl } from '@/lib/stellar';
import { toReadableStellarError } from '@/lib/stellar-errors';
import StellarIcon from '@/components/icons/blockchains/StellarIcon';
import PrivyLoginButton from '@/components/features/stellar/PrivyLoginButton';
import { Badge } from '@/components/ui/badge';

const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-6)}`;
const fmt = (value?: string) => parseFloat(value ?? '0').toLocaleString('en-US', { maximumFractionDigits: 2 });

export default function AssetBuyPanel({ asset }: { asset: StellarAsset }) {
  const PAY_SYMBOL = getNetworkProfile(asset.network).pay.code;
  const { address, isConnected, connect, disconnect } = useStellarAccount();
  const { data: saleInfo, isLoading: isSaleLoading } = useSaleInfo(asset);
  const { data: holdings } = useAssetBalance(asset);
  const { data: balances } = useClassicBalances(asset);
  const { data: allowed, isLoading: isAllowedLoading } = useIsAllowed(asset);
  const buy = useBuyAsset(asset);

  const [amount, setAmount] = useState('');

  const configured = isAssetConfigured(asset);
  const priceUnits = saleInfo ? parseFloat(saleInfo.priceUnits) : (asset.priceHintUsdc ?? 0);
  const shareNum = parseFloat(amount) || 0;
  const cost = shareNum > 0 && priceUnits > 0 ? shareNum * priceUnits : 0;
  const available = saleInfo ? parseFloat(saleInfo.availableUnits) : 0;

  const handleAmountChange = (value: string) => {
    if (value === '' || /^\d*\.?\d*$/.test(value)) setAmount(value);
  };

  const payBalance = parseFloat(balances?.usdc ?? '0');
  const exceedsInventory = available > 0 && shareNum > available;
  const insufficientPay = isConnected && cost > 0 && cost > payBalance;
  // allowed === false means the on-chain transfer would be rejected (Error #113):
  // block the buy up front rather than letting the buyer sign a doomed tx.
  const notAllowed = isConnected && allowed === false;
  const isInvalid = shareNum <= 0 || exceedsInventory || insufficientPay || notAllowed;

  const handleBuy = () => {
    if (!isConnected) {
      connect();
      return;
    }
    if (isInvalid) return;
    buy.mutate(amount);
  };

  const buttonLabel = !isConnected
    ? 'Connect Stellar wallet'
    : buy.isPending
      ? 'Processing…'
      : notAllowed
        ? 'Address not authorized'
        : exceedsInventory
          ? 'Not enough inventory'
          : shareNum <= 0
            ? 'Enter an amount'
            : insufficientPay
              ? `Not enough ${PAY_SYMBOL}`
              : `Buy ${amount} ${asset.symbol}`;

  return (
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

      {!configured && (
        <div className="rounded-xl border border-amber-400 bg-amber-50 p-4 text-sm text-amber-800">
          This asset is not on-chain yet. Its token and sale contracts still need to be deployed and their ids pasted
          into the config.
        </div>
      )}

      {!isConnected && isPrivyEnabled && (
        <PrivyLoginButton className="w-full rounded-lg border border-color4 py-2 text-sm font-medium text-color4 transition hover:bg-color1" />
      )}

      {isConnected && configured && (
        <div
          className={
            allowed === false
              ? 'rounded-xl border border-red-400 bg-red-50 p-3 text-sm text-red-800'
              : 'rounded-xl border border-green-500 bg-green-50 p-3 text-sm text-green-800'
          }
        >
          {isAllowedLoading
            ? 'Checking compliance…'
            : allowed === false
              ? 'Your address is not yet allowlisted for this asset, so purchases are blocked. Contact the issuer to be added to the allowlist.'
              : allowed
                ? '✓ Your address is allowlisted for this asset.'
                : null}
        </div>
      )}

      {isConnected && (
        <div className="rounded-lg bg-color1 px-3 py-2 text-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-color6">Your {asset.symbol} balance</span>
            <span className="font-medium text-color4">
              {fmt(holdings?.units)} {asset.symbol}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-color6">Your {PAY_SYMBOL} balance</span>
            <span className="font-medium text-color4">
              {fmt(balances?.usdc)} {PAY_SYMBOL}
            </span>
          </div>
        </div>
      )}

      {/* YOU BUY */}
      <div className="bg-color1 p-4 rounded-xl shadow-sm">
        <div className="flex justify-between items-center gap-4">
          <div className="flex-1">
            <label className="block text-xs uppercase text-color6 mb-1">You buy</label>
            <input
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              placeholder="0"
              className="w-full bg-transparent text-2xl font-semibold text-color4 outline-none"
            />
          </div>
          <div className="flex items-center gap-2 bg-white rounded-full px-3 py-2">
            <span className="font-semibold text-color4">{asset.symbol}</span>
          </div>
        </div>
      </div>

      {/* YOU PAY */}
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
            {isSaleLoading
              ? '...'
              : saleInfo
                ? `1 ${asset.symbol} = ${saleInfo.priceUnits} ${PAY_SYMBOL}`
                : asset.priceHintUsdc
                  ? `≈ 1 ${asset.symbol} = ${asset.priceHintUsdc} ${PAY_SYMBOL}`
                  : '—'}
          </Badge>
        </div>
        <div className="flex justify-between">
          <span className="text-color6">Available</span>
          <Badge className="font-medium">
            {isSaleLoading ? '...' : saleInfo ? `${saleInfo.availableUnits} ${asset.symbol}` : '—'}
          </Badge>
        </div>
      </div>

      <button
        type="button"
        onClick={handleBuy}
        disabled={!configured || (isConnected && (isInvalid || buy.isPending))}
        className="w-full bg-color4 text-white py-3 rounded-xl font-medium shadow-sm hover:bg-opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {buttonLabel}
      </button>

      {buy.isError && (
        <div className="rounded-xl border border-red-400 bg-red-50 p-4 text-sm text-red-800">
          <p className="font-semibold">Purchase failed</p>
          <p className="break-words">{toReadableStellarError(buy.error)}</p>
        </div>
      )}

      {buy.isSuccess && buy.data && (
        <div className="rounded-xl border border-green-500 bg-green-50 p-4 text-sm text-green-800">
          <p className="font-semibold">Purchase confirmed</p>
          <a
            href={explorerTxUrl(asset.network, buy.data)}
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
