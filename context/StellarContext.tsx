'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  StellarWalletsKit,
  WalletNetwork,
  allowAllModules,
  type ISupportedWallet,
} from '@creit.tech/stellar-wallets-kit';
import { getLogger } from '@/lib/logger';

const log = getLogger('stellar');

/**
 * An account contributed by an alternative onboarding path (e.g. a Privy embedded
 * wallet). When registered, it takes precedence over the Wallets Kit account, so
 * every consumer of useStellarAccount() works with either path unchanged.
 */
export type ExternalStellarAccount = {
  address: string;
  source: 'privy';
  signTransaction: (xdr: string, networkPassphrase: string) => Promise<string>;
  disconnect: () => Promise<void>;
};

type StellarSource = 'wallet-kit' | 'privy';

type StellarContextValue = {
  address: string | undefined;
  walletId: string | undefined;
  source: StellarSource | undefined;
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  /** Signs on the given network (assets can be on testnet or mainnet). */
  signTransaction: (xdr: string, networkPassphrase: string) => Promise<string>;
  /** Registers (or clears with null) an external account such as Privy. */
  registerExternalAccount: (account: ExternalStellarAccount | null) => void;
};

const StellarContext = createContext<StellarContextValue | undefined>(undefined);
const STORAGE_KEY = 'tokeshare:stellar-wallet-id';

export function StellarProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | undefined>();
  const [walletId, setWalletId] = useState<string | undefined>();
  const [external, setExternal] = useState<ExternalStellarAccount | null>(null);
  const kitRef = useRef<StellarWalletsKit | null>(null);

  const registerExternalAccount = useCallback((account: ExternalStellarAccount | null) => {
    setExternal(account);
  }, []);

  useEffect(() => {
    if (kitRef.current) return;

    const storedWalletId = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) ?? undefined : undefined;

    // The kit needs a default network; per-asset signing overrides it per call
    // (assets can be on testnet or mainnet). A wallet's address is the same across
    // networks, so this default only affects the initial address request.
    const kit = new StellarWalletsKit({
      network: WalletNetwork.PUBLIC,
      selectedWalletId: storedWalletId,
      modules: allowAllModules(),
    });
    kitRef.current = kit;

    if (!storedWalletId) return;

    // All state updates happen inside the promise callbacks (never
    // synchronously in the effect body) so this doesn't cascade renders.
    kit
      .getAddress({ skipRequestAccess: true })
      .then(({ address }) => {
        setWalletId(storedWalletId);
        if (address) setAddress(address);
      })
      .catch(() => {
        localStorage.removeItem(STORAGE_KEY);
      });
  }, []);

  const connect = useCallback(async () => {
    const kit = kitRef.current;
    if (!kit) return;
    try {
      await kit.openModal({
        onWalletSelected: async (option: ISupportedWallet) => {
          try {
            kit.setWallet(option.id);
            const { address } = await kit.getAddress();
            setWalletId(option.id);
            setAddress(address);
            localStorage.setItem(STORAGE_KEY, option.id);
          } catch (error) {
            log.error('wallet connection failed', error);
          }
        },
      });
    } catch (error) {
      log.error('modal error', error);
    }
  }, []);

  const disconnect = useCallback(async () => {
    // An external account (e.g. Privy) takes precedence — tear it down first.
    if (external) {
      await external.disconnect();
      setExternal(null);
      return;
    }
    const kit = kitRef.current;
    if (!kit) return;
    await kit.disconnect();
    localStorage.removeItem(STORAGE_KEY);
    setAddress(undefined);
    setWalletId(undefined);
  }, [external]);

  const signTransaction = useCallback(
    async (xdr: string, networkPassphrase: string): Promise<string> => {
      if (external) return external.signTransaction(xdr, networkPassphrase);
      const kit = kitRef.current;
      if (!kit || !address) throw new Error('Wallet not connected');
      const { signedTxXdr } = await kit.signTransaction(xdr, {
        address,
        networkPassphrase: networkPassphrase as WalletNetwork,
      });
      return signedTxXdr;
    },
    [address, external],
  );

  const activeAddress = external?.address ?? address;

  const value = useMemo<StellarContextValue>(
    () => ({
      address: activeAddress,
      walletId,
      source: external ? 'privy' : activeAddress ? 'wallet-kit' : undefined,
      isConnected: !!activeAddress,
      connect,
      disconnect,
      signTransaction,
      registerExternalAccount,
    }),
    [activeAddress, walletId, external, connect, disconnect, signTransaction, registerExternalAccount],
  );

  return <StellarContext.Provider value={value}>{children}</StellarContext.Provider>;
}

export function useStellarAccount(): StellarContextValue {
  const ctx = useContext(StellarContext);
  if (!ctx) {
    throw new Error('useStellarAccount must be used within a StellarProvider');
  }
  return ctx;
}
