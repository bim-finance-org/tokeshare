import { NextResponse } from 'next/server';

export async function GET() {
  try {
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
    
    const price = await response.text();
    return NextResponse.json({ price: parseFloat(price) });
  } catch (error) {
    console.error('Error fetching PAXG price:', error);
    return NextResponse.json({ price: 2898.86 });
  }
} 