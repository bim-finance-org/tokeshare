import { NextResponse } from 'next/server';
import { getFromCache, setCache } from '@/app/lib/redis';

// Durée d'expiration des données en secondes (1 minute)
const CACHE_EXPIRATION = 60;

// Interface pour les données mises en cache
interface CachedPrice {
  price: number;
  timestamp: number;
}

export async function GET() {
  try {
    console.log('PAXG price API route called');
    
    // Clé de cache pour PAXG
    const cacheKey = 'paxg:price';
    
    // Tenter de récupérer depuis le cache Redis
    console.log('Attempting to retrieve PAXG price from Redis cache');
    const cachedData = await getFromCache<CachedPrice>(cacheKey);
    
    if (cachedData) {
      console.log('Cache hit! Checking freshness of PAXG price data');
      
      // Vérifier si les données sont encore fraîches (moins de 1 minute)
      const cachedTimestamp = cachedData.timestamp;
      const currentTime = Date.now();
      const dataAge = currentTime - cachedTimestamp;
      
      if (dataAge < CACHE_EXPIRATION * 1000) {
        console.log(`Les données PAXG sont fraîches (${Math.round(dataAge / 1000)}s < ${CACHE_EXPIRATION}s)`);
        return NextResponse.json({
          price: cachedData.price,
          source: 'redis-cache',
          cachedAt: new Date(cachedTimestamp).toISOString(),
          age: Math.round(dataAge / 1000)
        });
      }
      
      console.log(`Les données PAXG sont périmées (${Math.round(dataAge / 1000)}s > ${CACHE_EXPIRATION}s), rafraîchissement...`);
    } else {
      console.log('Cache miss. Fetching fresh PAXG price');
    }
    
    // Si les données ne sont pas en cache ou sont périmées, récupérer depuis l'API
    const response = await fetch('https://cryptoprices.cc/PAXG/', {
      method: 'GET',
      headers: {
        'Accept': 'text/plain',
        'Content-Type': 'text/plain',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const priceText = await response.text();
    const price = parseFloat(priceText);
    
    console.log(`Fresh PAXG price fetched: ${price}`);
    
    // Préparer les données à mettre en cache
    const dataToCache: CachedPrice = {
      price: price,
      timestamp: Date.now()
    };
    
    // Stocker dans Redis
    console.log('Storing PAXG price in Redis cache');
    await setCache(cacheKey, dataToCache, CACHE_EXPIRATION * 2); // Double expiration pour Redis
    
    return NextResponse.json({
      price: price,
      source: 'cryptoprices-api',
      cachedAt: new Date().toISOString(),
      age: 0
    });
  } catch (error) {
    console.error('Error fetching PAXG price:', error);
    
    // Fallback to a default value in case of error
    return NextResponse.json({ 
      price: 2898.86,
      source: 'fallback-value',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 