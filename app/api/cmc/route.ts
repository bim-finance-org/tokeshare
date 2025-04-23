import { NextRequest, NextResponse } from 'next/server';
import { getFromCache, setCache } from '@/app/lib/redis';

// Durée d'expiration des données en secondes (20 minutes)
const CACHE_EXPIRATION = 20 * 60;

// Interface pour les données mises en cache
interface CachedData {
  data: any;
  timestamp: number;
}

export async function GET(request: NextRequest) {
  try {
    console.log('CMC API route called');
    
    // Get symbol(s) from query params
    const { searchParams } = new URL(request.url);
    const symbolParam = searchParams.get('symbol') || searchParams.get('symbols');
    
    if (!symbolParam) {
      console.log('Missing symbol parameter');
      return NextResponse.json({ error: 'Symbol or symbols parameter is required' }, { status: 400 });
    }
    
    // Handle both single symbol and multiple symbols
    const symbols = symbolParam.includes(',') ? symbolParam : symbolParam;
    console.log(`Requested symbols: ${symbols}`);
    
    // Create a cache key based on the symbols
    const cacheKey = `cmc:prices:${symbols}`;
    console.log(`Cache key: ${cacheKey}`);
    
    // Try to get data from Redis cache first
    console.log('Attempting to retrieve data from Redis cache');
    const cachedData = await getFromCache<CachedData>(cacheKey);
    
    if (cachedData) {
      console.log('Cache hit! Checking freshness of data');
      
      // Vérifier si les données sont encore fraîches (moins de 20 minutes)
      // Les métadonnées de Redis ne sont pas utilisées ici, nous vérifions le timestamp stocké dans les données
      const cachedTimestamp = cachedData.timestamp;
      const currentTime = Date.now();
      const dataAge = currentTime - cachedTimestamp;
      
      if (dataAge < CACHE_EXPIRATION * 1000) {
        console.log(`Les données sont fraîches (${Math.round(dataAge / 1000)}s < ${CACHE_EXPIRATION}s)`);
        return NextResponse.json({
          data: cachedData.data,
          source: 'redis-cache',
          cachedAt: new Date(cachedTimestamp).toISOString(),
          age: Math.round(dataAge / 1000)
        });
      }
      
      console.log(`Les données sont périmées (${Math.round(dataAge / 1000)}s > ${CACHE_EXPIRATION}s), rafraîchissement...`);
    } else {
      console.log('Cache miss. Fetching from CoinMarketCap API');
    }
    
    // Si on arrive ici, soit il n'y a pas de données en cache, soit elles sont périmées
    // Donc on récupère de nouvelles données depuis l'API
    const cmcApiUrl = 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest';
    
    console.log(`Fetching from CMC API: ${cmcApiUrl}?symbol=${symbols}`);
    const response = await fetch(`${cmcApiUrl}?symbol=${symbols}`, {
      headers: {
        'X-CMC_PRO_API_KEY': process.env.COINMARKETCAP_API_KEY || '',
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`CMC API error: ${response.status}, ${errorText}`);
      throw new Error(`CoinMarketCap API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Successfully fetched data from CMC API');
    
    // Préparer les données à mettre en cache avec un timestamp
    const dataToCache: CachedData = {
      data: data,
      timestamp: Date.now()
    };
    
    // Store the response in Redis cache (with longer expiration to allow for age checking)
    // Nous stockons avec une expiration plus longue pour que Redis n'efface pas les données automatiquement
    // Notre logique utilise le timestamp pour déterminer la fraîcheur
    console.log('Storing data in Redis cache');
    await setCache(cacheKey, dataToCache, CACHE_EXPIRATION * 2); // Double expiration pour Redis
    
    return NextResponse.json({
      data: data,
      source: 'coinmarketcap-api',
      cachedAt: new Date().toISOString(),
      age: 0
    });
  } catch (error) {
    console.error('CoinMarketCap API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data from CoinMarketCap', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
