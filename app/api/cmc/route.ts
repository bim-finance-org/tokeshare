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
    
    // Extract query parameters
    const { searchParams } = new URL(request.url);
    
    // Only use ID parameter now
    const idParam = searchParams.get('id') || searchParams.get('ids');
    
    if (!idParam) {
      console.log('Missing ID parameter');
      return NextResponse.json({ 
        error: 'ID parameter (id or ids) is required' 
      }, { status: 400 });
    }
    
    // Format the IDs parameter
    const cryptoIds = idParam.includes(',') ? idParam : idParam;
    console.log(`Requested crypto IDs: ${cryptoIds}`);
    
    // Create a cache key based on the IDs
    const cacheKey = `cmc:prices:id:${cryptoIds}`;
    console.log(`Cache key: ${cacheKey}`);
    
    // Try to get data from Redis cache first
    console.log('Attempting to retrieve data from Redis cache');
    const cachedData = await getFromCache<CachedData>(cacheKey);
    
    if (cachedData) {
      console.log('Cache hit! Checking freshness of data');
      
      // Vérifier si les données sont encore fraîches (moins de 20 minutes)
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
    
    // Fetch fresh data from CoinMarketCap API
    const cmcApiUrl = 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest';
    
    // Construct the API URL with the ID parameter and default to USD conversion
    const apiUrl = `${cmcApiUrl}?id=${cryptoIds}&convert=USD`;
    console.log(`Fetching from CMC API: ${apiUrl}`);
    
    const response = await fetch(apiUrl, {
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
    
    // Store the response in Redis cache
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
