import { useMemo } from 'react';
import { usePaxgPrice } from '@/hooks/usePaxgPrice';
import { useCmc20Price } from '@/hooks/useCmc20Price';
import { calculateTGGPrice, calculateTMCPrice } from '@/utils/priceUtils';
import { useMarketplaceContract } from './useMarketplaceContracts';

export function useTokenPrice(symbol: string): {
  price: number | null;
  isLoading: boolean;
} {
  // Call ALL hooks unconditionally to respect React hooks rules
  const { data: paxgPrice, isLoading: paxgLoading } = usePaxgPrice();
  const { data: cmc20Price, isLoading: cmc20Loading } = useCmc20Price();
  const { tftTokenInfo, tftTokenInfoLoading } = useMarketplaceContract();

  // Calculate prices for each token type
  return useMemo(() => {
    if (symbol === 'TGG') {
      return {
        price: paxgPrice !== undefined ? calculateTGGPrice(paxgPrice) : null,
        isLoading: paxgLoading,
      };
    }

    if (symbol === 'TFT_001') {
      const [pricePerToken] = (tftTokenInfo ?? []) as [bigint, number, boolean];
      const bigInt_price = Number(pricePerToken);
      const price = bigInt_price / 10 ** 18;
      return { price: price || null, isLoading: tftTokenInfoLoading };
    }

    if (symbol === 'TMC') {
      return {
        price: cmc20Price !== undefined ? calculateTMCPrice(cmc20Price) : null,
        isLoading: cmc20Loading,
      };
    }

    return { price: null, isLoading: false };
  }, [symbol, paxgPrice, paxgLoading, cmc20Price, cmc20Loading, tftTokenInfo, tftTokenInfoLoading]);
}
