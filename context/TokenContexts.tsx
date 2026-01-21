'use client';

import React, { createContext, useState, ReactNode, useMemo } from 'react';
import { Blockchain } from '@/enums/Blockchain';

export const TokenContexts = createContext({
  // États
  swap: { token: 'USDT', blockchain: Blockchain.Polygon },
  buy: { token: 'USD', blockchain: Blockchain.Polygon },
  sell: { token: 'USD', blockchain: Blockchain.Polygon },

  // Actions
  updateSwapToken: (token: string) => {},
  updateSwapBlockchain: (blockchain: Blockchain) => {},
  updateBuyToken: (token: string) => {},
  updateBuyBlockchain: (blockchain: Blockchain) => {},
  updateSellToken: (token: string) => {},
  updateSellBlockchain: (blockchain: Blockchain) => {},
});

export const TokenProvider = ({ children }: { children: ReactNode }) => {
  // États séparés pour chaque page
  const [swapToken, setSwapToken] = useState(() =>
    typeof window !== 'undefined' ? localStorage.getItem('swapToken') || 'USDC' : 'USDC',
  );
  const [swapBlockchain, setSwapBlockchain] = useState<Blockchain>(() =>
    typeof window !== 'undefined'
      ? (localStorage.getItem('swapBlockchain') as Blockchain) || Blockchain.Polygon
      : Blockchain.Polygon,
  );
  const [buyToken, setBuyToken] = useState(() =>
    typeof window !== 'undefined' ? localStorage.getItem('buyToken') || 'EUR' : 'EUR',
  );
  const [buyBlockchain, setBuyBlockchain] = useState<Blockchain>(() =>
    typeof window !== 'undefined'
      ? (localStorage.getItem('buyBlockchain') as Blockchain) || Blockchain.Polygon
      : Blockchain.Polygon,
  );
  const [sellToken, setSellToken] = useState(() =>
    typeof window !== 'undefined' ? localStorage.getItem('sellToken') || 'USD' : 'USD',
  );
  const [sellBlockchain, setSellBlockchain] = useState<Blockchain>(() =>
    typeof window !== 'undefined'
      ? (localStorage.getItem('sellBlockchain') as Blockchain) || Blockchain.Polygon
      : Blockchain.Polygon,
  );

  // Save to localStorage when values change
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('swapToken', swapToken);
    }
  }, [swapToken]);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('swapBlockchain', swapBlockchain);
    }
  }, [swapBlockchain]);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('buyToken', buyToken);
    }
  }, [buyToken]);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('buyBlockchain', buyBlockchain);
    }
  }, [buyBlockchain]);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sellToken', sellToken);
    }
  }, [sellToken]);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sellBlockchain', sellBlockchain);
    }
  }, [sellBlockchain]);

  const contextValue = useMemo(
    () => ({
      swap: { token: swapToken, blockchain: swapBlockchain },
      buy: { token: buyToken, blockchain: buyBlockchain },
      sell: { token: sellToken, blockchain: sellBlockchain },
      updateSwapToken: setSwapToken,
      updateSwapBlockchain: setSwapBlockchain,
      updateBuyToken: setBuyToken,
      updateBuyBlockchain: setBuyBlockchain,
      updateSellToken: setSellToken,
      updateSellBlockchain: setSellBlockchain,
    }),
    [swapToken, swapBlockchain, buyToken, buyBlockchain, sellToken, sellBlockchain],
  );

  return <TokenContexts.Provider value={contextValue}>{children}</TokenContexts.Provider>;
};
