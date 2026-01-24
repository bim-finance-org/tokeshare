import { ExchangeRates } from '../hooks/useExchangeRates';

/**
 * Calcule le prix du TGG basé sur le prix du PAXG
 */
export const calculateTGGPrice = (paxgPrice: number): number => {
  return paxgPrice / 31.1034768;
};

/**
 * Calcule le prix du TMC basé sur le prix du CMC20
 * 1 TMC = 1/10 CMC20
 */
export const calculateTMCPrice = (cmc20Price: number): number => {
  return cmc20Price / 10;
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
  tggPriceUSD: number,
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
export const convertTGGToStablecoin = (tggAmount: number, tggPriceUSD: number, stablecoinRate: number): number => {
  if (stablecoinRate <= 0) return 0;

  // Convertir TGG en USD
  const amountInUSD = tggAmount * tggPriceUSD;

  // Convertir USD en stablecoin
  return amountInUSD / stablecoinRate;
};

/**
 * Convertit un montant dans une devise fiat (EUR, CAD, etc.) en TGG
 * @param fiatAmount - Montant en devise fiat à convertir
 * @param fiatCurrency - Code de la devise fiat (EUR, CAD, etc.)
 * @param exchangeRates - Taux de change par rapport à USD
 * @param tggPriceUSD - Prix du TGG en USD
 * @returns Montant en TGG ou undefined si les taux ne sont pas disponibles
 */
export const convertFiatToTGG = (
  fiatAmount: number,
  fiatCurrency: string,
  exchangeRates: ExchangeRates | undefined,
  tggPriceUSD: number,
): number | undefined => {
  // Vérifier si les données nécessaires sont disponibles
  if (!exchangeRates || tggPriceUSD <= 0) return undefined;

  // Si c'est déjà en USD, pas besoin de convertir en USD
  if (fiatCurrency === 'USD') {
    return fiatAmount / tggPriceUSD;
  }

  // Vérifier si le taux pour cette devise existe
  const fiatRate = exchangeRates[fiatCurrency as keyof ExchangeRates];
  if (fiatRate === undefined) return undefined;

  // Convertir de la devise fiat vers USD
  const amountInUSD = fiatAmount / fiatRate;

  // Convertir de USD vers TGG
  return amountInUSD / tggPriceUSD;
};

/**
 * Convertit un montant de TGG en devise fiat (EUR, CAD, etc.)
 * @param tggAmount - Montant de TGG à convertir
 * @param fiatCurrency - Code de la devise fiat (EUR, CAD, etc.)
 * @param exchangeRates - Taux de change par rapport à USD
 * @param tggPriceUSD - Prix du TGG en USD
 * @returns Montant dans la devise fiat ou undefined si les taux ne sont pas disponibles
 */
export const convertTGGToFiat = (
  tggAmount: number,
  fiatCurrency: string,
  exchangeRates: ExchangeRates | undefined,
  tggPriceUSD: number,
): number | undefined => {
  // Vérifier si les données nécessaires sont disponibles
  if (!exchangeRates || tggPriceUSD <= 0) return undefined;

  // Convertir TGG en USD
  const amountInUSD = tggAmount * tggPriceUSD;

  // Si la devise cible est USD, retourner directement
  if (fiatCurrency === 'USD') {
    return amountInUSD;
  }

  // Vérifier si le taux pour cette devise existe
  const fiatRate = exchangeRates[fiatCurrency as keyof ExchangeRates];
  if (fiatRate === undefined) return undefined;

  // Convertir USD vers la devise fiat
  return amountInUSD * fiatRate;
};
