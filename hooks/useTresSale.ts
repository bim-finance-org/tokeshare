'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useStellarAccount } from '@/context/StellarContext';
import { isStellarConfigured } from '@/config/stellar';
import {
  buildBuyXdr,
  buildTrustlineXdr,
  hasTresTrustline,
  readAvailable,
  readPrice,
  stroopsToUnits,
  submitSignedXdr,
  unitsToStroops,
} from '@/lib/stellar';

/** Live price (pay units per TRES) and remaining inventory, read from chain. */
export function useSaleInfo() {
  return useQuery({
    queryKey: ['tres-sale-info'],
    enabled: isStellarConfigured,
    staleTime: 60_000,
    queryFn: async () => {
      const [priceStroops, availableStroops] = await Promise.all([readPrice(), readAvailable()]);
      return {
        priceStroops,
        availableStroops,
        priceUnits: stroopsToUnits(priceStroops),
        availableUnits: stroopsToUnits(availableStroops),
      };
    },
  });
}

/**
 * Buys `tresUnits` TRES. Ensures the buyer has a TRES trustline first (creating
 * one if needed), then signs and submits the Soroban `buy` call. Returns the tx
 * hash of the purchase.
 */
export function useBuyTres() {
  const { address, signTransaction } = useStellarAccount();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tresUnits: string): Promise<string> => {
      if (!address) throw new Error('Wallet not connected');
      const tresStroops = unitsToStroops(tresUnits);
      if (tresStroops <= 0n) throw new Error('Enter an amount');

      // The buyer must trust TRES before it can be delivered to them.
      const trusted = await hasTresTrustline(address);
      if (!trusted) {
        const trustXdr = await buildTrustlineXdr(address);
        const signedTrust = await signTransaction(trustXdr);
        await submitSignedXdr(signedTrust);
      }

      const buyXdr = await buildBuyXdr(address, tresStroops);
      const signedBuy = await signTransaction(buyXdr);
      return submitSignedXdr(signedBuy);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tres-sale-info'] });
    },
  });
}
