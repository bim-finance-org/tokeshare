// hooks/useUserTokenAssets.ts
'use client';

import { useQuery } from '@tanstack/react-query';
import { useAccount } from 'wagmi';
import { Address } from 'viem';
import { PUBLIC_CLIENTS } from '@/lib/clients';
import { TOKENS } from '@/config/token';
import { TokenType } from '@/enums/TokenType';
import { Blockchain } from '@/enums/Blockchain';
import { ERC20_ABI } from '@/contracts/abis/erc20_abi';
import { AssetData } from '@/interfaces/AssetData';
import { useTokenPrice } from '@/hooks/useTokenPrice';

async function fetchUserTokenAssets(
  address: Address,
  tggPrice: number,
  tftPrice: number,
): Promise<AssetData[]> {
  const list: AssetData[] = [];
  const cryptos = Object.values(TOKENS).filter((t) => t.type === TokenType.Crypto);

  for (const token of cryptos) {
    for (const [chainStr, tokenAddr] of Object.entries(token.addresses)) {
      const chain = chainStr as Blockchain;
      const client = PUBLIC_CLIENTS[chain];
      if (!client || !tokenAddr) continue;

      try {
        const raw = await client.readContract({
          address: tokenAddr as Address,
          abi: ERC20_ABI,
          functionName: 'balanceOf',
          args: [address],
        });
        const balance = Number(raw) / 10 ** token.decimals;
        if (balance <= 0) continue;

        const unitPrice = token.symbol === 'TGG' ? tggPrice : tftPrice;

        list.push({
          name: token.name,
          amount: balance,
          symbol: token.symbol,
          totalPrice: balance * unitPrice,
          blockchain: chain,
          imageUrl: token.symbol === 'TGG' ? '/images/currencies/tgg.png' : '/images/currencies/tft.png',
          internalUrl: token.internalUrl,
        });
      } catch (e) {
        console.warn(`Failed to fetch ${token.symbol} on ${chain}`, e);
      }
    }
  }

  return list;
}

export function useUserTokenAssets(): {
  assets: AssetData[];
  isLoading: boolean;
} {
  const { address } = useAccount();
  const { price: tggPrice, isLoading: tggLoading } = useTokenPrice('TGG');
  const { price: tftPrice, isLoading: tftLoading } = useTokenPrice('TFT_001');

  const pricesReady = !tggLoading && !tftLoading;

  const { data: assets, isLoading: assetsLoading } = useQuery({
    queryKey: ['user-token-assets', address, tggPrice, tftPrice],
    queryFn: () => fetchUserTokenAssets(address as Address, tggPrice ?? 0, tftPrice ?? 0),
    enabled: !!address && pricesReady,
  });

  return {
    assets: assets ?? [],
    isLoading: !!address && (!pricesReady || assetsLoading),
  };
}
