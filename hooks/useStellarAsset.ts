'use client';

// React Query hooks for a single RWA asset from config/stellar-assets.ts.
// Parameterized by asset, so the same hooks drive every marketplace page and the
// portfolio view. Signing is delegated to StellarContext (Wallets Kit today,
// Privy later) so the buy flow is onboarding-path agnostic.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useStellarAccount } from '@/context/StellarContext';
import { type StellarAsset, isAssetConfigured } from '@/config/stellar-assets';
import { stroopsToUnits, submitSignedXdr, unitsToStroops } from '@/lib/stellar';
import {
  buildBuyXdr,
  getClassicBalances,
  readSaleAvailable,
  readSalePrice,
  readTokenBalance,
} from '@/lib/stellar-assets';

/** Live price (pay units per share) and remaining inventory, read on-chain. */
export function useSaleInfo(asset: StellarAsset) {
  return useQuery({
    queryKey: ['stellar-sale-info', asset.slug],
    enabled: isAssetConfigured(asset),
    staleTime: 60_000,
    queryFn: async () => {
      const [priceStroops, availableStroops] = await Promise.all([
        readSalePrice(asset.saleId),
        readSaleAvailable(asset.saleId),
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
  return useQuery({
    queryKey: ['stellar-asset-balance', asset.slug, address],
    enabled: !!address && Boolean(asset.tokenId),
    staleTime: 30_000,
    queryFn: async () => {
      const stroops = await readTokenBalance(asset.tokenId, address!);
      return { stroops, units: stroopsToUnits(stroops) };
    },
  });
}

/** Connected wallet's USDC / XLM balances (classic, via Horizon). */
export function useClassicBalances() {
  const { address } = useStellarAccount();
  return useQuery({
    queryKey: ['stellar-classic-balances', address],
    enabled: !!address,
    staleTime: 30_000,
    queryFn: () => getClassicBalances(address!),
  });
}

/**
 * Buys `shareUnits` shares of `asset`, paying in USDC. The RWA token is a custom
 * Soroban token, so there is no delivery trustline to create (unlike the legacy
 * classic-asset POC): the sale's `buy` moves USDC out and shares in atomically.
 * A non-allowlisted buyer's transfer is rejected on-chain (the compliance gate).
 */
export function useBuyAsset(asset: StellarAsset) {
  const { address, signTransaction } = useStellarAccount();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (shareUnits: string): Promise<string> => {
      if (!address) throw new Error('Wallet not connected');
      const shareStroops = unitsToStroops(shareUnits);
      if (shareStroops <= 0n) throw new Error('Enter an amount');

      const buyXdr = await buildBuyXdr(asset.saleId, address, shareStroops);
      const signedBuy = await signTransaction(buyXdr);
      return submitSignedXdr(signedBuy);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stellar-sale-info', asset.slug] });
      queryClient.invalidateQueries({ queryKey: ['stellar-asset-balance', asset.slug] });
      queryClient.invalidateQueries({ queryKey: ['stellar-classic-balances'] });
    },
  });
}
