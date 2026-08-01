// Privy configuration for the mainstream (email/social) onboarding path.
//
// Everything Privy is gated behind NEXT_PUBLIC_PRIVY_APP_ID: when it is not set,
// the PrivyProvider is never mounted and the app behaves exactly as before (only
// the Wallets Kit path is available). This lets the scaffold live in the codebase
// before a Privy app + credentials exist.

export const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID ?? '';

export const isPrivyEnabled = Boolean(privyAppId);

// Login methods offered to mainstream investors. Email + the common social
// providers; no wallet setup required (an embedded Stellar wallet is created for
// them). Crypto-native users keep using Stellar Wallets Kit.
export const PRIVY_LOGIN_METHODS = ['email', 'google'] as const;
