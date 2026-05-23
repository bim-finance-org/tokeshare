'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { StellarWalletsKit } from '@creit.tech/stellar-wallets-kit/sdk';
import { defaultModules } from '@creit.tech/stellar-wallets-kit/modules/utils';
import { KitEventType, SwkAppLightTheme } from '@creit.tech/stellar-wallets-kit/types';

type StellarContextValue = {
  address: string | undefined;
  walletId: string | undefined;
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
};

const StellarContext = createContext<StellarContextValue | undefined>(undefined);

export function StellarProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | undefined>();
  const [walletId, setWalletId] = useState<string | undefined>();
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    StellarWalletsKit.init({
      theme: SwkAppLightTheme,
      modules: defaultModules(),
    });

    const unsubState = StellarWalletsKit.on(KitEventType.STATE_UPDATED, (event) => {
      setAddress(event.payload.address);
    });
    const unsubWallet = StellarWalletsKit.on(KitEventType.WALLET_SELECTED, (event) => {
      setWalletId(event.payload.id);
    });
    const unsubDisconnect = StellarWalletsKit.on(KitEventType.DISCONNECT, () => {
      setAddress(undefined);
      setWalletId(undefined);
    });

    return () => {
      unsubState();
      unsubWallet();
      unsubDisconnect();
    };
  }, []);

  const connect = useCallback(async () => {
    try {
      await StellarWalletsKit.authModal();
    } catch (error) {
      const code = (error as { code?: number } | undefined)?.code;
      if (code !== -1) {
        console.error('Stellar wallet connection failed:', error);
      }
    }
  }, []);

  const disconnect = useCallback(async () => {
    await StellarWalletsKit.disconnect();
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
