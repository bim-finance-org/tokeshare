import { NextResponse } from 'next/server';
import { getFromCache, setCache } from '@/app/lib/redis';

// Durée d'expiration des données en secondes (30 minutes)
const CACHE_EXPIRATION = 30 * 60;

// Clé API pour exchangerate-api.com - À remplacer par votre propre clé
// Vous pouvez obtenir une clé gratuite sur https://www.exchangerate-api.com/
const API_KEY = process.env.EXCHANGE_RATE_API_KEY;

// Interface pour les données mises en cache
interface CachedExchangeRates {
  rates: {
    EUR: number;
    CAD: number;
    CHF: number;
    GBP: number;
    USD: number;
    // Ajoutez d'autres devises au besoin
  };
  base: string;
  timestamp: number;
}

export async function GET() {
  try {
    console.log('Exchange rates API route called');
    
    // Clé de cache pour les taux de change
    const cacheKey = 'exchange:rates:usd';
    
    // Tenter de récupérer depuis le cache Redis
    console.log('Attempting to retrieve exchange rates from Redis cache');
    const cachedData = await getFromCache<CachedExchangeRates>(cacheKey);
    
    if (cachedData) {
      console.log('Cache hit! Checking freshness of exchange rate data');
      
      // Vérifier si les données sont encore fraîches (moins de 30 minutes)
      const cachedTimestamp = cachedData.timestamp;
      const currentTime = Date.now();
      const dataAge = currentTime - cachedTimestamp;
      
      if (dataAge < CACHE_EXPIRATION * 1000) {
        console.log(`Les données sont fraîches (${Math.round(dataAge / 1000)}s < ${CACHE_EXPIRATION}s)`);
        return NextResponse.json({
          rates: cachedData.rates,
          base: cachedData.base,
          source: 'redis-cache',
          cachedAt: new Date(cachedTimestamp).toISOString(),
          age: Math.round(dataAge / 1000)
        });
      }
      
      console.log(`Les données sont périmées (${Math.round(dataAge / 1000)}s > ${CACHE_EXPIRATION}s), rafraîchissement...`);
    } else {
      console.log('Cache miss. Fetching from Exchange Rate API');
    }
    
    // Si on arrive ici, soit il n'y a pas de données en cache, soit elles sont périmées
    // Donc on récupère de nouvelles données depuis l'API
    const apiUrl = `https://v6.exchangerate-api.com/v6/${API_KEY}/latest/USD`;
    
    console.log(`Fetching from Exchange Rate API: ${apiUrl}`);
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Exchange Rate API error: ${response.status}, ${errorText}`);
      throw new Error(`Exchange Rate API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Vérifier si la réponse contient une erreur
    if (data.result === 'error') {
      console.error(`Exchange Rate API returned an error: ${data.error}`);
      throw new Error(`Exchange Rate API error: ${data.error}`);
    }
    
    console.log('Successfully fetched data from Exchange Rate API');
    
    // Préparer les données à mettre en cache
    const dataToCache: CachedExchangeRates = {
      rates: {
        EUR: data.conversion_rates.EUR,
        CAD: data.conversion_rates.CAD,
        CHF: data.conversion_rates.CHF,
        GBP: data.conversion_rates.GBP,
        USD: data.conversion_rates.USD,
        // Ajoutez d'autres devises au besoin
      },
      base: data.base_code,
      timestamp: Date.now()
    };
    
    // Stocker dans Redis
    console.log('Storing exchange rates in Redis cache');
    await setCache(cacheKey, dataToCache, CACHE_EXPIRATION * 2); // Double expiration pour Redis
    
    return NextResponse.json({
      rates: dataToCache.rates,
      base: dataToCache.base,
      source: 'exchange-rate-api',
      cachedAt: new Date(dataToCache.timestamp).toISOString(),
      age: 0
    });
  } catch (error) {
    console.error('Exchange Rate API error:', error);
    
    // Fallback values for critical currencies in case of an error
    return NextResponse.json({ 
      rates: { 
        EUR: undefined,
        CAD: undefined, 
        CHF: undefined,
        GBP: undefined,
        USD: undefined,
      },
      base: 'USD',
      source: 'fallback-values',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 