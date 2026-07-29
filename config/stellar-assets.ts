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
    // TESTNET. Deployed 2026-07-28 from the RWA token repo (stellar/).
    tokenId: 'CCZERUHBBFK2TIMOGYMTROUMKPLTMFQ3KRFDASGKV3IZCAZHBFEI6J6Q',
    saleId: 'CCCDPOYCHMAVCISAQVHCNKJNIMWFISOGQWLAMQAEFOIZW76EGP77CJHF',
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
  },
];

export const getStellarAsset = (slug: string): StellarAsset | undefined =>
  STELLAR_ASSETS.find((a) => a.slug === slug);

/** An asset is buyable only once both its token and sale contracts are set. */
export const isAssetConfigured = (asset: StellarAsset): boolean => Boolean(asset.tokenId && asset.saleId);
