'use client';

import React from 'react';
import { useStablecoinPrice, useStablePrices } from '@/app/hooks/useStablePrice';

// Composant pour afficher un seul stablecoin
function UsdtDisplay() {
  const { data: usdtPrice, isLoading, error } = useStablecoinPrice({stablecoin: 'USDT'});
  
  if (isLoading) return <div className="text-gray-400">Chargement du prix USDT...</div>;
  if (error) return <div className="text-red-500">Erreur: {error.message}</div>;
  
  return (
    <div className="p-4 bg-blue-100 rounded-lg">
      <h3 className="font-bold">USDT</h3>
      <p className="text-2xl font-semibold">${usdtPrice?.toFixed(4)}</p>
    </div>
  );
}

// Composant pour afficher plusieurs stablecoins
function StablecoinsList() {
  const { data: prices, isLoading, error } = useStablePrices(['USDT', 'USDC', 'DAI', 'USDC.e']);
  
  if (isLoading) return <div className="text-gray-400">Chargement des prix...</div>;
  if (error) return <div className="text-red-500">Erreur: {error.message}</div>;
  if (!prices) return <div className="text-yellow-500">Aucune donnée disponible</div>;
  
  return (
    <div className="p-4 bg-gray-100 rounded-lg space-y-2">
      <h3 className="font-bold text-xl">Tous les Stablecoins</h3>
      <ul className="space-y-2">
        {Object.entries(prices).map(([symbol, price]) => (
          <li key={symbol} className="flex justify-between border-b pb-2">
            <span className="font-medium">{symbol}</span>
            <span className="font-semibold">${price.toFixed(4)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const TestPage = () => {
  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Test des Prix des Stablecoins</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div>
          <h2 className="text-2xl font-semibold mb-4">Prix USDT</h2>
          <UsdtDisplay />
        </div>
        
        <div>
          <h2 className="text-2xl font-semibold mb-4">Tous les Stablecoins</h2>
          <StablecoinsList />
        </div>
      </div>
      
      <div className="bg-gray-100 p-4 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Comment ça fonctionne</h2>
        <p className="mb-2">
          Cette page démontre l'utilisation des hooks stablecoin:
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li><code>useUsdtPrice()</code> - Pour un seul stablecoin</li>
          <li><code>useStablePrices(['USDT', 'USDC', ...])</code> - Pour plusieurs stablecoins</li>
        </ul>
        <p className="mt-4 text-sm text-gray-600">
          Notez que ces deux composants partagent le même appel API sous-jacent grâce au système de cache.
        </p>
      </div>
    </div>
  );
};

export default TestPage;