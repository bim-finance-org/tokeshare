// Stellar network profiles. Each RWA asset (config/stellar-assets.ts) declares
// which network it lives on, so testnet and mainnet assets coexist — the data
// layer and signer are parameterized by the asset's network profile rather than a
// single global env value. RPC endpoints can be overridden via env; the USDC
// payment asset per network is public info and hardcoded.

export type StellarNetwork = 'testnet' | 'mainnet';

export interface StellarNetworkProfile {
  network: StellarNetwork;
  networkPassphrase: string;
  rpcUrl: string;
  horizonUrl: string;
  /** Payment asset (USDC) for this network — classic asset + its SAC. */
  pay: { code: string; issuer: string; sacId: string };
  /**
   * Revenue distributor contract (tranche 2) — one global contract per
   * network, serving every asset. Empty until deployed.
   */
  distributorId: string;
}

const TESTNET: StellarNetworkProfile = {
  network: 'testnet',
  networkPassphrase: 'Test SDF Network ; September 2015',
  rpcUrl: process.env.NEXT_PUBLIC_STELLAR_TESTNET_RPC_URL ?? 'https://soroban-testnet.stellar.org',
  horizonUrl: 'https://horizon-testnet.stellar.org',
  // Circle testnet USDC — the one MoneyGram's test anchor and the SDP use, so
  // a testnet deposit can buy shares and receive distributions end to end.
  pay: {
    code: 'USDC',
    issuer: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
    sacId: 'CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA',
  },
  distributorId: process.env.NEXT_PUBLIC_STELLAR_TESTNET_DISTRIBUTOR_ID ?? '',
};

const MAINNET: StellarNetworkProfile = {
  network: 'mainnet',
  networkPassphrase: 'Public Global Stellar Network ; September 2015',
  rpcUrl: process.env.NEXT_PUBLIC_STELLAR_MAINNET_RPC_URL ?? 'https://mainnet.sorobanrpc.com',
  horizonUrl: 'https://horizon.stellar.org',
  pay: {
    code: 'USDC',
    issuer: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
    sacId: 'CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75',
  },
  distributorId: process.env.NEXT_PUBLIC_STELLAR_MAINNET_DISTRIBUTOR_ID ?? '',
};

export const STELLAR_NETWORKS: Record<StellarNetwork, StellarNetworkProfile> = {
  testnet: TESTNET,
  mainnet: MAINNET,
};

export const getNetworkProfile = (network: StellarNetwork): StellarNetworkProfile => STELLAR_NETWORKS[network];

// All classic Stellar assets and XLM use 7 decimals.
export const STELLAR_DECIMALS = 7;
export const STROOPS_PER_UNIT = 10_000_000;
