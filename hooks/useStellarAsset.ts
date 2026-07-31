'use client';

// React Query hooks for a single RWA asset from config/stellar-assets.ts.
// Parameterized by asset (incl. its network), so the same hooks drive every
// marketplace page and the portfolio view across testnet and mainnet assets.
// Signing is delegated to StellarContext (Wallets Kit or Privy) so the buy flow
// is onboarding-path agnostic.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useStellarAccount } from '@/context/StellarContext';
import { type StellarAsset, isAssetConfigured } from '@/config/stellar-assets';
import { getNetworkProfile } from '@/config/stellar';
import { stroopsToUnits, submitSignedXdr, unitsToStroops } from '@/lib/stellar';
import {
  buildBuyXdr,
  buildPaymentTrustlineXdr,
  buildSellXdr,
  getClassicBalances,
  hasPaymentTrustline,
  quoteSell,
  readBuybackAvailable,
  readBuybackPrice,
  readFeeBps,
  readIsAllowed,
  readSaleAvailable,
  readSalePrice,
  readTokenBalance,
} from '@/lib/stellar-assets';

/** Live price (pay units per share) and remaining inventory, read on-chain. */
export function useSaleInfo(asset: StellarAsset) {
  const profile = getNetworkProfile(asset.network);
  return useQuery({
    queryKey: ['stellar-sale-info', asset.slug],
    enabled: isAssetConfigured(asset),
    staleTime: 60_000,
    queryFn: async () => {
      const [priceStroops, availableStroops] = await Promise.all([
        readSalePrice(profile, asset.saleId),
        readSaleAvailable(profile, asset.saleId),
      ]);
      return {
        priceStroops,
        availableStroops,
        priceUnits: stroopsToUnits(priceStroops),
        availableUnits: stroopsToUnits(availableStroops),
      };
    },
  });
}

/** Connected wallet's share balance for this asset (from the token contract). */
export function useAssetBalance(asset: StellarAsset) {
  const { address } = useStellarAccount();
  const profile = getNetworkProfile(asset.network);
  return useQuery({
    queryKey: ['stellar-asset-balance', asset.slug, address],
    enabled: !!address && Boolean(asset.tokenId),
    staleTime: 30_000,
    queryFn: async () => {
      const stroops = await readTokenBalance(profile, asset.tokenId, address!);
      return { stroops, units: stroopsToUnits(stroops) };
    },
  });
}

/**
 * Whether the connected wallet is allowlisted for this asset. `undefined` while
 * loading / when not applicable; a `false` result means the buy must be blocked
 * (the on-chain transfer would be rejected with Error #113).
 */
export function useIsAllowed(asset: StellarAsset) {
  const { address } = useStellarAccount();
  const profile = getNetworkProfile(asset.network);
  return useQuery({
    queryKey: ['stellar-is-allowed', asset.slug, address],
    enabled: !!address && Boolean(asset.tokenId),
    staleTime: 60_000,
    queryFn: () => readIsAllowed(profile, asset.tokenId, address!),
  });
}

/**
 * Whether the connected wallet trusts the payment asset (USDC). A brand-new
 * wallet (e.g. a fresh Privy embedded wallet) has no trustline, so it cannot
 * receive USDC until one is added — see useAddPaymentTrustline.
 */
export function usePaymentTrustline(asset: StellarAsset) {
  const { address } = useStellarAccount();
  const profile = getNetworkProfile(asset.network);
  return useQuery({
    queryKey: ['stellar-pay-trustline', asset.network, address],
    enabled: !!address,
    staleTime: 30_000,
    queryFn: () => hasPaymentTrustline(profile, address!),
  });
}

/** Adds the payment-asset (USDC) trustline so the wallet can receive/hold it. */
export function useAddPaymentTrustline(asset: StellarAsset) {
  const { address, signTransaction } = useStellarAccount();
  const queryClient = useQueryClient();
  const profile = getNetworkProfile(asset.network);

  return useMutation({
    mutationFn: async (): Promise<string> => {
      if (!address) throw new Error('Wallet not connected');
      const xdr = await buildPaymentTrustlineXdr(profile, address);
      const signed = await signTransaction(xdr, profile.networkPassphrase);
      return submitSignedXdr(profile, signed);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stellar-pay-trustline', asset.network] });
      queryClient.invalidateQueries({ queryKey: ['stellar-classic-balances', asset.network] });
    },
  });
}

/** Connected wallet's USDC / XLM balances on this asset's network (via Horizon). */
export function useClassicBalances(asset: StellarAsset) {
  const { address } = useStellarAccount();
  const profile = getNetworkProfile(asset.network);
  return useQuery({
    queryKey: ['stellar-classic-balances', asset.network, address],
    enabled: !!address,
    staleTime: 30_000,
    queryFn: () => getClassicBalances(profile, address!),
  });
}

/**
 * Buyback desk state for this asset: price (0 = closed), how many shares the
 * contract can currently buy back (limited by its USDC float), and the fee in
 * basis points. Read on-chain so the fee is never hardcoded.
 */
export function useBuybackInfo(asset: StellarAsset) {
  const profile = getNetworkProfile(asset.network);
  return useQuery({
    queryKey: ['stellar-buyback-info', asset.slug],
    enabled: isAssetConfigured(asset),
    staleTime: 30_000,
    queryFn: async () => {
      const [priceStroops, availableStroops, feeBps] = await Promise.all([
        readBuybackPrice(profile, asset.saleId),
        readBuybackAvailable(profile, asset.saleId),
        readFeeBps(profile, asset.saleId),
      ]);
      return {
        priceStroops,
        availableStroops,
        feeBps,
        isOpen: priceStroops > 0n,
        priceUnits: stroopsToUnits(priceStroops),
        availableUnits: stroopsToUnits(availableStroops),
      };
    },
  });
}

/**
 * Authoritative net USDC payout for selling `shareUnits`, straight from the
 * contract's quote_sell (fees + rounding included). Enabled only for a positive
 * amount on a configured asset.
 */
export function useSellQuote(asset: StellarAsset, shareUnits: string) {
  const profile = getNetworkProfile(asset.network);
  const shareStroops = unitsToStroops(shareUnits || '0');
  return useQuery({
    queryKey: ['stellar-sell-quote', asset.slug, shareStroops.toString()],
    enabled: isAssetConfigured(asset) && shareStroops > 0n,
    staleTime: 30_000,
    queryFn: async () => {
      const netStroops = await quoteSell(profile, asset.saleId, shareStroops);
      return { netStroops, netUnits: stroopsToUnits(netStroops) };
    },
  });
}

/**
 * Sells (buys back) `shareUnits` shares to Tokeshare for net USDC. A seller who
 * was removed from the allowlist is rejected on-chain (Error #113). Callers must
 * gate on useBuybackInfo (closed / insufficient float) before enabling this.
 */
export function useSellAsset(asset: StellarAsset) {
  const { address, signTransaction } = useStellarAccount();
  const queryClient = useQueryClient();
  const profile = getNetworkProfile(asset.network);

  return useMutation({
    mutationFn: async (shareUnits: string): Promise<string> => {
      if (!address) throw new Error('Wallet not connected');
      const shareStroops = unitsToStroops(shareUnits);
      if (shareStroops <= 0n) throw new Error('Enter an amount');

      const sellXdr = await buildSellXdr(profile, asset.saleId, address, shareStroops);
      const signedSell = await signTransaction(sellXdr, profile.networkPassphrase);
      return submitSignedXdr(profile, signedSell);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stellar-sale-info', asset.slug] });
      queryClient.invalidateQueries({ queryKey: ['stellar-buyback-info', asset.slug] });
      queryClient.invalidateQueries({ queryKey: ['stellar-asset-balance', asset.slug] });
      queryClient.invalidateQueries({ queryKey: ['stellar-classic-balances', asset.network] });
    },
  });
}

/**
 * Buys `shareUnits` shares of `asset`, paying in USDC. The RWA token is a custom
 * Soroban token, so there is no delivery trustline to create (unlike the legacy
 * classic-asset POC): the sale's `buy` moves USDC out and shares in atomically.
 * A non-allowlisted buyer's transfer is rejected on-chain (the compliance gate).
 * Signing and submission happen on the asset's own network.
 */
export function useBuyAsset(asset: StellarAsset) {
  const { address, signTransaction } = useStellarAccount();
  const queryClient = useQueryClient();
  const profile = getNetworkProfile(asset.network);

  return useMutation({
    mutationFn: async (shareUnits: string): Promise<string> => {
      if (!address) throw new Error('Wallet not connected');
      const shareStroops = unitsToStroops(shareUnits);
      if (shareStroops <= 0n) throw new Error('Enter an amount');

      const buyXdr = await buildBuyXdr(profile, asset.saleId, address, shareStroops);
      const signedBuy = await signTransaction(buyXdr, profile.networkPassphrase);
      return submitSignedXdr(profile, signedBuy);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stellar-sale-info', asset.slug] });
      queryClient.invalidateQueries({ queryKey: ['stellar-asset-balance', asset.slug] });
      queryClient.invalidateQueries({ queryKey: ['stellar-classic-balances', asset.network] });
    },
  });
}
