// Single source of truth for every upstream price feed.
//
// Each fetcher was previously duplicated inside its own route handler, which
// meant the aggregate `/api/tokens` endpoint would have had to HTTP-call the
// site itself to reuse them. Extracting them here lets both the per-feed routes
// and the aggregate endpoint share one implementation *and* one Redis key, so a
// cache hit on `/api/commodities/paxg/price` also serves `/api/tokens`.
//
// Cache keys are unchanged from the original routes on purpose — renaming them
// would silently drop every warm entry on deploy.

import type { Address } from 'viem';
import { MARKETPLACE_ABI } from '@/contracts/abis/marketplace_abi';
import { ADDRESSES } from '@/contracts/addresses';
import { Blockchain } from '@/enums/Blockchain';
import { PUBLIC_CLIENTS } from '@/lib/clients';
import { getFromCache, setCache } from '@/lib/redis';
import { singleFlight } from '@/lib/singleFlight';

const MS_PER_SECOND = 1000;

/** Every price feed is considered fresh for a minute. */
export const PRICE_CACHE_SECONDS = 60;

/** A bare spot price, as returned by the plain-text feeds (PAXG, XAGM). */
export interface SpotPrice {
  price: number;
  timestamp: number;
}

/** A spot price plus the trailing performance figures exposed by CMC / CoinGecko. */
export interface SpotPriceWithChanges extends SpotPrice {
  percent_change_24h: number | null;
  percent_change_30d: number | null;
  percent_change_90d: number | null;
}

/** A cached value plus the provenance metadata the price routes echo back. */
export interface PriceResult<Data> {
  data: Data;
  source: string;
  cachedAt: string;
  age: number;
}

async function getCachedOrFetch<Data extends SpotPrice>(
  key: string,
  liveSource: string,
  fetcher: () => Promise<Data>,
  expiration: number = PRICE_CACHE_SECONDS,
): Promise<PriceResult<Data>> {
  const cached = await getFromCache<Data>(key);
  const now = Date.now();
  if (cached && now - cached.timestamp < expiration * MS_PER_SECOND) {
    return {
      data: cached,
      source: 'redis-cache',
      cachedAt: new Date(cached.timestamp).toISOString(),
      age: Math.round((now - cached.timestamp) / MS_PER_SECOND),
    };
  }
  const freshData = await singleFlight(key, async () => {
    const fresh = await fetcher();
    await setCache(key, fresh, expiration);
    return fresh;
  });
  return {
    data: freshData,
    source: liveSource,
    cachedAt: new Date(now).toISOString(),
    age: 0,
  };
}

// ---- plain-text spot feeds (cryptoprices.cc) -------------------------------

async function fetchSpotFromCryptoPrices(url: string, label: string): Promise<SpotPrice> {
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'text/plain',
      'Content-Type': 'text/plain',
    },
  });
  if (!response.ok) {
    throw new Error(`Error retrieving ${label} price`);
  }
  const priceText = await response.text();
  const price = parseFloat(priceText);
  if (isNaN(price)) throw new Error('Invalid price format');
  return { price, timestamp: Date.now() };
}

/** PAXG spot (1 PAXG = 1 troy ounce of gold) — the TGG underlying. */
export const getPaxgPrice = (): Promise<PriceResult<SpotPrice>> =>
  getCachedOrFetch('paxg:price', 'cryptoprices-api', () =>
    fetchSpotFromCryptoPrices('https://cryptoprices.cc/PAXG/', 'PAXG'),
  );

/** XAGM spot (1 XAGM = 1 troy ounce of silver) — the TSG underlying. */
export const getXagmPrice = (): Promise<PriceResult<SpotPrice>> =>
  getCachedOrFetch('xagm:price', 'cryptoprices-api', () =>
    fetchSpotFromCryptoPrices('https://cryptoprices.cc/XAGM/', 'XAGM'),
  );

// ---- CMC20 index (CoinMarketCap) -------------------------------------------

const CMC20_ID = '38442';

async function fetchCmc20Price(): Promise<SpotPriceWithChanges> {
  const apiKey = process.env.COINMARKETCAP_API_KEY;
  if (!apiKey) throw new Error('Missing CoinMarketCap API key');

  const url = `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?id=${CMC20_ID}&convert=USD`;
  const response = await fetch(url, {
    headers: {
      'X-CMC_PRO_API_KEY': apiKey,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Error retrieving CMC20 price from CoinMarketCap');
  }

  const data = await response.json();
  const quote = data?.data?.[CMC20_ID]?.quote?.USD;
  const price = quote?.price;

  if (typeof price !== 'number') {
    throw new Error('Invalid CMC20 price format');
  }

  return {
    price,
    percent_change_24h: quote?.percent_change_24h ?? null,
    percent_change_30d: quote?.percent_change_30d ?? null,
    percent_change_90d: quote?.percent_change_90d ?? null,
    timestamp: Date.now(),
  };
}

/** CMC20 index level — the TMC underlying. */
export const getCmc20Price = (): Promise<PriceResult<SpotPriceWithChanges>> =>
  getCachedOrFetch('cmc20:price', 'coinmarketcap-api', fetchCmc20Price);

// ---- deSPXA (CoinGecko) ----------------------------------------------------

const COINGECKO_DESPXA_ID = 'defi-janus-henderson-anemoy-s-p500-fund-token';

async function fetchDeSPXAPrice(): Promise<SpotPriceWithChanges> {
  const url =
    `https://api.coingecko.com/api/v3/coins/${COINGECKO_DESPXA_ID}` +
    '?localization=false&tickers=false&community_data=false&developer_data=false&sparkline=false';
  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error('Error retrieving deSPXA price from CoinGecko');
  }

  const data = await response.json();
  const marketData = data?.market_data;
  const price = marketData?.current_price?.usd;

  if (typeof price !== 'number') {
    throw new Error('Invalid deSPXA price format');
  }

  return {
    price,
    percent_change_24h: marketData?.price_change_percentage_24h ?? null,
    percent_change_30d: marketData?.price_change_percentage_30d ?? null,
    percent_change_90d: null,
    timestamp: Date.now(),
  };
}

/** deSPXA price — the TSP500 underlying. Cached under the historical `tsp500:price` key. */
export const getDeSPXAPrice = (): Promise<PriceResult<SpotPriceWithChanges>> =>
  getCachedOrFetch('tsp500:price', 'coingecko-api', fetchDeSPXAPrice);

// ---- TFT (read straight off the Base marketplace) --------------------------

// The marketplace address is grouped under Polygon in `addresses.ts` for
// historical reasons, but TFT is listed on the Base deployment — same address,
// and that's the chain `useMarketplaceContract` reads from.
const MARKETPLACE_ON_BASE = ADDRESSES[Blockchain.Polygon].MARKETPLACE as Address;
const TFT_ADDRESS = ADDRESSES[Blockchain.Base].TFT_001 as Address;
const TFT_PRICE_DECIMALS = 18;

async function fetchTftPrice(): Promise<SpotPrice> {
  const [pricePerToken] = (await PUBLIC_CLIENTS[Blockchain.Base].readContract({
    address: MARKETPLACE_ON_BASE,
    abi: MARKETPLACE_ABI,
    functionName: 'getTokenInfo',
    args: [TFT_ADDRESS],
  })) as [bigint, number, boolean];

  const price = Number(pricePerToken) / 10 ** TFT_PRICE_DECIMALS;
  if (!price) throw new Error('TFT is not listed on the marketplace');
  return { price, timestamp: Date.now() };
}

/**
 * TFT price in USD, as listed on the marketplace contract. Read on-chain rather
 * than hardcoded so a re-listing at a new price propagates on its own.
 */
export const getTftPrice = (): Promise<PriceResult<SpotPrice>> =>
  getCachedOrFetch('tft:price', 'base-marketplace', fetchTftPrice);
