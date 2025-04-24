
/**
 * Calcule le prix du TGG basé sur le prix du PAXG
 */
export const calculateTGGPrice = (paxgPrice: number): number => {
  return paxgPrice / 31.1034768;
};

/**
 * Convertit un montant en une autre devise en utilisant un taux de change
 */
export const convertWithRate = (amount: number, rate: number): number => {
  return amount * rate;
};

/**
 * Convertit un montant de stablecoin en TGG
 * @param stablecoinAmount - Montant de stablecoin à convertir
 * @param stablecoinRate - Taux de change du stablecoin (par rapport à l'USD)
 * @param tggPriceUSD - Prix du TGG en USD
 * @returns Montant en TGG
 */
export const convertStablecoinToTGG = (
  stablecoinAmount: number,
  stablecoinRate: number,
  tggPriceUSD: number
): number => {
  if (tggPriceUSD <= 0) return 0;
  
  // Convertir stablecoin en USD
  const amountInUSD = convertWithRate(stablecoinAmount, stablecoinRate);
  
  // Convertir USD en TGG
  return amountInUSD / tggPriceUSD;
};

/**
 * Convertit un montant de TGG en stablecoin
 * @param tggAmount - Montant de TGG à convertir
 * @param tggPriceUSD - Prix du TGG en USD
 * @param stablecoinRate - Taux de change du stablecoin (par rapport à l'USD)
 * @returns Montant en stablecoin
 */
export const convertTGGToStablecoin = (
  tggAmount: number,
  tggPriceUSD: number,
  stablecoinRate: number
): number => {
  if (stablecoinRate <= 0) return 0;
  
  // Convertir TGG en USD
  const amountInUSD = tggAmount * tggPriceUSD;
  
  // Convertir USD en stablecoin
  return amountInUSD / stablecoinRate;
};
