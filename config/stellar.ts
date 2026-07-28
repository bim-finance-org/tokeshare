// Shared Stellar network config (passphrase, RPC, payment asset). Per-asset RWA
// token + sale contract ids live in config/stellar-assets.ts, not here.
// Driven by NEXT_PUBLIC_* env vars; defaults target testnet.

const TESTNET_PASSPHRASE = 'Test SDF Network ; September 2015';

export const stellarConfig = {
  networkPassphrase: process.env.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE ?? TESTNET_PASSPHRASE,
  rpcUrl: process.env.NEXT_PUBLIC_STELLAR_RPC_URL ?? 'https://soroban-testnet.stellar.org',
  pay: {
    code: process.env.NEXT_PUBLIC_PAY_ASSET_CODE ?? 'USDC',
    issuer: process.env.NEXT_PUBLIC_PAY_ASSET_ISSUER ?? '',
    sacId: process.env.NEXT_PUBLIC_PAY_SAC_ID ?? '',
  },
} as const;

// All classic Stellar assets and XLM use 7 decimals.
export const STELLAR_DECIMALS = 7;
export const STROOPS_PER_UNIT = 10_000_000;

export const isMainnet = stellarConfig.networkPassphrase === 'Public Global Stellar Network ; September 2015';

// Horizon is used for classic operations (USDC/XLM balances); RPC for Soroban.
export const horizonUrl = isMainnet ? 'https://horizon.stellar.org' : 'https://horizon-testnet.stellar.org';
