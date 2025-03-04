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