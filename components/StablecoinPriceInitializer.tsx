'use client';

import { usePrefetchStablePrices } from '@/hooks/useStablePrice';

/**
 * Composant à inclure dans le layout principal de l'application
 * pour initialiser le chargement des prix des stablecoins au démarrage.
 * 
 * Ce composant ne rend rien visuellement, il sert uniquement à
 * déclencher le chargement des données.
 */
export function StablecoinPriceInitializer() {
  // Déclenche la préchargement des prix des stablecoins
  usePrefetchStablePrices();
  
  // Ce composant ne rend rien
  return null;
} 