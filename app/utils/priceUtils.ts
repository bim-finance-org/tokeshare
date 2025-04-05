import { usePaxgPrice } from '../hooks/usePaxgPrice';

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

// Hook pour utiliser le prix du PAXG
export const usePAXGPrice = () => {
  const { data: paxgPrice, isLoading, error } = usePaxgPrice();
  return {
    paxgPrice: paxgPrice,
    isLoading,
    error
  };
}; 