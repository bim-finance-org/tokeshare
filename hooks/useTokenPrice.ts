import { usePaxgPrice } from '@/hooks/usePaxgPrice';
import { useCmc20Price } from '@/hooks/useCmc20Price';
import { calculateTGGPrice, calculateTMCPrice } from '@/utils/priceUtils';
import { useMarketplaceContract } from './useMarketplaceContracts';
import { TOKENS } from '@/config/token';
import { Address } from 'viem';

export function useTokenPrice(symbol: string): {
  price: number | null;
  isLoading: boolean;
} {
  if (symbol === 'TGG') {
    const { data: paxgPrice, isLoading } = usePaxgPrice();
    return {
      price: paxgPrice !== undefined ? calculateTGGPrice(paxgPrice) : null,
      isLoading,
    };
  }

  if (symbol === 'TFT_001') {
    const { getTokenInfo } = useMarketplaceContract();
    const tokenAddress = TOKENS['TFT_001'].addresses.Base as Address;
    const { data, isLoading } = getTokenInfo(tokenAddress);

    const [pricePerToken, tokenDecimals, isActive] = (data ?? []) as [bigint, number, boolean];

    const bigInt_price = Number(pricePerToken);
    const price = bigInt_price / 10 ** 18;

    return { price, isLoading };
  }

  if (symbol === 'TMC') {
    const { data: cmc20Price, isLoading } = useCmc20Price();
    return {
      price: cmc20Price !== undefined ? calculateTMCPrice(cmc20Price) : null,
      isLoading,
    };
  }

  return { price: null, isLoading: false };
}
