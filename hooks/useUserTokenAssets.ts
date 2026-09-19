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
import { useTGGPrice, useTSGPrice, useTMCPrice, useTSP500Price, useTFTPrice, useTLTPrice } from '@/hooks/useTokenPrice';
import { getLogger } from '@/lib/logger';

const log = getLogger('user-assets');

type BalanceCall = { token: TokenInfo; address: Address };

/** USD unit price per held symbol; a missing symbol values the position at 0. */
type UnitPrices = Record<string, number>;

const ASSET_IMAGES: Record<string, string> = {
  TGG: '/images/currencies/tgg.png',
  TSG: '/images/currencies/tsg.webp',
  TMC: '/images/currencies/tmc.png',
  TSP500: '/images/currencies/tsp500.webp',
  TFT_001: '/images/currencies/tft.webp',
  TLT_001: '/images/currencies/tlt.webp',
};

function toAsset(token: TokenInfo, chain: Blockchain, rawBalance: bigint, prices: UnitPrices): AssetData | null {
  const balance = Number(rawBalance) / 10 ** token.decimals;
  if (balance <= 0) return null;

  const unitPrice = prices[token.symbol] ?? 0;
  const imageUrl = ASSET_IMAGES[token.symbol] ?? '/images/currencies/tft.webp';

  return {
    name: token.name,
    amount: balance,
    symbol: token.symbol,
    totalPrice: balance * unitPrice,
    blockchain: chain,
    imageUrl,
    internalUrl: token.internalUrl,
  };
}

async function fetchUserTokenAssets(address: Address, prices: UnitPrices): Promise<AssetData[]> {
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
          const asset = toAsset(token, chain, res.result as bigint, prices);
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
  const { price: tsgPrice, isLoading: tsgLoading } = useTSGPrice();
  const { price: tmcPrice, isLoading: tmcLoading } = useTMCPrice();
  const { price: tsp500Price, isLoading: tsp500Loading } = useTSP500Price();
  const { price: tftPrice, isLoading: tftLoading } = useTFTPrice();
  const { price: tltPrice, isLoading: tltLoading } = useTLTPrice();

  const pricesReady = !tggLoading && !tsgLoading && !tmcLoading && !tsp500Loading && !tftLoading && !tltLoading;

  const { data: assets, isLoading: assetsLoading } = useQuery({
    queryKey: ['user-token-assets', address, tggPrice, tsgPrice, tmcPrice, tsp500Price, tftPrice, tltPrice],
    queryFn: () =>
      fetchUserTokenAssets(address as Address, {
        TGG: tggPrice ?? 0,
        TSG: tsgPrice ?? 0,
        TMC: tmcPrice ?? 0,
        TSP500: tsp500Price ?? 0,
        TFT_001: tftPrice ?? 0,
        TLT_001: tltPrice ?? 0,
      }),
    enabled: !!address && pricesReady,
  });

  return {
    assets: assets ?? [],
    isLoading: !!address && (!pricesReady || assetsLoading),
  };
}
