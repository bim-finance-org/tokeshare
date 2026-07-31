'use client';

// The connected Stellar wallet's RWA holdings, shaped as AssetData so they merge
// straight into the main portfolio dashboard alongside the EVM tokens. Balance
// comes from each asset's token contract; value uses the live sale price (USDC ≈
// USD). Assets with a zero balance are dropped.

import { useQuery } from '@tanstack/react-query';
import { useStellarAccount } from '@/context/StellarContext';
import { STELLAR_ASSETS } from '@/config/stellar-assets';
import { getNetworkProfile } from '@/config/stellar';
import { stroopsToUnits } from '@/lib/stellar';
import { readSalePrice, readTokenBalance } from '@/lib/stellar-assets';
import type { AssetData } from '@/interfaces/AssetData';

export function useStellarUserAssets(): { assets: AssetData[]; isLoading: boolean } {
  const { address } = useStellarAccount();

  const query = useQuery({
    queryKey: ['stellar-user-assets', address],
    enabled: !!address,
    staleTime: 30_000,
    queryFn: async () => {
      const results = await Promise.all(
        STELLAR_ASSETS.filter((asset) => asset.tokenId && asset.saleId).map(async (asset): Promise<AssetData | null> => {
          const profile = getNetworkProfile(asset.network);
          try {
            const [balanceStroops, priceStroops] = await Promise.all([
              readTokenBalance(profile, asset.tokenId, address!),
              readSalePrice(profile, asset.saleId),
            ]);
            const amount = Number(stroopsToUnits(balanceStroops));
            if (amount <= 0) return null;
            const unitPrice = Number(stroopsToUnits(priceStroops));
            return {
              name: asset.name,
              symbol: asset.symbol,
              amount,
              totalPrice: amount * unitPrice,
              blockchain: 'Stellar',
              imageUrl: asset.image,
              internalUrl: `/stellar/${asset.slug}`,
            };
          } catch {
            return null; // asset unreachable — skip rather than break the dashboard
          }
        }),
      );
      return results.filter((a): a is AssetData => a !== null);
    },
  });

  return { assets: query.data ?? [], isLoading: !!address && query.isPending };
}
