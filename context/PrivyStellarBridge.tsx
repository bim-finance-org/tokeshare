'use client';

// Bridges a Privy embedded Stellar wallet into StellarContext. Rendered only when
// Privy is enabled (inside PrivyProvider). It creates a Stellar wallet on login if
// the user has none, then registers the account (address + signer) into
// StellarContext so the whole app treats Privy users exactly like Wallets Kit
// users. Renders nothing.

import { useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useCreateWallet, useSignRawHash } from '@privy-io/react-auth/extended-chains';
import { useStellarAccount } from './StellarContext';
import { signStellarXdrWithPrivy } from '@/lib/privy-stellar';
import { getLogger } from '@/lib/logger';

const log = getLogger('privy-stellar');

// Privy's linkedAccounts is a broad union; we only care about the Stellar wallet.
type MaybeWallet = { type: string; chainType?: string; address?: string };

function findStellarAddress(linkedAccounts: unknown): string | undefined {
  const accounts = (linkedAccounts ?? []) as MaybeWallet[];
  return accounts.find((a) => a.type === 'wallet' && a.chainType === 'stellar')?.address;
}

export default function PrivyStellarBridge() {
  const { ready, authenticated, user, logout } = usePrivy();
  const { signRawHash } = useSignRawHash();
  const { createWallet } = useCreateWallet();
  const { registerExternalAccount } = useStellarAccount();

  const stellarAddress = authenticated ? findStellarAddress(user?.linkedAccounts) : undefined;

  // Ensure a Stellar embedded wallet exists once the user is authenticated.
  useEffect(() => {
    if (!ready || !authenticated || stellarAddress) return;
    createWallet({ chainType: 'stellar' }).catch((error) => log.error('stellar wallet creation failed', error));
  }, [ready, authenticated, stellarAddress, createWallet]);

  // Register / clear the account into StellarContext.
  useEffect(() => {
    if (!ready) return;
    if (authenticated && stellarAddress) {
      registerExternalAccount({
        address: stellarAddress,
        source: 'privy',
        signTransaction: (xdr, networkPassphrase) =>
          signStellarXdrWithPrivy(signRawHash, stellarAddress, xdr, networkPassphrase),
        disconnect: async () => {
          await logout();
        },
      });
    } else if (!authenticated) {
      registerExternalAccount(null);
    }
  }, [ready, authenticated, stellarAddress, signRawHash, logout, registerExternalAccount]);

  return null;
}
