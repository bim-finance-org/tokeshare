'use client';

import { wagmiAdapter, projectId } from '../config';
import { createAppKit } from '@reown/appkit/react';
import { polygon } from '@reown/appkit/networks';
import React, { type ReactNode } from 'react';
import { cookieToInitialState, WagmiProvider, type Config } from 'wagmi';

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
  networks: [polygon],
  defaultNetwork: polygon,
  enableNetworkSwitch: false,
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

function ContextProvider({ children, cookies }: { children: ReactNode; cookies: string | null }) {
  const initialState = cookieToInitialState(wagmiAdapter.wagmiConfig as Config, cookies);

  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig as Config} initialState={initialState}>
      {children}
    </WagmiProvider>
  );
}

export default ContextProvider;
