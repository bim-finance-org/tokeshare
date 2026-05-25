'use client';

import dynamic from 'next/dynamic';
import ExchangeSkeleton from './ExchangeSkeleton';

// Exchange depends on a thick stack (Wagmi, viem, AppKit, the swap hooks)
// that we don't want to ship in the server bundle nor render at SSR with
// disconnected wallet state. Loading it client-only after hydration removes
// the wagmi flash and trims the initial server payload.
const Exchange = dynamic(() => import('./Exchange'), {
  ssr: false,
  loading: () => <ExchangeSkeleton />,
});

export default Exchange;
