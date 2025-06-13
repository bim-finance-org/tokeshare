import { NextResponse } from 'next/server';
import { getFromCache, setCache } from '@/lib/redis';

const CACHE_EXPIRATION = 60;

interface CachedPrice {
  price: number;
  timestamp: number;
}

export async function GET() {
  try {
    
    // key of cache for PAXG
    const cacheKey = 'paxg:price';
    
    // try to retrieve from redis cache
    const cachedData = await getFromCache<CachedPrice>(cacheKey);
    
    if (cachedData) {
      
      // check if the data is still fresh (less than 1 minute)
      const cachedTimestamp = cachedData.timestamp;
      const currentTime = Date.now();
      const dataAge = currentTime - cachedTimestamp;
      
      if (dataAge < CACHE_EXPIRATION * 1000) {
        return NextResponse.json({
          price: cachedData.price,
          source: 'redis-cache',
          cachedAt: new Date(cachedTimestamp).toISOString(),
          age: Math.round(dataAge / 1000)
        });
      }
    }
    
    // if the data is not in cache or is expired, retrieve from the API
    const response = await fetch('https://cryptoprices.cc/PAXG/', {
      method: 'GET',
      headers: {
        'Accept': 'text/plain',
        'Content-Type': 'text/plain',
      },
    });
    
    if (!response.ok) {
      return NextResponse.json(
        { error: 'Error retrieving PAXG price' },
        { status: 500 }
      );
    }
    
    const priceText = await response.text();
    const price = parseFloat(priceText);
    
    const dataToCache: CachedPrice = {
      price: price,
      timestamp: Date.now()
    };

    await setCache(cacheKey, dataToCache, CACHE_EXPIRATION);
    
    return NextResponse.json({
      price: price,
      source: 'cryptoprices-api',
      cachedAt: new Date().toISOString(),
      age: 0
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error retrieving PAXG price' },
      { status: 500 }
    );
  }
} 