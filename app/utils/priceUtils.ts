import { log } from 'console';
import { usePaxgPrice } from '../hooks/usePaxgPrice';

// Calculate TGG price based on PAXG price
export const calculateTGGPrice = (paxgPrice: number): number => {
  return paxgPrice / 31.1034768;
};

// export const convertToUSD = (amount: number, fromCurrency: string): number => {
//   const rate = EXCHANGE_RATES[fromCurrency] || 1;
//   return amount * rate;
// };
