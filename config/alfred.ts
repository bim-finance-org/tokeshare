// Alfred off-ramp: USDC on Stellar → local bank transfer in LATAM.
//
// Alfred is NOT a SEP anchor: it exposes a REST API (v1) where WE are the
// partner and each end user is a `customer` we create underneath us. Money
// lives on the customer's Alfred balance: the wallet sends USDC to the
// customer's own Stellar deposit address, and once credited, a fiat payout
// (with the USDC→fiat conversion inside it) sends it to a registered bank
// account. Identity verification runs on Alfred's hosted onboarding link, so
// no identity document ever reaches our servers; the bank identifier has no
// hosted equivalent and is the only end-user detail the app forwards.
//
// Client-safe module: corridor metadata and public flags only. Credentials and
// every outbound call live in lib/alfred (server-side).

/** Alfred's `Chain` value for Stellar. */
export const ALFRED_CHAIN = 'XLM';
export const ALFRED_CRYPTO_CURRENCY = 'USDC';

/**
 * Endorsements a customer needs before the off-ramp works: receiving USDC on
 * a deposit address, then holding it as a balance until it is paid out. A
 * domestic fiat payout has no endorsement of its own (only cross-border does).
 */
export const ALFRED_REQUIRED_ENDORSEMENTS = ['stablecoin_payin', 'stablecoin_balance'] as const;

/** A payout corridor — one `(country, currency, rail)` route of Alfred's registry. */
export interface AlfredCorridor {
  /** Stable key used in our API payloads and DB rows. */
  key: string;
  label: string;
  /** ISO 3166-1 alpha-3, the only form Alfred v1 emits. */
  country: string;
  /** Fiat currency paid out (the quote's `toCurrency`). */
  currency: string;
  /** Alfred rail the quote is priced on; must be in the destination's `supportedRails[]`. */
  rail: string;
  /** Bank identifier the user provides. */
  account: {
    /** Alfred `bankAccount.identifierType`. */
    identifierType: string;
    label: string;
    /** Validation of the raw identifier, mirrored server-side. */
    pattern: string;
    placeholder: string;
    /** PIX needs the holder's tax id (`holderTaxId`); SPEI does not. */
    requiresTaxId: boolean;
  };
}

export const ALFRED_CORRIDORS: AlfredCorridor[] = [
  {
    key: 'MX_SPEI',
    label: 'Mexico — SPEI transfer',
    country: 'MEX',
    currency: 'MXN',
    rail: 'SPEI',
    account: {
      identifierType: 'CLABE',
      label: 'CLABE (18 digits)',
      pattern: '^[0-9]{18}$',
      placeholder: '072180465644370317',
      requiresTaxId: false,
    },
  },
  {
    key: 'BR_PIX',
    label: 'Brazil — PIX transfer',
    country: 'BRA',
    currency: 'BRL',
    rail: 'PIX',
    account: {
      identifierType: 'PIX_KEY',
      label: 'PIX key (CPF, 11 digits)',
      pattern: '^[0-9]{11}$',
      placeholder: '12345678901',
      requiresTaxId: true,
    },
  },
];

export const getCorridor = (key: string): AlfredCorridor | undefined => ALFRED_CORRIDORS.find((c) => c.key === key);

/**
 * Corridors offered in the UI. The grant only requires one working LATAM
 * currency; Mexico is first because SPEI asks for the least about the user
 * (a CLABE and a name — PIX additionally requires a CPF).
 */
export const ENABLED_CORRIDOR_KEYS = (process.env.NEXT_PUBLIC_ALFRED_CORRIDORS || 'MX_SPEI')
  .split(',')
  .map((k) => k.trim())
  .filter(Boolean);

export const enabledCorridors = (): AlfredCorridor[] =>
  ALFRED_CORRIDORS.filter((c) => ENABLED_CORRIDOR_KEYS.includes(c.key));

/** Panel is hidden until the environment carries Alfred credentials. */
export const ALFRED_ENABLED = process.env.NEXT_PUBLIC_ALFRED_ENABLED === 'true';

/** Alfred settles Stellar USDC; the ramp network must match. */
export const ALFRED_NETWORK: 'testnet' | 'mainnet' =
  process.env.NEXT_PUBLIC_ALFRED_NETWORK === 'mainnet' ? 'mainnet' : 'testnet';

/**
 * Sandbox has no real settlement: funds only arrive through Alfred's deposit
 * simulator, so the panel offers that next to the on-chain send. The server
 * refuses the simulator anyway unless ALFRED_API_ENV is `sandbox`.
 */
export const ALFRED_SANDBOX = process.env.NEXT_PUBLIC_ALFRED_SANDBOX === 'true';
