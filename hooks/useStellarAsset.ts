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
  getClassicBalances,
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
