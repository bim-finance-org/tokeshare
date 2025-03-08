export const fetchPAXGPrice = async (): Promise<number> => {
  try {
    const response = await fetch('/api/paxg-price');
    const data = await response.json();
    return data.price;
  } catch (error) {
    console.error('Error fetching PAXG price:', error);
    return 2898.86; 
  }
};

// Calculate TGG price based on PAXG price
export const calculateTGGPrice = (paxgPrice: number): number => {
  return paxgPrice / 31.1034768;
};

// Exchange rates (you should replace these with real-time rates from an API)
const EXCHANGE_RATES: { [key: string]: number } = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  CHF: 0.89,
  CAD: 1.35,
};

export const convertToUSD = (amount: number, fromCurrency: string): number => {
  const rate = EXCHANGE_RATES[fromCurrency] || 1;
  return amount * rate;
}; 