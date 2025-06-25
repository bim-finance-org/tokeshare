import { NextRequest, NextResponse } from 'next/server';
import { getFromCache, setCache } from '@/lib/redis';
import { Period } from '@/enums/Period';

const COINGECKO_URL = "https://api.coingecko.com/api/v3/coins/pax-gold/market_chart";
const CACHE_EXPIRATION_1D = 20 * 60;
const CACHE_EXPIRATION_1Y = 6 * 60 * 60;
const DAYS_FOR_YEAR = 365;
const DAYS_FOR_DAY = 2;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period');
    const cacheKey = `coingecko:paxg:perf:${period}`;
    const cacheExpiration = period === Period.OneYear ? CACHE_EXPIRATION_1Y : CACHE_EXPIRATION_1D;

    const cached = await getFromCache<any>(cacheKey);
    if (cached) {
      return NextResponse.json({ ...cached, source: "redis-cache" });
    }

    const days = period === Period.OneYear ? DAYS_FOR_YEAR : DAYS_FOR_DAY;
    const url = `${COINGECKO_URL}?vs_currency=usd&days=${days}`;

    const resp = await fetch(url);
    if (!resp.ok) {
      const errorBody = await resp.text();
      return NextResponse.json({ error: "CoinGecko fetch failed", url, status: resp.status, errorBody }, { status: 500 });
    }
    const json = await resp.json();
    const prices: [number, number][] = json.prices;

    if (!prices || prices.length < 2) {
      return NextResponse.json({ error: "Not enough price data", debug: json }, { status: 500 });
    }

    prices.sort((a, b) => a[0] - b[0]);
    const todayPrice = prices[prices.length - 1][1];

    let result: any = {};
    if (period === Period.OneYear) {
      const oneYearAgoPrice = prices[0][1];
      const perf1y = oneYearAgoPrice ? ((todayPrice - oneYearAgoPrice) / oneYearAgoPrice) * 100 : null;
      result = {
        todayPrice,
        oneYearAgoPrice,
        perf1y,
        lastUpdate: new Date().toISOString()
      };
    } else {
      const yesterdayPrice = prices[prices.length - 2][1];
      const perf1d = yesterdayPrice ? ((todayPrice - yesterdayPrice) / yesterdayPrice) * 100 : null;
      result = {
        todayPrice,
        yesterdayPrice,
        perf1d,
        lastUpdate: new Date().toISOString()
      };
    }

    await setCache(cacheKey, result, cacheExpiration);
    return NextResponse.json({ ...result, source: "coingecko-api" });

  } catch (e) {
    return NextResponse.json({ error: "Failed to get PAXG performance", details: e instanceof Error ? e.message : e }, { status: 500 });
  }
}
