// SEP-24 ramp anchor registry. The mechanics (SEP-1 toml, SEP-10 auth, SEP-24
// interactive flows) are ecosystem standards, so the same client code serves
// MoneyGram and the SDF reference anchor — switching anchors is a home-domain
// change. Until MoneyGram partner keys are provisioned, the testnet ramp points
// at the SDF test anchor, which exposes the exact same protocol surface.

import type { StellarNetwork } from '@/config/stellar';

export type RampProvider = 'moneygram' | 'testanchor';

export interface RampAnchorConfig {
  homeDomain: string;
  provider: RampProvider;
  /** Asset code to request from the anchor (its issuer comes from the anchor's stellar.toml). */
  assetCode: string;
}

const TESTNET_HOME = process.env.NEXT_PUBLIC_STELLAR_TESTNET_RAMP_HOME_DOMAIN || 'testanchor.stellar.org';
const MAINNET_HOME = process.env.NEXT_PUBLIC_STELLAR_MAINNET_RAMP_HOME_DOMAIN || 'stellar.moneygram.com';

const providerOf = (homeDomain: string): RampProvider =>
  homeDomain.includes('moneygram') ? 'moneygram' : 'testanchor';

export const RAMP_ANCHORS: Record<StellarNetwork, RampAnchorConfig> = {
  testnet: { homeDomain: TESTNET_HOME, provider: providerOf(TESTNET_HOME), assetCode: 'USDC' },
  mainnet: { homeDomain: MAINNET_HOME, provider: providerOf(MAINNET_HOME), assetCode: 'USDC' },
};

/** Network the user-facing ramp panel operates on (testnet until mainnet go-live). */
export const RAMP_NETWORK: StellarNetwork =
  process.env.NEXT_PUBLIC_STELLAR_RAMP_NETWORK === 'mainnet' ? 'mainnet' : 'testnet';

export const getRampAnchor = (network: StellarNetwork): RampAnchorConfig => RAMP_ANCHORS[network];
