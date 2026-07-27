'use client';

import { wagmiAdapter, projectId } from '../config';
import { createAppKit } from '@reown/appkit/react';
import { polygon, base, mainnet } from '@reown/appkit/networks';
import React, { type ReactNode } from 'react';
import { cookieToInitialState, WagmiProvider, type Config } from 'wagmi';
import { PrivyProvider } from '@privy-io/react-auth';
import { StellarProvider } from './StellarContext';
import PrivyStellarBridge from './PrivyStellarBridge';
import { PRIVY_LOGIN_METHODS, isPrivyEnabled, privyAppId } from '@/config/privy';

if (!projectId) {
  throw new Error('Project ID is not defined');
}

const metadata = {
  name: 'Tokeshare',
  description: 'Invest in real world assets',
  url: 'https://tokeshare.co',
  icons: ['/logos/shorts/tokeshare_gold.png'],
};

createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks: [polygon, base, mainnet],
  defaultNetwork: polygon,
  enableNetworkSwitch: true,
  metadata: metadata,
  allowUnsupportedChain: true,
  themeMode: 'light',
  features: {
    analytics: true,
    swaps: false,
    onramp: false,
  },
  themeVariables: {
    '--w3m-z-index': 100,
  },
});

// Mounts Privy (email/social onboarding) only when configured, so without
// NEXT_PUBLIC_PRIVY_APP_ID the app behaves exactly as before. The bridge syncs the
// Privy embedded Stellar wallet into StellarContext.
function PrivyGate({ children }: { children: ReactNode }) {
  if (!isPrivyEnabled) return <>{children}</>;
  return (
    <PrivyProvider
      appId={privyAppId}
      config={{
        loginMethods: [...PRIVY_LOGIN_METHODS],
        appearance: { theme: 'light' },
      }}
    >
      <PrivyStellarBridge />
      {children}
    </PrivyProvider>
  );
}

function ContextProvider({ children, cookies }: { children: ReactNode; cookies: string | null }) {
  const initialState = cookieToInitialState(wagmiAdapter.wagmiConfig as Config, cookies);

  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig as Config} initialState={initialState}>
      <StellarProvider>
        <PrivyGate>{children}</PrivyGate>
      </StellarProvider>
    </WagmiProvider>
  );
}

export default ContextProvider;
