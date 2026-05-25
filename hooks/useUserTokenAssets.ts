// hooks/useUserTokenAssets.ts
'use client';

import { useQuery } from '@tanstack/react-query';
import { useAccount } from 'wagmi';
import { Address } from 'viem';
import { PUBLIC_CLIENTS } from '@/lib/clients';
import { TOKENS, type TokenInfo } from '@/config/token';
import { TokenType } from '@/enums/TokenType';
import { Blockchain } from '@/enums/Blockchain';
import { ERC20_ABI } from '@/contracts/abis/erc20_abi';
import { AssetData } from '@/interfaces/AssetData';
import { useTGGPrice, useTFTPrice } from '@/hooks/useTokenPrice';
import { getLogger } from '@/lib/logger';

const log = getLogger('user-assets');

type BalanceCall = { token: TokenInfo; address: Address };

function toAsset(token: TokenInfo, chain: Blockchain, rawBalance: bigint, tggPrice: number, tftPrice: number): AssetData | null {
  const balance = Number(rawBalance) / 10 ** token.decimals;
  if (balance <= 0) return null;

  const unitPrice = token.symbol === 'TGG' ? tggPrice : tftPrice;

  return {
    name: token.name,
    amount: balance,
    symbol: token.symbol,
    totalPrice: balance * unitPrice,
    blockchain: chain,
    imageUrl: token.symbol === 'TGG' ? '/images/currencies/tgg.png' : '/images/currencies/tft.png',
    internalUrl: token.internalUrl,
  };
}

async function fetchUserTokenAssets(
  address: Address,
  tggPrice: number,
  tftPrice: number,
): Promise<AssetData[]> {
  const cryptos = Object.values(TOKENS).filter((t) => t.type === TokenType.Crypto);

  // Group one balanceOf call per (token, chain) so each chain resolves in a
  // single multicall round-trip instead of N sequential RPC calls.
  const byChain = new Map<Blockchain, BalanceCall[]>();
  for (const token of cryptos) {
    for (const [chainStr, tokenAddr] of Object.entries(token.addresses)) {
      const chain = chainStr as Blockchain;
      if (!PUBLIC_CLIENTS[chain] || !tokenAddr) continue;
      const calls = byChain.get(chain) ?? [];
      calls.push({ token, address: tokenAddr as Address });
      byChain.set(chain, calls);
    }
  }

  const perChain = await Promise.all(
    [...byChain.entries()].map(async ([chain, calls]): Promise<AssetData[]> => {
      const client = PUBLIC_CLIENTS[chain];
      try {
        const results = await client.multicall({
          allowFailure: true,
          contracts: calls.map((c) => ({
            address: c.address,
            abi: ERC20_ABI,
            functionName: 'balanceOf',
            args: [address],
          })),
        });

        return results.flatMap((res, i) => {
          const { token } = calls[i]!;
          if (res.status !== 'success') {
            log.warn(`failed to fetch ${token.symbol} on ${chain}`, res.error);
            return [];
          }
          const asset = toAsset(token, chain, res.result as bigint, tggPrice, tftPrice);
          return asset ? [asset] : [];
        });
      } catch (e) {
        log.warn(`multicall failed on ${chain}`, e);
        return [];
      }
    }),
  );

  return perChain.flat();
}

export function useUserTokenAssets(): {
  assets: AssetData[];
  isLoading: boolean;
} {
  const { address } = useAccount();
  const { price: tggPrice, isLoading: tggLoading } = useTGGPrice();
  const { price: tftPrice, isLoading: tftLoading } = useTFTPrice();

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
