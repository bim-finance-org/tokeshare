'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  StellarWalletsKit,
  WalletNetwork,
  allowAllModules,
  type ISupportedWallet,
} from '@creit.tech/stellar-wallets-kit';

type StellarContextValue = {
  address: string | undefined;
  walletId: string | undefined;
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
};

const StellarContext = createContext<StellarContextValue | undefined>(undefined);
const STORAGE_KEY = 'tokeshare:stellar-wallet-id';

export function StellarProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | undefined>();
  const [walletId, setWalletId] = useState<string | undefined>();
  const kitRef = useRef<StellarWalletsKit | null>(null);

  useEffect(() => {
    if (kitRef.current) return;

    const storedWalletId = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) ?? undefined : undefined;

    const kit = new StellarWalletsKit({
      network: WalletNetwork.PUBLIC,
      selectedWalletId: storedWalletId,
      modules: allowAllModules(),
    });
    kitRef.current = kit;

    if (storedWalletId) {
      setWalletId(storedWalletId);
      kit
        .getAddress({ skipRequestAccess: true })
        .then(({ address }) => {
          if (address) setAddress(address);
        })
        .catch(() => {
          localStorage.removeItem(STORAGE_KEY);
          setWalletId(undefined);
        });
    }
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
            console.error('Stellar wallet connection failed:', error);
          }
        },
      });
    } catch (error) {
      console.error('Stellar modal error:', error);
    }
  }, []);

  const disconnect = useCallback(async () => {
    const kit = kitRef.current;
    if (!kit) return;
    await kit.disconnect();
    localStorage.removeItem(STORAGE_KEY);
    setAddress(undefined);
    setWalletId(undefined);
  }, []);

  const value = useMemo<StellarContextValue>(
    () => ({
      address,
      walletId,
      isConnected: !!address,
      connect,
      disconnect,
    }),
    [address, walletId, connect, disconnect],
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
