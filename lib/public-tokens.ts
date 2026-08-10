// Assembles the public token catalog served by /api/tokens.
//
// Two families live side by side: the EVM tokens from `config/token.ts`, priced
// off their underlying feed, and the Stellar RWA assets from
// `config/stellar-assets.ts`, priced and counted straight off their Soroban
// contracts. Only mainnet Stellar assets are exposed — testnet ones are
// development fixtures and must never surface on a public endpoint.

import { formatUnits } from 'viem';
import { getNetworkProfile } from '@/config/stellar';
import { STELLAR_ASSETS, isAssetConfigured, type StellarAsset } from '@/config/stellar-assets';
import { SELLABLE_TOKEN_SYMBOLS, TOKENS, type SellableTokenSymbol } from '@/config/token';
import { Blockchain } from '@/enums/Blockchain';
import { getCmc20Price, getDeSPXAPrice, getPaxgPrice, getTftPrice, getXagmPrice } from '@/lib/prices';
import { readSalePrice, readTotalSupply } from '@/lib/stellar-assets';
import { getChainIdFromBlockchain } from '@/utils/getChainIdFromBlockchain';
import {
  calculateTGGPrice,
  calculateTMCPrice,
  calculateTSGPrice,
  calculateTSP500Price,
} from '@/utils/priceUtils';

export interface PublicTokenDeployment {
  /** `Polygon` | `Base` | `Ethereum` | `Stellar`. */
  chain: string;
  /** EVM chain id. Absent for Stellar. */
  chainId?: number;
  /** Stellar network the contract lives on. Absent for EVM. */
  network?: string;
  /** ERC-20 address, or Soroban contract id on Stellar. */
  address: string;
}

export interface PublicTokenPrice {
  /** Price per whole token, or null when the upstream feed is unreachable. */
  value: number | null;
  currency: 'USD' | 'USDC';
  /** Where the figure comes from: `paxg`, `xagm`, `cmc20`, `despxa`, `marketplace`, `sale-contract`. */
  source: string;
}

export interface PublicToken {
  symbol: string;
  name: string;
  decimals: number;
  price: PublicTokenPrice;
  /**
   * Tokens minted on-chain, in whole units. Only reported where the contract
   * exposes it (the Stellar SEP-41 tokens); null for the EVM tokens.
   */
  totalSupply: string | null;
  deployments: PublicTokenDeployment[];
}

// ---- EVM tokens ------------------------------------------------------------

interface EvmPriceFeed {
  currency: PublicTokenPrice['currency'];
  source: string;
  /** Resolves the price of one whole token from its underlying feed. */
  load: () => Promise<number>;
}

const EVM_PRICE_FEEDS: Record<SellableTokenSymbol, EvmPriceFeed> = {
  TGG: {
    currency: 'USD',
    source: 'paxg',
    load: async () => calculateTGGPrice((await getPaxgPrice()).data.price),
  },
  TSG: {
    currency: 'USD',
    source: 'xagm',
    load: async () => calculateTSGPrice((await getXagmPrice()).data.price),
  },
  TMC: {
    currency: 'USD',
    source: 'cmc20',
    load: async () => calculateTMCPrice((await getCmc20Price()).data.price),
  },
  TSP500: {
    currency: 'USD',
    source: 'despxa',
    load: async () => calculateTSP500Price((await getDeSPXAPrice()).data.price),
  },
  TFT_001: {
    currency: 'USD',
    source: 'marketplace',
    load: async () => (await getTftPrice()).data.price,
  },
};

function evmDeployments(symbol: SellableTokenSymbol): PublicTokenDeployment[] {
  const addresses = TOKENS[symbol]?.addresses ?? {};
  return Object.entries(addresses)
    .filter(([, address]) => Boolean(address))
    .map(([chain, address]) => ({
      chain,
      chainId: getChainIdFromBlockchain(chain as Blockchain),
      address: address as string,
    }));
}

async function buildEvmToken(symbol: SellableTokenSymbol): Promise<PublicToken> {
  const token = TOKENS[symbol];
  const feed = EVM_PRICE_FEEDS[symbol];

  // A dead upstream feed degrades that one token to a null price rather than
  // failing the whole catalog.
  const value = await feed.load().catch(() => null);

  return {
    symbol: token.symbol,
    name: token.name,
    decimals: token.decimals,
    price: { value, currency: feed.currency, source: feed.source },
    totalSupply: null,
    deployments: evmDeployments(symbol),
  };
}

// ---- Stellar RWA assets ----------------------------------------------------

/** Mainnet, fully deployed assets only — testnet fixtures never go public. */
function publicStellarAssets(): StellarAsset[] {
  return STELLAR_ASSETS.filter((asset) => asset.network === 'mainnet' && isAssetConfigured(asset));
}

async function buildStellarToken(asset: StellarAsset): Promise<PublicToken> {
  const profile = getNetworkProfile(asset.network);

  const [price, totalSupply] = await Promise.all([
    readSalePrice(profile, asset.saleId)
      .then((stroops) => Number(formatUnits(stroops, asset.decimals)))
      .catch(() => null),
    readTotalSupply(profile, asset.tokenId)
      .then((supply) => formatUnits(supply, asset.decimals))
      .catch(() => null),
  ]);

  return {
    symbol: asset.symbol,
    name: asset.name,
    decimals: asset.decimals,
    price: { value: price, currency: 'USDC', source: 'sale-contract' },
    totalSupply,
    deployments: [
      {
        chain: 'Stellar',
        network: asset.network,
        address: asset.tokenId,
      },
    ],
  };
}

// ---- public API ------------------------------------------------------------

/** The full catalog: every token Tokeshare sells, priced. */
export async function getPublicTokens(): Promise<PublicToken[]> {
  const [evm, stellar] = await Promise.all([
    Promise.all(SELLABLE_TOKEN_SYMBOLS.map(buildEvmToken)),
    Promise.all(publicStellarAssets().map(buildStellarToken)),
  ]);
  return [...evm, ...stellar];
}

/**
 * One token by symbol, case-insensitive. Stellar assets also resolve by slug,
 * since that's what their marketplace URLs use. Returns null when the symbol
 * isn't part of the sellable perimeter.
 */
export async function getPublicToken(symbol: string): Promise<PublicToken | null> {
  const wanted = symbol.trim().toUpperCase();

  const evmSymbol = SELLABLE_TOKEN_SYMBOLS.find((candidate) => candidate.toUpperCase() === wanted);
  if (evmSymbol) return buildEvmToken(evmSymbol);

  const asset = publicStellarAssets().find(
    (candidate) => candidate.symbol.toUpperCase() === wanted || candidate.slug.toUpperCase() === wanted,
  );
  if (asset) return buildStellarToken(asset);

  return null;
}
