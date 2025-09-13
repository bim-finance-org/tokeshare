// hooks/useUserTokenAssets.ts
'use client';

import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { PUBLIC_CLIENTS } from '@/lib/clients';
import { TOKENS } from '@/config/token';
import { TokenType } from '@/enums/TokenType';
import { Blockchain } from '@/enums/Blockchain';
import { ERC20_ABI } from '@/contracts/abis/erc20_abi';
import { Address } from 'viem';
import { AssetData } from '@/interfaces/AssetData';
import { useTokenPrice } from '@/hooks/useTokenPrice';

export function useUserTokenAssets(): {
  assets: AssetData[];
  isLoading: boolean;
} {
  const { address } = useAccount();
  const [assets, setAssets] = useState<AssetData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 1) on prend les deux prix (et leurs flags)
  const { price: tggPrice, isLoading: tggLoading } = useTokenPrice('TGG');
  const { price: tftPrice, isLoading: tftLoading } = useTokenPrice('TFT_001');

  useEffect(() => {
    // 2) on ne lance que si l'address existe ET que les prix ont fini de charger
    if (!address || tggLoading || tftLoading) {
      setIsLoading(!!address && (tggLoading || tftLoading));
      return;
    }

    (async () => {
      setIsLoading(true);
      const list: AssetData[] = [];

      // 3) tous les tokens Crypto
      const cryptos = Object.values(TOKENS).filter((t) => t.type === TokenType.Crypto);

      for (const token of cryptos) {
        for (const [chainStr, tokenAddr] of Object.entries(token.addresses)) {
          const chain = chainStr as Blockchain;
          const client = PUBLIC_CLIENTS[chain];
          if (!client || !tokenAddr) continue;

          try {
            // 4) read balance
            const raw = await client.readContract({
              address: tokenAddr as Address,
              abi: ERC20_ABI,
              functionName: 'balanceOf',
              args: [address],
            });
            const balance = Number(raw) / 10 ** token.decimals;
            if (balance <= 0) continue;

            // 5) on choisit le bon prix
            const unitPrice = token.symbol === 'TGG' ? (tggPrice ?? 0) : (tftPrice ?? 0);

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

      setAssets(list);
      setIsLoading(false);
    })();
    // 6) on relance l’effet si address ou l’un des prix / loading change
  }, [address, tggPrice, tggLoading, tftPrice, tftLoading]);

  return { assets, isLoading };
}
