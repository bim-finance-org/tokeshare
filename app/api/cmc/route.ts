import { NextRequest, NextResponse } from 'next/server';
import { getFromCache, setCache } from '@/app/lib/redis';

const CACHE_EXPIRATION = 20 * 60;

interface CachedData {
  data: any;
  timestamp: number;
}

/**
 * GET to retrieve the prices of cryptocurrencies from CoinMarketCap
 * @param request - The request object
 * @returns The prices of cryptocurrencies
 */
export async function GET(request: NextRequest) {
  try {
    
    // Extract query parameters
    const { searchParams } = new URL(request.url);
    
    // Only use ID parameter now
    const idParam = searchParams.get('id') || searchParams.get('ids');
    
    if (!idParam) {
      return NextResponse.json({ 
        error: 'ID parameter (id or ids) is required' 
      }, { status: 400 });
    }
    
    // Format the IDs parameter
    const cryptoIds = idParam.includes(',') ? idParam : idParam;
    
    // Create a cache key based on the IDs
    const cacheKey = `cmc:prices:id:${cryptoIds}`;
    
    // Try to get data from Redis cache first
    const cachedData = await getFromCache<CachedData>(cacheKey);
    
    if (cachedData) {
      
      // Check if the data is still fresh (less than 20 minutes)
      const cachedTimestamp = cachedData.timestamp;
      const currentTime = Date.now();
      const dataAge = currentTime - cachedTimestamp;
      
      if (dataAge < CACHE_EXPIRATION * 1000) {
        return NextResponse.json({
          data: cachedData.data,
          source: 'redis-cache',
          cachedAt: new Date(cachedTimestamp).toISOString(),
          age: Math.round(dataAge / 1000)
        });
      }
    }
    
    // Fetch fresh data from CoinMarketCap API
    const cmcApiUrl = 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest';
    
    // Construct the API URL with the ID parameter and default to USD conversion
    const apiUrl = `${cmcApiUrl}?id=${cryptoIds}&convert=USD`;
    
    const response = await fetch(apiUrl, {
      headers: {
        'X-CMC_PRO_API_KEY': process.env.COINMARKETCAP_API_KEY || '',
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      return NextResponse.json(
        { error: 'Error retrieving CoinMarketCap data' },
        { status: 500 }
      );
    }

    const data = await response.json();
    
    // Prepare the data to cache with a timestamp
    const dataToCache: CachedData = {
      data: data,
      timestamp: Date.now()
    };
    
    // Store the response in Redis cache
    await setCache(cacheKey, dataToCache, CACHE_EXPIRATION); 
    
    return NextResponse.json({
      data: data,
      source: 'coinmarketcap-api',
      cachedAt: new Date().toISOString(),
      age: 0
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch data from CoinMarketCap', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
