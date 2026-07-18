'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { Blockchain } from '@/enums/Blockchain';

type TokenState = { token: string; blockchain: Blockchain };
type Prefs = { swap: TokenState };

export interface TokenContextValue extends Prefs {
  updateSwapToken: (token: string) => void;
  updateSwapBlockchain: (blockchain: Blockchain) => void;
}

const DEFAULTS: Prefs = {
  swap: { token: 'USDC', blockchain: Blockchain.Polygon },
};

const STORAGE_KEY = 'tokeshare:token-prefs';

// Module-level store. Single source of truth for the active tab.
let cachedPrefs: Prefs = DEFAULTS;
let cacheInitialized = false;
const listeners = new Set<() => void>();

function readFromStorage(): Prefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Prefs>;
      return {
        swap: { ...DEFAULTS.swap, ...parsed.swap },
      };
    }
  } catch {
    // corrupted entry — fall back to defaults
  }
  return DEFAULTS;
}

function ensureHydrated() {
  if (!cacheInitialized && typeof window !== 'undefined') {
    cachedPrefs = readFromStorage();
    cacheInitialized = true;
  }
}

function subscribe(listener: () => void): () => void {
  ensureHydrated();
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      cachedPrefs = readFromStorage();
      listeners.forEach((l) => l());
    }
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

function getSnapshot(): Prefs {
  ensureHydrated();
  return cachedPrefs;
}

// SSR / first-render snapshot — stable across server/client to avoid hydration
// mismatches. The client snapshot takes over right after hydration thanks to
// useSyncExternalStore's contract.
function getServerSnapshot(): Prefs {
  return DEFAULTS;
}

function updatePrefs(updater: (prev: Prefs) => Prefs) {
  ensureHydrated();
  const next = updater(cachedPrefs);
  if (next === cachedPrefs) return;
  cachedPrefs = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // quota exceeded or private mode — best-effort persistence
  }
  listeners.forEach((l) => l());
}

const TokenContext = createContext<TokenContextValue | null>(null);

export function useTokenContext(): TokenContextValue {
  const ctx = useContext(TokenContext);
  if (!ctx) {
    throw new Error('useTokenContext must be used within a <TokenProvider>');
  }
  return ctx;
}

export const TokenProvider = ({ children }: { children: ReactNode }) => {
  const prefs = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const updateSwapToken = useCallback(
    (token: string) => updatePrefs((p) => ({ ...p, swap: { ...p.swap, token } })),
    [],
  );
  const updateSwapBlockchain = useCallback(
    (blockchain: Blockchain) => updatePrefs((p) => ({ ...p, swap: { ...p.swap, blockchain } })),
    [],
  );

  const value = useMemo<TokenContextValue>(
    () => ({
      swap: prefs.swap,
      updateSwapToken,
      updateSwapBlockchain,
    }),
    [prefs.swap, updateSwapToken, updateSwapBlockchain],
  );

  return <TokenContext.Provider value={value}>{children}</TokenContext.Provider>;
};
