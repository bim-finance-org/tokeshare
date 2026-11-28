// Multi-asset registry for the Stellar RWA marketplace (Tranche 1).
//
// Each entry pairs a custom SEP-41 Soroban RWA token (deployed from the separate
// token repo) with its fixed-price sale contract (deployed on the tokeshare side).
// There is no database: this array is the source of truth. Contract ids are
// pasted here by hand from the deploy output once the contracts exist.
//
// NOTE: the RWA token is a custom Soroban token, NOT a classic asset — its
// balances are read via the token contract (see lib/stellar-assets.ts), not via
// Horizon trustlines. Only the payment asset (USDC) + XLM stay classic.

import { STELLAR_DECIMALS, type StellarNetwork } from './stellar';

export type StellarAssetKind = 'real-estate' | 'vehicle';

/**
 * Off-chain revenue figures for an asset, provided by the operator. Purely
 * informational: nothing here is read from or enforced by the contracts.
 * Amounts are expressed in the network's payment asset (USDC).
 */
export interface StellarAssetEconomics {
  /** Valuation of the whole underlying asset. */
  totalValuation: number;
  /** Platform fee taken on gross revenues, in percent. */
  platformFeePercent: number;
  /** Net annual yield, in percent. */
  netYieldPercent: number;
  /** Net monthly distribution for the whole asset. */
  netMonthlyDistribution: number;
  /** Net monthly distribution per token. */
  netMonthlyDistributionPerToken: number;
}

/** Secondary-market protocols an asset's token can be listed on. */
export type StellarVenueType = 'soroswap' | 'aquarius';

/**
 * A secondary-market venue: one liquidity pool of the asset's token against
 * the payment asset (USDC), and the router swaps go through.
 *
 * The RWA token checks its allowlist on both ends of every transfer, so every
 * contract that holds the token on a venue must be allowlisted: always the
 * pool, and the router too when it takes custody during a swap. Those same
 * addresses hold shares without being investors, so they are left out of
 * revenue distributions (see getVenueAddresses).
 */
export interface StellarVenue {
  type: StellarVenueType;
  /** Display name of the protocol. */
  label: string;
  /** Pool contract holding the reserves. Empty until the pool exists. */
  poolAddress: string;
  /** Router contract swaps are sent to. */
  routerAddress: string;
  /**
   * Whether the router takes custody of the token during a swap. True: the
   * router must be allowlisted on the token and is excluded from snapshots.
   * False: transfers go straight between the user and the pool.
   */
  routerHoldsTokens: boolean;
  /** Swap fee of the pool, in basis points. */
  feeBps: number;
}

export interface StellarAsset {
  /** URL segment + stable key. */
  slug: string;
  /** Display name of the underlying asset. */
  name: string;
  /** Token symbol (SEP-41). */
  symbol: string;
  kind: StellarAssetKind;
  /** Which Stellar network this asset's contracts live on. */
  network: StellarNetwork;
  decimals: number;
  /** Total number of whole shares = the token cap. */
  totalShares: number;
  /** Custom SEP-41 Soroban token contract id (from the token repo). Empty until deployed. */
  tokenId: string;
  /** Fixed-price sale contract id (from the tokeshare deploy). Empty until deployed. */
  saleId: string;
  /** Card / hero image (public/ path). */
  image: string;
  /** Optional extra photos shown on the asset detail page. */
  gallery?: string[];
  /** Optional display metadata. */
  location?: string;
  description?: string;
  /**
   * Informational price hint in USDC per share, for display before the sale
   * contract is reachable. The authoritative price is always read on-chain from
   * the sale contract.
   */
  priceHintUsdc?: number;
  /** Optional revenue / yield figures shown alongside the on-chain data. */
  economics?: StellarAssetEconomics;
  /** Secondary-market venues (liquidity pools) of the token. None by default. */
  venues?: StellarVenue[];
}

// ⚠️ TRES is deployed on TESTNET, TFW_001 targets MAINNET — the ids below are
// not interchangeable between networks. Paste the ids from the token-repo
// deploy output + the sale deploy.
export const STELLAR_ASSETS: StellarAsset[] = [
  {
    slug: 'tres',
    name: 'Angel Cœur Caribe',
    symbol: 'TRES',
    kind: 'real-estate',
    network: 'testnet',
    decimals: STELLAR_DECIMALS,
    // Matches the existing classic TRES supply exactly (22 996.8 in its SAC
    // + 3.2 on trustlines, per Horizon /assets), so the re-issue keeps the
    // token count unchanged.
    totalShares: 23_000,
    // TESTNET. Token deployed 2026-07-28; sale v2 (buyback + auto-allowlist),
    // redeployed 2026-10-07 on Circle testnet USDC (was the self-issued test
    // USDC CABTGCTA…YA7C) — the USDC MoneyGram and the SDP use.
    tokenId: 'CCZERUHBBFK2TIMOGYMTROUMKPLTMFQ3KRFDASGKV3IZCAZHBFEI6J6Q',
    saleId: 'CB66VJSLUWXYITFD23LLY2FRRJZXXD6HWHMQUFCZ5WDOZKASFQHTEIRX',
    image: '/images/stellar/steallr_poc.jpeg',
    location: 'Las Terrenas, Dominican Republic',
    description: 'Tokenized real-estate share in a Caribbean property.',
    priceHintUsdc: 10,
  },
  {
    slug: 'tfw001',
    name: 'Tokeshare forwill001',
    symbol: 'TFW_001',
    kind: 'vehicle',
    network: 'mainnet',
    decimals: STELLAR_DECIMALS,
    totalShares: 100,
    // MAINNET. Token deployed 2026-07-28; sale v2 (buyback + auto-allowlist).
    tokenId: 'CC2MTI3REEQUMDJYOLQHK4D6GPGSTGPZOWH3G75SECSOTOH7L7GGLG5O',
    saleId: 'CAFYUWC2U7GX4DNG6JRZLPYDNXDOLJNHP5RWVAMOTOA5QO75N4B56X45',
    image: '/images/stellar/tfw001-1.jpg',
    gallery: ['/images/stellar/tfw001-1.jpg', '/images/stellar/tfw001-2.jpg'],
    description: 'Tokenized share in a quad (transport vehicle).',
    priceHintUsdc: 50,
    economics: {
      totalValuation: 5_000,
      platformFeePercent: 2,
      netYieldPercent: 16.46,
      netMonthlyDistribution: 68.6,
      netMonthlyDistributionPerToken: 0.686,
    },
    venues: [
      {
        type: 'soroswap',
        label: 'Soroswap',
        // Deterministic pair address for TFW_001/USDC (router_pair_for), known
        // before the pair exists so it can be allowlisted ahead of add_liquidity.
        poolAddress: 'CB2EDQIP6FF7YDXEE46DALBCSXPQ2AWOAVW6GRQ4YR3CN7QJQ3WX7YFD',
        // Transfers go straight between the user and the pair.
        routerAddress: 'CAG5LRYQ5JVEUI5TEID72EYOVX44TTUJT5BQR2J6J77FH65PCCFAJDDH',
        routerHoldsTokens: false,
        feeBps: 30,
      },
      {
        type: 'aquarius',
        label: 'Aquarius',
        // Unknown until the pool is created (router.init_standard_pool): set
        // the env var, or paste the address here, before the pool is funded.
        poolAddress: (process.env.NEXT_PUBLIC_STELLAR_MAINNET_TFW001_AQUARIUS_POOL ?? '').trim(),
        // Every swap goes user → router → pool and back: the router holds the
        // token on the way in and on the way out.
        routerAddress: 'CBQDHNBFBZYE4MKPWBSJOPIYLW4SFSXAXUTSXJN76GNKYVYPCKWC6QUK',
        routerHoldsTokens: true,
        feeBps: 30,
      },
    ],
  },
];

export const getStellarAsset = (slug: string): StellarAsset | undefined => STELLAR_ASSETS.find((a) => a.slug === slug);

/** An asset is buyable only once both its token and sale contracts are set. */
export const isAssetConfigured = (asset: StellarAsset): boolean => Boolean(asset.tokenId && asset.saleId);

// ---- secondary-market venues -------------------------------------------------

/** One address slot a venue occupies on the token: its pool, or a custodial router. */
export interface StellarVenueSlot {
  venue: StellarVenueType;
  role: 'pool' | 'router';
  /** Display name, e.g. "Aquarius router". */
  label: string;
  /** Contract address; empty while the pool has not been created. */
  address: string;
}

/**
 * Every address slot the asset's venues occupy on the token — pools, plus the
 * routers that take custody during a swap. Includes pools not created yet
 * (empty address) so operator tooling can show what is still missing.
 */
export const getVenueSlots = (asset: StellarAsset): StellarVenueSlot[] =>
  (asset.venues ?? []).flatMap((venue) => {
    const slots: StellarVenueSlot[] = [
      { venue: venue.type, role: 'pool', label: `${venue.label} pool`, address: venue.poolAddress.trim() },
    ];
    if (venue.routerHoldsTokens) {
      slots.push({
        venue: venue.type,
        role: 'router',
        label: `${venue.label} router`,
        address: venue.routerAddress.trim(),
      });
    }
    return slots;
  });

/**
 * Every known address that holds the asset's token on behalf of a venue. These
 * must be allowlisted on the token and must never be paid revenue: they hold
 * shares without being investors.
 */
export const getVenueAddresses = (asset: StellarAsset): string[] => [
  ...new Set(
    getVenueSlots(asset)
      .map((slot) => slot.address)
      .filter(Boolean),
  ),
];

/** True when `address` is a pool or a custodial router of one of the asset's venues. */
export const isVenueAddress = (asset: StellarAsset, address: string): boolean =>
  Boolean(address) && getVenueAddresses(asset).includes(address);
