import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // CoinMarketCap API endpoint for latest cryptocurrency quotes
    const cmcApiUrl = 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest';
    
    // Get symbol(s) from query params
    const { searchParams } = new URL(request.url);
    const symbolParam = searchParams.get('symbol') || searchParams.get('symbols');
    
    if (!symbolParam) {
      return NextResponse.json({ error: 'Symbol or symbols parameter is required' }, { status: 400 });
    }
    
    // Handle both single symbol and multiple symbols
    const symbols = symbolParam.includes(',') ? symbolParam : symbolParam;
    
    // Make request to CoinMarketCap API
    const response = await fetch(`${cmcApiUrl}?symbol=${symbols}`, {
      headers: {
        'X-CMC_PRO_API_KEY': process.env.COINMARKETCAP_API_KEY || '',
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`CoinMarketCap API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('CoinMarketCap API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data from CoinMarketCap' },
      { status: 500 }
    );
  }
}
