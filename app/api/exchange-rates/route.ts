import { NextResponse } from 'next/server';
import { getFromCache, setCache } from '@/app/lib/redis';

const CACHE_EXPIRATION = 30 * 60;

const API_KEY = process.env.EXCHANGE_RATE_API_KEY;

interface CachedExchangeRates {
  rates: {
    EUR: number;
    CAD: number;
    CHF: number;
    GBP: number;
    USD: number;
  };
  base: string;
  timestamp: number;
}

/**
 * GET to retrieve the exchange rates
 * @returns The exchange rates
 */
export async function GET() {
  try {
    console.log('Exchange rates API route called');
    
    // key of cache for exchange rates
    const cacheKey = 'exchange:rates:usd';
    
    // try to retrieve from redis cache
    const cachedData = await getFromCache<CachedExchangeRates>(cacheKey);
    
    if (cachedData) {
      
      // check if the data is still fresh (less than 30 minutes)
      const cachedTimestamp = cachedData.timestamp;
      const currentTime = Date.now();
      const dataAge = currentTime - cachedTimestamp;
      
      if (dataAge < CACHE_EXPIRATION * 1000) {
        return NextResponse.json({
          rates: cachedData.rates,
          base: cachedData.base,
          source: 'redis-cache',
          cachedAt: new Date(cachedTimestamp).toISOString(),
          age: Math.round(dataAge / 1000)
        });
      }
    }
    
    // if we arrive here, either there is no data in cache, or it is expired
    // so we retrieve new data from the API
    const apiUrl = `https://v6.exchangerate-api.com/v6/${API_KEY}/latest/USD`;
    
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      return NextResponse.json(
        { error: 'Error retrieving exchange rates' },
        { status: 500 }
      );
    }
    
    const data = await response.json();
    
    if (data.result === 'error') {
      return NextResponse.json(
        { error: 'Error retrieving exchange rates' },
        { status: 500 }
      );
    }
    
    const dataToCache: CachedExchangeRates = {
      rates: {
        EUR: data.conversion_rates.EUR,
        CAD: data.conversion_rates.CAD,
        CHF: data.conversion_rates.CHF,
        GBP: data.conversion_rates.GBP,
        USD: data.conversion_rates.USD,
      },
      base: data.base_code,
      timestamp: Date.now()
    };

    await setCache(cacheKey, dataToCache, CACHE_EXPIRATION);
    
    return NextResponse.json({
      rates: dataToCache.rates,
      base: dataToCache.base,
      source: 'exchange-rate-api',
      cachedAt: new Date(dataToCache.timestamp).toISOString(),
      age: 0
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error retrieving exchange rates' },
      { status: 500 }
    );
  }
} 