'use client'

import React, { createContext, useState, ReactNode } from 'react';

export const TokenContexts = createContext({
  // États
  swap: { token: 'USDT', blockchain: 'Polygon' },
  buy: { token: 'EUR', blockchain: 'Polygon' },
  sell: { token: 'USD', blockchain: 'Polygon' },
  
  // Actions
  updateSwapToken: (token: string) => {},
  updateSwapBlockchain: (blockchain: string) => {},
  updateBuyToken: (token: string) => {},
  updateBuyBlockchain: (blockchain: string) => {},
  updateSellToken: (token: string) => {},
  updateSellBlockchain: (blockchain: string) => {},
});

export const TokenProvider = ({ children }: { children: ReactNode }) => {
  // États séparés pour chaque page
  const [swapToken, setSwapToken] = useState(() => 
    typeof window !== 'undefined' ? localStorage.getItem("swapToken") || "USDT" : "USDT"
  );
  const [swapBlockchain, setSwapBlockchain] = useState(() =>
    typeof window !== 'undefined' ? localStorage.getItem("swapBlockchain") || "Polygon" : "Polygon"
  );
  const [buyToken, setBuyToken] = useState(() => 
    typeof window !== 'undefined' ? localStorage.getItem("buyToken") || "EUR" : "EUR"
  );
  const [buyBlockchain, setBuyBlockchain] = useState(() =>
    typeof window !== 'undefined' ? localStorage.getItem("buyBlockchain") || "Polygon" : "Polygon"
  );
  const [sellToken, setSellToken] = useState(() => 
    typeof window !== 'undefined' ? localStorage.getItem("sellToken") || "USD" : "USD"
  );
  const [sellBlockchain, setSellBlockchain] = useState(() =>
    typeof window !== 'undefined' ? localStorage.getItem("sellBlockchain") || "Polygon" : "Polygon"
  );

  // Save to localStorage when values change
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem("swapToken", swapToken);
    }
  }, [swapToken]);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem("swapBlockchain", swapBlockchain);
    }
  }, [swapBlockchain]);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem("buyToken", buyToken);
    }
  }, [buyToken]);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem("buyBlockchain", buyBlockchain);
    }
  }, [buyBlockchain]);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem("sellToken", sellToken);
    }
  }, [sellToken]);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem("sellBlockchain", sellBlockchain);
    }
  }, [sellBlockchain]);

  return (
    <TokenContexts.Provider value={{
      swap: { token: swapToken, blockchain: swapBlockchain },
      buy: { token: buyToken, blockchain: buyBlockchain },
      sell: { token: sellToken, blockchain: sellBlockchain },
      updateSwapToken: setSwapToken,
      updateSwapBlockchain: setSwapBlockchain,
      updateBuyToken: setBuyToken,
      updateBuyBlockchain: setBuyBlockchain,
      updateSellToken: setSellToken,
      updateSellBlockchain: setSellBlockchain
    }}>
      {children}
    </TokenContexts.Provider>
  );
};
