// Central Stellar config, driven by NEXT_PUBLIC_* env vars produced by
// scripts/stellar/deploy.sh (.deploy-output.env). Defaults target testnet so
// local dev works before mainnet ids are set.

const TESTNET_PASSPHRASE = 'Test SDF Network ; September 2015';

export const stellarConfig = {
  networkPassphrase: process.env.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE ?? TESTNET_PASSPHRASE,
  rpcUrl: process.env.NEXT_PUBLIC_STELLAR_RPC_URL ?? 'https://soroban-testnet.stellar.org',
  saleContractId: process.env.NEXT_PUBLIC_TRES_SALE_CONTRACT_ID ?? '',
  tres: {
    code: process.env.NEXT_PUBLIC_TRES_ASSET_CODE ?? 'TRES',
    issuer: process.env.NEXT_PUBLIC_TRES_ASSET_ISSUER ?? '',
    sacId: process.env.NEXT_PUBLIC_TRES_SAC_ID ?? '',
  },
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

// Horizon is used for classic operations (trustlines); RPC for Soroban calls.
export const horizonUrl = isMainnet ? 'https://horizon.stellar.org' : 'https://horizon-testnet.stellar.org';

export const isStellarConfigured = Boolean(stellarConfig.saleContractId && stellarConfig.tres.issuer);
